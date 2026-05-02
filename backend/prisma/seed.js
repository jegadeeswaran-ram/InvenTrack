require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const MODULES = ['Sales', 'Stock', 'Dispatch', 'Closing', 'ShopSales', 'Products', 'Reports', 'Users', 'Expenses', 'Settings'];

const PRODUCTS = [
  { name: 'Mango Kulfi',         category: 'Kulfi',   sku: 'KUL-MNG-001', price: 30,  costPrice: 18, unit: 'PCS', openingStock: 200, minStockAlert: 20 },
  { name: 'Kesar Kulfi',         category: 'Kulfi',   sku: 'KUL-KSR-002', price: 35,  costPrice: 20, unit: 'PCS', openingStock: 150, minStockAlert: 15 },
  { name: 'Chocolate Kulfi',     category: 'Kulfi',   sku: 'KUL-CHC-003', price: 40,  costPrice: 24, unit: 'PCS', openingStock: 180, minStockAlert: 20 },
  { name: 'Mixed Fruit Kulfi',   category: 'Kulfi',   sku: 'KUL-MXF-004', price: 35,  costPrice: 20, unit: 'PCS', openingStock: 120, minStockAlert: 10 },
  { name: 'Rose Kulfi',          category: 'Special', sku: 'KUL-RSE-005', price: 45,  costPrice: 28, unit: 'PCS', openingStock: 100, minStockAlert: 10 },
  { name: 'Kesar Badam Kulfi',   category: 'Premium', sku: 'KUL-KBD-006', price: 55,  costPrice: 34, unit: 'PCS', openingStock: 80,  minStockAlert: 8  },
  { name: 'Dry Fruit Kulfi',     category: 'Premium', sku: 'KUL-DRF-007', price: 60,  costPrice: 38, unit: 'PCS', openingStock: 60,  minStockAlert: 6  },
  { name: 'Pista Kulfi',         category: 'Premium', sku: 'KUL-PST-008', price: 50,  costPrice: 31, unit: 'PCS', openingStock: 90,  minStockAlert: 8  },
  { name: 'Coconut Kulfi',       category: 'Kulfi',   sku: 'KUL-CCN-009', price: 32,  costPrice: 19, unit: 'PCS', openingStock: 130, minStockAlert: 12 },
  { name: 'Strawberry Kulfi',    category: 'Kulfi',   sku: 'KUL-STB-010', price: 35,  costPrice: 21, unit: 'PCS', openingStock: 110, minStockAlert: 10 },
  { name: 'Kulfi Family Box',    category: 'Box',     sku: 'KUL-BX-011',  price: 200, costPrice: 130,unit: 'BOX', openingStock: 40,  minStockAlert: 5  },
  { name: 'Assorted Kulfi Box',  category: 'Box',     sku: 'KUL-BX-012',  price: 250, costPrice: 160,unit: 'BOX', openingStock: 30,  minStockAlert: 5  },
];

async function main() {
  console.log('Seeding Kulfi ICE InvenTrack v2 database...');

  // Branches
  const branch1 = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Main Branch', address: '123 Main Street, Chennai', phone: '9876543210' },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'North Branch', address: '456 North Avenue, Chennai', phone: '9876543211' },
  });

  console.log('Branches:', branch1.name, branch2.name);

  // Users
  const adminHash   = await bcrypt.hash('admin@123', 10);
  const managerHash = await bcrypt.hash('manager@123', 10);
  const salesHash   = await bcrypt.hash('sales@123', 10);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@kulfi.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@kulfi.com', mobile: '9000000001', passwordHash: adminHash, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where:  { email: 'manager@kulfi.com' },
    update: {},
    create: { name: 'Branch Manager', email: 'manager@kulfi.com', mobile: '9000000002', passwordHash: managerHash, role: 'BRANCH_MANAGER', branchId: branch1.id },
  });

  await prisma.user.upsert({
    where:  { email: 'sales@kulfi.com' },
    update: {},
    create: { name: 'Sales Person One', email: 'sales@kulfi.com', mobile: '9000000003', passwordHash: salesHash, role: 'SALESPERSON', branchId: branch1.id },
  });

  await prisma.user.upsert({
    where:  { email: 'sales2@kulfi.com' },
    update: {},
    create: { name: 'Sales Person Two', email: 'sales2@kulfi.com', mobile: '9000000004', passwordHash: salesHash, role: 'SALESPERSON', branchId: branch1.id },
  });

  console.log('Users seeded: admin, manager, 2 salespersons');

  // Products + BranchStock
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where:  { sku: p.sku },
      update: {},
      create: p,
    });

    for (const branch of [branch1, branch2]) {
      await prisma.branchStock.upsert({
        where:  { branchId_productId: { branchId: branch.id, productId: product.id } },
        update: {},
        create: { branchId: branch.id, productId: product.id, quantity: p.openingStock },
      });
    }
  }

  console.log(`Products seeded: ${PRODUCTS.length}`);

  // Permissions
  const defaultPerms = {
    BRANCH_MANAGER: { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
    SALESPERSON:    { canView: true,  canCreate: true,  canEdit: false, canDelete: false },
  };

  for (const role of ['BRANCH_MANAGER', 'SALESPERSON']) {
    for (const module of MODULES) {
      await prisma.permission.upsert({
        where:  { role_module: { role, module } },
        update: {},
        create: { role, module, ...defaultPerms[role] },
      });
    }
  }

  console.log('Permissions seeded');
  console.log('\nSeed complete!');
  console.log('Credentials:');
  console.log('  Admin:   admin@kulfi.com   / admin@123');
  console.log('  Manager: manager@kulfi.com / manager@123');
  console.log('  Sales:   sales@kulfi.com   / sales@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
