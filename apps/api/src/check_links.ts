import { PrismaClient } from "@repo/database";

const prisma = new PrismaClient();

async function main() {
  const links = await prisma.linkRef.findMany({
    include: { 
      product: {
        include: { variants: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });
  
  console.log(`\n🔗 Found ${links.length} links:\n`);
  links.forEach((link, i) => {
    console.log(`${i + 1}. Ref Tag: ${link.ref_tag}`);
    console.log(`   Product: ${link.product.title} (ID: ${link.product.id})`);
    console.log(`   Variants: ${link.product.variants.length}`);
    if (link.product.variants.length > 0) {
      link.product.variants.forEach(v => {
        console.log(`     - ${v.color} / ${v.size} (Stock: ${v.stock})`);
      });
    }
    console.log('');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
