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

  // Delete in dependency order
  await prisma.closingStock.deleteMany();
  await prisma.truckSaleItem.deleteMany();
  await prisma.truckSale.deleteMany();
  await prisma.truckSession.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // ── Branches ──────────────────────────────────────────────────────────────
  const mainBranch = await prisma.branch.create({
    data: { name: 'Kulfi ICE – Main Branch', address: 'Main Market, City Center' },
  });

  // ── Trucks ────────────────────────────────────────────────────────────────
  const truck1 = await prisma.truck.create({
    data: { name: 'Truck A', plateNo: 'KA01AB1234', branchId: mainBranch.id },
  });
  const truck2 = await prisma.truck.create({
    data: { name: 'Truck B', plateNo: 'KA01CD5678', branchId: mainBranch.id },
  });

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminPwd   = await bcrypt.hash('admin123',   10);
  const salesPwd   = await bcrypt.hash('sales123',   10);
  const managerPwd = await bcrypt.hash('manager123', 10);
  const truckPwd   = await bcrypt.hash('truck123',   10);

  await prisma.user.create({
    data: { name: 'Admin', username: 'admin', password: adminPwd, role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { name: 'Sales Person', username: 'sales1', password: salesPwd, role: 'SALES' },
  });
  await prisma.user.create({
    data: { name: 'Sales Backup', username: 'sales2', password: salesPwd, role: 'SALES' },
  });
  await prisma.user.create({
    data: {
      name: 'Branch Manager',
      username: 'manager1',
      password: managerPwd,
      role: 'BRANCH_MANAGER',
      branchId: mainBranch.id,
    },
  });
  await prisma.user.create({
    data: {
      name: 'Truck Driver 1',
      username: 'truck1',
      mobile: '9999900001',
      password: truckPwd,
      role: 'TRUCK_SALES',
      branchId: mainBranch.id,
    },
  });
  await prisma.user.create({
    data: {
      name: 'Truck Driver 2',
      username: 'truck2',
      mobile: '9999900002',
      password: truckPwd,
      role: 'TRUCK_SALES',
      branchId: mainBranch.id,
    },
  });

  // ── Products ──────────────────────────────────────────────────────────────
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

  const productCount = await prisma.product.count();
  console.log(`\nSeed completed.`);
  console.log(`  Products   : ${productCount}`);
  console.log(`  Branches   : 1 (Kulfi ICE – Main Branch)`);
  console.log(`  Trucks     : 2 (Truck A, Truck B)`);
  console.log(`\nCredentials:`);
  console.log(`  Admin          : admin / admin123`);
  console.log(`  Sales          : sales1 / sales123`);
  console.log(`  Branch Manager : manager1 / manager123`);
  console.log(`  Truck Sales 1  : truck1 (mobile: 9999900001) / truck123`);
  console.log(`  Truck Sales 2  : truck2 (mobile: 9999900002) / truck123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
