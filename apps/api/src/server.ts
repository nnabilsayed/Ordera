import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@repo/database";

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
    });
    return res.json(products);
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

import multer from "multer";
import path from "path";
import fs from "fs";

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

// Serve Uploads Static Folder
app.use('/uploads', express.static(path.join(__dirname, "../uploads")));

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
    let paymentProofUrl = null;
    if (req.file) {
      // Construct full URL using request host (dynamic for LAN/Localhost)
      const protocol = req.protocol;
      const host = req.get('host'); // e.g. 192.168.1.5:3001
      paymentProofUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    // 5. Create Order
    const order = await prisma.order.create({
        data: {
            seller_id: linkRef.seller_id,
            customer_id: customer.id,
            link_ref_id: linkRef.id,
            total_amount: totalAmount,
            status: "pending_verification",
            payment_proof_url: paymentProofUrl
        }
    });

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
