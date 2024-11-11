import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create some initial categories
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Electronics' },
      { name: 'Books' },
      { name: 'Clothing' },
      { name: 'Home & Garden' },
    ]
  });

  console.log(`Created ${categories.count} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });