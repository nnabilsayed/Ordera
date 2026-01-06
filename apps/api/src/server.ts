import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@repo/database";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
// Fallback to hardcoded URL if env fails (Local Docker default)
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ordera?schema=public";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp-original.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const PORT = process.env.PORT || 3001;

console.log("Current Working Directory:", process.cwd());
console.log("DATABASE_URL Env:", process.env.DATABASE_URL);

// Helper to generate 3-char Ref Tag
function generateRefTag(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /links/generate
app.post("/links/generate", async (req, res) => {
  try {
    const { sellerId, productId, isPriceLocked } = req.body;

    if (!sellerId || !productId) {
      return res.status(400).json({ error: "Missing sellerId or productId" });
    }

    // 1. Fetch Product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Generate Ref Tag (Ensure uniqueness in a real app, simplified here)
    let refTag = generateRefTag();
    // Simple retry logic could be added here if needed

    // 3. Create LinkRef
    const linkRef = await prisma.linkRef.create({
      data: {
        seller_id: sellerId,
        product_id: productId,
        ref_tag: refTag,
        is_price_locked: isPriceLocked || false,
        locked_price: isPriceLocked ? product.base_price : null,
      },
    });

    // 4. Return Result
    const baseUrl = process.env.BASE_URL || "ordera.com";
    return res.json({
      url: `${baseUrl}/pay/${product.title.replace(/\s+/g, '-').toLowerCase()}?ref=${refTag}`,
      refTag,
      linkId: linkRef.id,
    });
  } catch (error) {
    console.error("Link Generation Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /links/:refTag
app.get("/links/:refTag", async (req, res) => {
  try {
    const { refTag } = req.params;
    console.log(`Looking up tag: ${refTag}`);

    const linkRef = await prisma.linkRef.findFirst({
      where: { ref_tag: refTag },
      include: {
        product: {
          include: { variants: true }
        },
        seller: true,
      },
    });

    if (!linkRef) {
      console.log(`Tag not found: ${refTag}`);
      return res.status(404).json({ error: "Link not found" });
    }

    const { product, seller } = linkRef;
    // Calculate effective price (locked vs current)
    const effectivePrice = linkRef.is_price_locked && linkRef.locked_price
      ? linkRef.locked_price
      : product.base_price;

    return res.json({
      product: {
        id: product.id,
        title: product.title,
        price: effectivePrice,
        isPriceLocked: linkRef.is_price_locked,
        variants: product.variants, // Pass variants to frontend
      },
      seller: {
        businessName: seller.business_name,
      },
    });
  } catch (error) {
    console.error("Link Lookup Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /products/:sellerId
app.get("/products/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const products = await prisma.product.findMany({
      where: { seller_id: sellerId },
      include: { variants: true, link_refs: true }
    });
    return res.json(products);
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /upload - Image upload endpoint
app.post("/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Return relative path (frontend will prepend API_URL)
    return res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// POST /products
app.post("/products", async (req, res) => {
  try {
    const { sellerId, title, price, basePrice, variants, imageUrl } = req.body;
    console.log("Creating Product Body:", JSON.stringify(req.body, null, 2));
    const productPrice = price || basePrice;

    if (!sellerId || !title || !productPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        seller_id: sellerId,
        title,
        base_price: parseFloat(productPrice),
        image_url: imageUrl || null, // Save product image URL
        variants: variants && variants.length > 0 ? {
          create: variants.map((v: { color: string; size: string; stock: number; imageUrl?: string }) => ({
            color: v.color,
            size: v.size,
            image_url: v.imageUrl || null,
            name: `${v.color} - ${v.size}`, // Auto-generate display name
            stock: parseInt(v.stock.toString(), 10)
          }))
        } : undefined
      },
      include: {
        variants: true
      }
    });

    console.log(`✅ Product created: ${product.title} with ${product.variants.length} variants`);
    return res.json(product);
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /orders
app.post("/orders", upload.single('paymentProof'), async (req, res) => {
  try {
    const { refTag, customerName, customerPhone, customerAddress, variantId } = req.body;
    // req.file contains the uploaded file info

    if (!refTag || !customerName || !customerPhone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Resolve LinkRef
    const linkRef = await prisma.linkRef.findFirst({
      where: { ref_tag: refTag },
      include: { product: true }
    });

    if (!linkRef) {
      return res.status(404).json({ error: "Invalid Link Reference" });
    }

    // 2. Determine Price
    const totalAmount = linkRef.is_price_locked && linkRef.locked_price
        ? linkRef.locked_price
        : linkRef.product.base_price;

    // 2.5. THE BOUNCER: Check Variant Stock (BEFORE creating order)
    if (variantId) {
      const variant = await prisma.variant.findUnique({
        where: { id: variantId }
      });

      if (!variant) {
        return res.status(400).json({ error: "Invalid variant selected" });
      }

      if (variant.stock < 1) {
        return res.status(400).json({ error: "Sorry, this item is sold out!" });
      }
    }

    // 3. Find or Create Shadow Customer
    let customer = await prisma.shadowCustomer.findFirst({
        where: {
            seller_id: linkRef.seller_id,
            phone: customerPhone
        }
    });

    if (!customer) {
        customer = await prisma.shadowCustomer.create({
            data: {
                seller_id: linkRef.seller_id,
                phone: customerPhone,
                full_name: customerName,
                address: customerAddress
            }
        });
    } else {
        customer = await prisma.shadowCustomer.update({
            where: { id: customer.id },
            data: {
                full_name: customerName,
                address: customerAddress || customer.address
            }
        });
    }

    // 4. Handle File URL
    // 4. Handle File URL
    let paymentProofUrl = req.body.paymentProof || null; // Support URL from body
    
    if (req.file) {
      // Construct full URL using request host (dynamic for LAN/Localhost)
      const protocol = req.protocol;
      const host = req.get('host'); // e.g. 192.168.1.5:3001
      paymentProofUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    // 5. Create Order (THE FIX: Save variant_id)
    const order = await prisma.order.create({
        data: {
            seller_id: linkRef.seller_id,
            customer_id: customer.id,
            link_ref_id: linkRef.id,
            variant_id: variantId || null, // ✅ NOW SAVING VARIANT ID
            total_amount: totalAmount,
            status: "pending_verification",
            payment_proof_url: paymentProofUrl
        }
    });

    // 6. THE DEDUCTION: Decrement Stock (AFTER successful order)
    if (variantId) {
      await prisma.variant.update({
        where: { id: variantId },
        data: { stock: { decrement: 1 } }
      });
      console.log(`   📦 Stock decremented for variant ${variantId}`);
    }

    console.log("💰 New Order Received: #", order.human_id);
    if (paymentProofUrl) console.log("   📎 Proof:", paymentProofUrl);

    return res.json(order);

  } catch (error) {
    console.error("Order Creation Error:", error);
    return res.status(500).json({ 
        error: "Internal Server Error", 
        details: error instanceof Error ? error.message : String(error) 
    });
  }
});


// POST /orders/manual - Point of Sale (Manual Order Creation)
app.post("/orders/manual", async (req, res) => {
  try {
    const { sellerId, customerName, customerPhone, items, isPaid } = req.body;

    // Validation
    if (!sellerId || !customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields (sellerId, customerName, customerPhone, items)" });
    }

    // Use Prisma transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or Create Customer
      let customer = await tx.shadowCustomer.findFirst({
        where: { seller_id: sellerId, phone: customerPhone }
      });

      if (!customer) {
        customer = await tx.shadowCustomer.create({
          data: {
            seller_id: sellerId,
            phone: customerPhone,
            full_name: customerName,
            address: "Manual Order"
          }
        });
      } else {
        customer = await tx.shadowCustomer.update({
          where: { id: customer.id },
          data: { full_name: customerName }
        });
      }

      // 2. Validate stock and calculate total
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const variant = await tx.variant.findUnique({
          where: { id: item.variantId },
          include: { product: true }
        });

        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${variant.product.title} (${variant.name}). Available: ${variant.stock}, Requested: ${item.quantity}`);
        }

        totalAmount += item.quantity * parseFloat(item.unitPrice);
        validatedItems.push({ variant, quantity: item.quantity, unitPrice: item.unitPrice });
      }

      // 3. Create the Order
      const order = await tx.order.create({
        data: {
          seller_id: sellerId,
          customer_id: customer.id,
          total_amount: totalAmount,
          status: isPaid ? "confirmed" : "pending_verification",
          // No link_ref for manual orders
        }
      });

      // 4. Create OrderItems and decrement stock
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            order_id: order.id,
            product_id: item.variant.product_id,
            variant_id: item.variant.id,
            quantity: item.quantity,
            unit_price: parseFloat(item.unitPrice)
          }
        });

        await tx.variant.update({
          where: { id: item.variant.id },
          data: { stock: { decrement: item.quantity } }
        });

        console.log(`   📦 Stock decremented: ${item.variant.product.title} (${item.variant.name}) by ${item.quantity}`);
      }

      console.log(`💰 Manual Order Created: #${order.human_id} | Items: ${items.length} | Total: ${totalAmount}`);

      return order;
    });

    // Fetch the complete order with relations
    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        order_items: true
      }
    });

    return res.json(fullOrder);

  } catch (error) {
    console.error("Manual Order Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    // Check if it's a stock/validation error
    if (message.includes("Insufficient stock") || message.includes("not found")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});



// PATCH /orders/:id/status
app.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Simple validation
    const validStatuses = ["confirmed", "shipped", "rejected"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });

    return res.json(order);
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /orders/:sellerId
app.get("/orders/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const orders = await prisma.order.findMany({
      where: { seller_id: sellerId },
      include: {
        customer: true,
        link_ref: {
          include: { product: true }
        },
        variant: true,
      },
      orderBy: { created_at: 'desc' }
    });
    return res.json(orders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /products
app.post("/products", async (req, res) => {
  try {
    const { sellerId, title, price, variants } = req.body;

    if (!sellerId || !title || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Default variant if none provided
    const variantsToCreate = (variants && variants.length > 0) 
        ? variants 
        : [{ name: "Standard", stock: 10 }];

    // Create Product AND Variants
    const product = await prisma.product.create({
      data: {
        seller_id: sellerId,
        title: title,
        base_price: parseFloat(price),
        variants: {
          create: variantsToCreate.map((v: any) => ({
            name: v.name,
            stock: parseInt(v.stock?.toString() || "0")
          }))
        }
      }
    });

    return res.json(product);
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /products/:id
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, image_url, variants } = req.body;

    if (!title || !price) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        title,
        base_price: parseFloat(price),
        image_url: image_url !== undefined ? image_url : undefined
      }
    });

    // Update Variants if provided
    if (variants && Array.isArray(variants)) {
        await Promise.all(variants.map((v: any) => 
            prisma.variant.update({
                where: { id: v.id },
                data: {
                    color: v.color,
                    size: v.size,
                    stock: parseInt(v.stock?.toString() || "0")
                }
            })
        ));
    }

    return res.json(product);
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /upload
app.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Return accessible URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        return res.json({ url: fileUrl });
    } catch (error) {
        console.error("Upload Error:", error);
        return res.status(500).json({ error: "Upload Failed" });
    }
});

// DELETE /products/:id
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id }
    });
    return res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /test-seed
app.get("/test-seed", async (req, res) => {
  try {
    // Check if duplicate
    const existing = await prisma.seller.findFirst({
        where: { phone: "01000000000" }
    });
    if (existing) {
        return res.json({ message: "Seed data already exists", sellerId: existing.id });
    }

    const seller = await prisma.seller.create({
      data: {
        business_name: "Ahmed Store",
        phone: "01000000000",
        products: {
            create: [
                { title: "Black T-Shirt", base_price: 150 },
                { title: "Red Dress", base_price: 300 }
            ]
        }
      },
      include: { products: true }
    });

    return res.json({ message: "Seed created", seller });
  } catch (error) {
    console.error("Seeding Error:", error);
    return res.status(500).json({ 
        error: "Internal Server Error", 
        details: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ message: "Ordera API is running", endpoints: ["/health", "/links/generate", "/links/:refTag", "/products/:sellerId", "/test-seed"] });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
