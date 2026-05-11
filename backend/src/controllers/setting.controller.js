const prisma = require('../config/db');

const ALLOWED_FIELDS = [
  'companyName', 'tagline', 'logoUrl',
  'address', 'city', 'state', 'pincode',
  'phone', 'email', 'website',
  'gstin', 'fssai',
  'bankName', 'bankAccount', 'bankIfsc', 'bankAccountName',
  'invoicePrefix', 'invoiceTerms',
];

const getSettings = async (req, res) => {
  let s = await prisma.companySetting.findFirst();
  if (!s) s = await prisma.companySetting.create({ data: {} });
  return res.json(s);
};

const updateSettings = async (req, res) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  let s = await prisma.companySetting.findFirst();
  if (!s) {
    s = await prisma.companySetting.create({ data });
  } else {
    s = await prisma.companySetting.update({ where: { id: s.id }, data });
  }
  return res.json(s);
};

module.exports = { getSettings, updateSettings };
