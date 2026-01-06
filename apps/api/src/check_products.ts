import { PrismaClient } from "@repo/database";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { id: 'desc' }
  });
  
  console.log(`\n📦 Found ${products.length} products:\n`);
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} (Price: ${p.base_price})`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Variants (${p.variants.length}):`);
    if (p.variants.length > 0) {
      p.variants.forEach(v => {
        console.log(`     - ${v.color} / ${v.size} (Stock: ${v.stock})`);
      });
    } else {
      console.log(`     (No variants)`);
    }
    console.log('');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
