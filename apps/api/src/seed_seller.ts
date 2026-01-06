import { PrismaClient } from "@repo/database";

const prisma = new PrismaClient();

async function main() {
  // Create the seller that the app expects
  const seller = await prisma.seller.upsert({
    where: { id: "dc5d47ce-0235-4f1b-9269-6f84b458100b" },
    update: {},
    create: {
      id: "dc5d47ce-0235-4f1b-9269-6f84b458100b",
      business_name: "Test Seller",
      phone: "+201234567890",
      instapay_handle: "@testseller",
      instapay_phone: "01234567890"
    }
  });
  
  console.log("✅ Seller created:", seller.business_name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
