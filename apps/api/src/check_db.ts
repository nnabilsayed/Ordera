import { PrismaClient } from "@repo/database";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true }
  });
  console.log("Found " + products.length + " products");
  products.forEach(p => {
    console.log(`Product: ${p.title} (ID: ${p.id})`);
    console.log(`Variants (${p.variants.length}):`, p.variants.map(v => `${v.name} - ${v.color || 'no color'}`).join(', '));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
