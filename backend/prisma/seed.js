const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
  console.log('🌱  Seeding InvenTrack — initial setup...\n');

  // ── Clear all tables (reverse dependency order) ────────────────────────────
  await prisma.payment.deleteMany();
  await prisma.bulkOrderItem.deleteMany();
  await prisma.bulkOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.truckReturn.deleteMany();
  await prisma.truckDispatch.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.truckSession.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.companySetting.deleteMany();
  console.log('  ✓ Cleared all tables');

  // ── Branches ───────────────────────────────────────────────────────────────
  const mainBranch = await prisma.branch.create({
    data: { name: 'Main Branch', location: 'Chennai — T. Nagar (HQ)' },
  });
  const northBranch = await prisma.branch.create({
    data: { name: 'North Branch', location: 'Chennai — Anna Nagar' },
  });
  const southBranch = await prisma.branch.create({
    data: { name: 'South Branch', location: 'Chennai — Adyar' },
  });
  console.log('  ✓ Branches');

  // ── Trucks ─────────────────────────────────────────────────────────────────
  const truck1 = await prisma.truck.create({ data: { name: 'Truck 1 — Beas',   plateNumber: 'TN01AB1234', branchId: mainBranch.id } });
  const truck2 = await prisma.truck.create({ data: { name: 'Truck 2 — Chenab', plateNumber: 'TN01CD5678', branchId: mainBranch.id } });
  const truck3 = await prisma.truck.create({ data: { name: 'Truck 3 — Gomti',  plateNumber: 'TN02EF9012', branchId: northBranch.id } });
  const truck4 = await prisma.truck.create({ data: { name: 'Truck 4 — Yamuna', plateNumber: 'TN03GH3456', branchId: southBranch.id } });
  console.log('  ✓ Trucks');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPwd   = await bcrypt.hash('admin123', 10);
  const managerPwd = await bcrypt.hash('manager123', 10);
  const salesPwd   = await bcrypt.hash('sales123', 10);

  await prisma.user.create({ data: { name: 'Rajan Kumar',     username: 'admin',    password: adminPwd,   role: 'ADMIN',          branchId: mainBranch.id } });
  await prisma.user.create({ data: { name: 'Priya Sharma',    username: 'manager1', password: managerPwd, role: 'BRANCH_MANAGER', branchId: mainBranch.id } });
  await prisma.user.create({ data: { name: 'Venkat Raj',      username: 'manager2', password: managerPwd, role: 'BRANCH_MANAGER', branchId: northBranch.id } });
  await prisma.user.create({ data: { name: 'Anitha Devi',     username: 'manager3', password: managerPwd, role: 'BRANCH_MANAGER', branchId: southBranch.id } });
  await prisma.user.create({ data: { name: 'Mohan Das',       username: 'sales1',   password: salesPwd,   role: 'SALES', saleType: 'SHOP',  branchId: mainBranch.id } });
  await prisma.user.create({ data: { name: 'Kavitha Nair',    username: 'sales2',   password: salesPwd,   role: 'SALES', saleType: 'SHOP',  branchId: northBranch.id } });
  await prisma.user.create({ data: { name: 'Arjun Singh',     username: 'truck1',   password: salesPwd,   role: 'SALES', saleType: 'TRUCK', branchId: mainBranch.id,  truckId: truck1.id } });
  await prisma.user.create({ data: { name: 'Dinesh Kumar',    username: 'truck2',   password: salesPwd,   role: 'SALES', saleType: 'TRUCK', branchId: mainBranch.id,  truckId: truck2.id } });
  await prisma.user.create({ data: { name: 'Senthil Murugan', username: 'truck3',   password: salesPwd,   role: 'SALES', saleType: 'TRUCK', branchId: northBranch.id, truckId: truck3.id } });
  await prisma.user.create({ data: { name: 'Ramesh Pillai',   username: 'truck4',   password: salesPwd,   role: 'SALES', saleType: 'TRUCK', branchId: southBranch.id, truckId: truck4.id } });
  console.log('  ✓ Users');

  // ── Products ───────────────────────────────────────────────────────────────
  let productCount = 0;
  for (const f of FLAVOURS) {
    await prisma.product.create({ data: { name: `${f.name} — Stick`, emoji: '🍡', costPerUnit: f.stickCost, sellingPrice: 40, piecesPerPacket: 6  } });
    await prisma.product.create({ data: { name: `${f.name} — Plate`, emoji: '🍽️', costPerUnit: 45,          sellingPrice: 75, piecesPerPacket: 16 } });
    await prisma.product.create({ data: { name: `${f.name} — Pot`,   emoji: '🪔', costPerUnit: 35,          sellingPrice: 50, piecesPerPacket: 12 } });
    productCount += 3;
  }
  console.log(`  ✓ Products (${productCount})`);

  // ── Opening Stock ──────────────────────────────────────────────────────────
  const allProducts = await prisma.product.findMany();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const prod of allProducts) {
    const openingQty = prod.piecesPerPacket * 50; // 50 packets/boxes as opening stock
    await prisma.purchase.create({
      data: {
        date:         today,
        productId:    prod.id,
        manufacturer: 'Opening Stock',
        quantity:     openingQty,
        costPerUnit:  prod.costPerUnit,
        totalCost:    Math.round(openingQty * prod.costPerUnit * 100) / 100,
        notes:        'Opening stock',
      },
    });
    await prisma.stockTransaction.create({
      data: {
        type:      'IN',
        productId: prod.id,
        branchId:  mainBranch.id,
        quantity:  openingQty,
        notes:     'Opening stock',
        createdAt: today,
      },
    });
  }
  console.log(`  ✓ Opening Stock (${allProducts.length} products × 50 packets)`);

  // ── Company Settings ───────────────────────────────────────────────────────
  await prisma.companySetting.create({
    data: {
      companyName:     'Kulfi ICE Cream Co.',
      tagline:         'Fresh · Frozen · Delicious Since 1998',
      address:         '14/A, Ice Factory Road, T. Nagar',
      city:            'Chennai',
      state:           'Tamil Nadu',
      pincode:         '600017',
      phone:           '+91 44 2434 5678',
      email:           'orders@kulfiice.com',
      website:         'www.kulfiice.com',
      gstin:           '33AABCK1234A1Z5',
      fssai:           '10020042001234',
      bankName:        'State Bank of India',
      bankAccount:     '32145678901234',
      bankIfsc:        'SBIN0001234',
      bankAccountName: 'Kulfi ICE Cream Co.',
      invoicePrefix:   'KIC',
      invoiceTerms:    'Payment due within 15 days of delivery. Goods once sold will not be taken back. Subject to Chennai jurisdiction.',
    },
  });
  console.log('  ✓ Company Settings');

  // ── Role Permissions ───────────────────────────────────────────────────────
  const MODULES = [
    'dashboard', 'purchase', 'sales', 'stock', 'reports',
    'products', 'branches', 'trucks', 'truck-sessions',
    'expenses', 'bulk-orders', 'settings', 'media',
  ];
  const PERMS = {
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    BRANCH_MANAGER: {
      dashboard:        { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      purchase:         { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      sales:            { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
      stock:            { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      reports:          { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      products:         { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      branches:         { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      trucks:           { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      'truck-sessions': { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
      expenses:         { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
      'bulk-orders':    { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
      settings:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
      media:            { canView: true,  canCreate: true,  canEdit: false, canDelete: false },
    },
    SALES: {
      dashboard:        { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      purchase:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
      sales:            { canView: true,  canCreate: true,  canEdit: false, canDelete: false },
      stock:            { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      reports:          { canView: false, canCreate: false, canEdit: false, canDelete: false },
      products:         { canView: true,  canCreate: false, canEdit: false, canDelete: false },
      branches:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
      trucks:           { canView: false, canCreate: false, canEdit: false, canDelete: false },
      'truck-sessions': { canView: true,  canCreate: true,  canEdit: false, canDelete: false },
      expenses:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
      'bulk-orders':    { canView: false, canCreate: false, canEdit: false, canDelete: false },
      settings:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
      media:            { canView: false, canCreate: false, canEdit: false, canDelete: false },
    },
  };

  for (const role of ['ADMIN', 'BRANCH_MANAGER', 'SALES']) {
    for (const module of MODULES) {
      const p = role === 'ADMIN' ? PERMS.ADMIN : PERMS[role][module];
      await prisma.rolePermission.create({ data: { role, module, ...p } });
    }
  }
  console.log('  ✓ Role Permissions');

  // ── Custom Roles ───────────────────────────────────────────────────────────
  const customRoles = [
    { name: 'DELIVERY_AGENT', label: 'Delivery Agent', color: '#F97316' },
    { name: 'ACCOUNTANT',     label: 'Accountant',     color: '#06B6D4' },
  ];
  for (const cr of customRoles) {
    await prisma.customRole.create({ data: cr });
    for (const module of MODULES) {
      await prisma.rolePermission.create({
        data: {
          role: cr.name, module,
          canView:   cr.name === 'ACCOUNTANT',
          canCreate: false, canEdit: false, canDelete: false,
        },
      });
    }
  }
  console.log('  ✓ Custom Roles');

  console.log('\n✅  Seed completed!\n');
  console.log('  Login credentials:');
  console.log('  ─────────────────────────────────────────');
  console.log('  Admin           : admin    / admin123');
  console.log('  Main Manager    : manager1 / manager123');
  console.log('  North Manager   : manager2 / manager123');
  console.log('  South Manager   : manager3 / manager123');
  console.log('  Shop Sales      : sales1   / sales123');
  console.log('  Truck Driver 1  : truck1   / sales123');
  console.log('  Truck Driver 2  : truck2   / sales123');
  console.log('  Truck Driver 3  : truck3   / sales123');
  console.log('  Truck Driver 4  : truck4   / sales123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
