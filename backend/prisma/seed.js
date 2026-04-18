const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Kulfi ICE InvenTrack database...');

  // Keep seed idempotent so demo data can be recreated.
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { name: 'Admin', username: 'admin', password: adminPassword, role: 'ADMIN' },
  });

  const salesPassword = await bcrypt.hash('sales123', 10);
  const sales1 = await prisma.user.upsert({
    where: { username: 'sales1' },
    update: {},
    create: { name: 'Sales Person', username: 'sales1', password: salesPassword, role: 'SALES' },
  });

  await prisma.user.upsert({
    where: { username: 'sales2' },
    update: {},
    create: { name: 'Sales Backup', username: 'sales2', password: salesPassword, role: 'SALES' },
  });

  const productDefs = [
    { name: 'Amul Punjabi Kulfi',        emoji: '🍦', sellingPrice: 25,  costPerUnit: 18,  manufacturer: 'Amul',          imageUrl: 'https://www.amul.com/m/images/products/icecream/amul-punjabi-kulfi_500x500.png' },
    { name: 'Kwality Walls Malai Kulfi', emoji: '🍦', sellingPrice: 25,  costPerUnit: 18,  manufacturer: 'Kwality Walls', imageUrl: 'https://www.hul.co.in/Images/kwality-walls-malai-kulfi_tcm1255-601975.png' },
    { name: 'Arun Kulfi King',           emoji: '🍦', sellingPrice: 30,  costPerUnit: 22,  manufacturer: 'Arun Ice Cream',imageUrl: 'https://arunicecreams.com/wp-content/uploads/2021/06/kulfi-king.png' },
    { name: 'Dairy Day Kulfi',           emoji: '🍦', sellingPrice: 30,  costPerUnit: 22,  manufacturer: 'Dairy Day',     imageUrl: 'https://dairyday.in/wp-content/uploads/2022/01/kulfi.png' },
    { name: 'Havmor Chowpaty Kulfi',     emoji: '🍡', sellingPrice: 50,  costPerUnit: 36,  manufacturer: 'Havmor',        imageUrl: 'https://www.havmor.com/sites/default/files/2022-06/chowpaty-kulfi.png' },
    { name: 'Havmor Matka Kulfi',        emoji: '🪔', sellingPrice: 65,  costPerUnit: 49,  manufacturer: 'Havmor',        imageUrl: 'https://www.havmor.com/sites/default/files/2022-06/matka-kulfi.png' },
    { name: 'Arun Maharaja Cup',         emoji: '🍨', sellingPrice: 70,  costPerUnit: 50,  manufacturer: 'Arun Ice Cream',imageUrl: 'https://arunicecreams.com/wp-content/uploads/2021/06/maharaja-cup.png' },
    { name: 'Amul Matka Kulfi',          emoji: '🪔', sellingPrice: 70,  costPerUnit: 50,  manufacturer: 'Amul',          imageUrl: 'https://www.amul.com/m/images/products/icecream/amul-matka-kulfi_500x500.png' },
    { name: 'Kwality Walls Kulfi Tub',   emoji: '🫙', sellingPrice: 220, costPerUnit: 166, manufacturer: 'Kwality Walls', imageUrl: 'https://www.hul.co.in/Images/kwality-walls-kulfi-tub_tcm1255-601976.png' },
    { name: 'Amul Shahi Kulfi Pack',     emoji: '👑', sellingPrice: 350, costPerUnit: 280, manufacturer: 'Amul',          imageUrl: 'https://www.amul.com/m/images/products/icecream/amul-shahi-kulfi_500x500.png' },
    { name: 'Havmor Kulfi Falooda',      emoji: '🥤', sellingPrice: 350, costPerUnit: 282, manufacturer: 'Havmor',        imageUrl: 'https://www.havmor.com/sites/default/files/2022-06/kulfi-falooda.png' },
    { name: 'Mother Dairy Kulfi Pack',   emoji: '🍨', sellingPrice: 270, costPerUnit: 200, manufacturer: 'Mother Dairy',  imageUrl: 'https://motherdairy.com/images/products/ice-cream/kulfi-pack.png' },
  ];

  const products = [];
  for (let i = 0; i < productDefs.length; i++) {
    const { name, emoji, sellingPrice, imageUrl } = productDefs[i];
    const p = await prisma.product.upsert({
      where: { id: i + 1 },
      update: { name, emoji, sellingPrice, imageUrl },
      create: { name, emoji, sellingPrice, imageUrl },
    });
    products.push({ ...p, costPerUnit: productDefs[i].costPerUnit, manufacturer: productDefs[i].manufacturer });
  }

  // Deterministic demo purchases — last 30 days
  const today = new Date();
  const purchaseOffsets = [-28, -21, -14, -7, -2];
  for (let purchaseIndex = 0; purchaseIndex < purchaseOffsets.length; purchaseIndex++) {
    const date = new Date(today);
    date.setDate(date.getDate() + purchaseOffsets[purchaseIndex]);
    for (let productIndex = 0; productIndex < products.length; productIndex++) {
      const p = products[productIndex];
      const qty = 24 + productIndex * 2 + purchaseIndex * 3;
      await prisma.purchase.create({
        data: {
          date,
          productId: p.id,
          manufacturer: p.manufacturer,
          quantity: qty,
          costPerUnit: p.costPerUnit,
          totalCost: qty * p.costPerUnit,
        },
      });
    }
  }

  // Deterministic demo sales — last 25 days
  const saleOffsets = [-25, -20, -15, -10, -5, -3, -1];
  for (let saleIndex = 0; saleIndex < saleOffsets.length; saleIndex++) {
    const date = new Date(today);
    date.setDate(date.getDate() + saleOffsets[saleIndex]);
    for (let productIndex = 0; productIndex < products.length; productIndex++) {
      const p = products[productIndex];
      const pricePerUnit = productDefs[productIndex].sellingPrice;
      const avgCostUnit = p.costPerUnit;
      const quantity = 6 + (productIndex % 5) + saleIndex;
      const salesUserId = saleIndex % 2 === 0 ? sales1.id : admin.id;

      await prisma.sale.create({
        data: {
          date,
          productId: p.id,
          userId: salesUserId,
          quantity,
          pricePerUnit,
          totalRevenue: quantity * pricePerUnit,
          avgCostUnit,
          profit: (pricePerUnit - avgCostUnit) * quantity,
        },
      });
    }
  }

  console.log('Seed completed.');
  console.log('Admin:', admin.username, '/ admin123');
  console.log('Sales:', sales1.username, '/ sales123');
  console.log(`Products: ${products.length}, Purchase batches: ${purchaseOffsets.length}, Sale batches: ${saleOffsets.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
