const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const STICK_PCS = 6;
const PLATE_PCS = 16;
const POT_PCS   = 12;

const STICK_SELL = 40;
const PLATE_SELL = 75;
const POT_SELL   = 50;

const PLATE_COST = 45;
const POT_COST   = 35;

// flavour → stick cost per piece
const FLAVOURS = [
  { name: 'Kesar Badam',      stickCost: 25.5 },
  { name: 'Shahi Gulab',      stickCost: 25.5 },
  { name: 'Black Current',    stickCost: 25.5 },
  { name: 'Dry Fruit',        stickCost: 29   },
  { name: 'Chocolate',        stickCost: 25.5 },
  { name: 'Guava',            stickCost: 25.5 },
  { name: 'Mango Malai',      stickCost: 23.5 },
  { name: 'Strawberry Malai', stickCost: 23.5 },
  { name: 'Kesar Kajoor',     stickCost: 25.5 },
  { name: 'Kesar Pista',      stickCost: 25.5 },
  { name: 'Gulkan',           stickCost: 25.5 },
  { name: 'Coconut',          stickCost: 26   },
  { name: 'Water Melon',      stickCost: 25.5 },
  { name: 'Green Apple',      stickCost: 25.5 },
  { name: 'Custard Apple',    stickCost: 25.5 },
  { name: 'Blue Berry',       stickCost: 25.5 },
  { name: 'Pista Badam',      stickCost: 25.5 },
  { name: 'Malai Kulfi',      stickCost: 23   },
];

async function main() {
  console.log('Seeding Kulfi ICE InvenTrack database...');

  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);

  await prisma.user.create({ data: { name: 'Admin',        username: 'admin',  password: adminPassword, role: 'ADMIN' } });
  await prisma.user.create({ data: { name: 'Sales Person', username: 'sales1', password: salesPassword, role: 'SALES' } });
  await prisma.user.create({ data: { name: 'Sales Backup', username: 'sales2', password: salesPassword, role: 'SALES' } });

  for (const f of FLAVOURS) {
    await prisma.product.create({ data: {
      name:            `${f.name} - Stick Kulfi`,
      emoji:           '🍡',
      costPerUnit:     f.stickCost,
      sellingPrice:    STICK_SELL,
      piecesPerPacket: STICK_PCS,
    }});
    await prisma.product.create({ data: {
      name:            `${f.name} - Plate Kulfi`,
      emoji:           '🍽️',
      costPerUnit:     PLATE_COST,
      sellingPrice:    PLATE_SELL,
      piecesPerPacket: PLATE_PCS,
    }});
    await prisma.product.create({ data: {
      name:            `${f.name} - Pot Kulfi`,
      emoji:           '🪔',
      costPerUnit:     POT_COST,
      sellingPrice:    POT_SELL,
      piecesPerPacket: POT_PCS,
    }});
  }

  const count = await prisma.product.count();
  console.log(`Seed completed. Products: ${count}`);
  console.log('Admin: admin / admin123');
  console.log('Sales: sales1 / sales123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
