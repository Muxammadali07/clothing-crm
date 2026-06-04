require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const Activity = require('../models/Activity');
const InventoryItem = require('../models/InventoryItem');
const AuditLog = require('../models/AuditLog');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB — clearing all collections...');

  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Lead.deleteMany({}),
    Opportunity.deleteMany({}),
    Activity.deleteMany({}),
    InventoryItem.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const manager = await User.create({
    name: 'Sarah Manager',
    email: 'manager@crm.test',
    passwordHash: 'Manager123!',
    role: 'manager',
  });
  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@crm.test',
    passwordHash: 'Admin123!',
    role: 'admin',
  });
  console.log('Users seeded.');

  const customers = await Customer.insertMany([
    { name: 'Lena Kovacs', company: 'Nova Retail Ltd', email: 'lena@novaretail.com', phone: '+1-555-0101', status: 'active', assignedTo: admin._id, createdBy: admin._id },
    { name: 'Omar Patel', company: 'Blue Thread Co', email: 'omar@bluethread.com', phone: '+1-555-0102', status: 'active', assignedTo: admin._id, createdBy: admin._id },
    { name: 'Chloe Martins', company: 'Artisan Wear', email: 'chloe@artisanwear.com', phone: '+1-555-0103', status: 'prospect', assignedTo: manager._id, createdBy: manager._id },
    { name: 'James Osei', company: 'Pinnacle Clothing', email: 'james@pinnacle.com', phone: '+1-555-0104', status: 'active', assignedTo: admin._id, createdBy: admin._id },
    { name: 'Priya Singh', company: 'Urban Edge', email: 'priya@urbanedge.com', phone: '+1-555-0105', status: 'inactive', assignedTo: manager._id, createdBy: manager._id },
    { name: 'Tom Breaux', company: 'Loom & Co', email: 'tom@loomco.com', phone: '+1-555-0106', status: 'prospect', assignedTo: admin._id, createdBy: admin._id },
  ]);
  console.log('Customers seeded.');

  const leads = await Lead.insertMany([
    { name: 'Fashion Forward Inc', source: 'Website', status: 'new', value: 12000, owner: admin._id, email: 'info@fashionforward.com', company: 'Fashion Forward Inc' },
    { name: 'Style House', source: 'Referral', status: 'contacted', value: 8500, owner: admin._id, email: 'hello@stylehouse.com', company: 'Style House' },
    { name: 'Denim Republic', source: 'Trade Show', status: 'qualified', value: 22000, owner: manager._id, email: 'sales@denimrepublic.com', company: 'Denim Republic' },
    { name: 'Canvas & Thread', source: 'Cold Email', status: 'new', value: 5000, owner: admin._id, email: 'contact@canvasthread.com', company: 'Canvas & Thread' },
    { name: 'ModernWear Ltd', source: 'LinkedIn', status: 'lost', value: 3200, owner: manager._id, email: 'info@modernwear.com', company: 'ModernWear Ltd' },
    { name: 'The Stitch Co', source: 'Website', status: 'qualified', value: 15000, owner: admin._id, email: 'buy@stitchco.com', company: 'The Stitch Co' },
  ]);
  console.log('Leads seeded.');

  const opps = await Opportunity.insertMany([
    { title: 'Q3 Bulk Order – Nova Retail', customer: customers[0]._id, stage: 'proposal', amount: 18500, owner: admin._id, closeDate: new Date('2026-08-15') },
    { title: 'Seasonal Collection – Blue Thread', customer: customers[1]._id, stage: 'negotiation', amount: 27000, owner: admin._id, closeDate: new Date('2026-07-30') },
    { title: 'Artisan Wear Pilot', customer: customers[2]._id, stage: 'prospecting', amount: 5200, owner: manager._id, closeDate: new Date('2026-09-01') },
    { title: 'Pinnacle Winter Range', customer: customers[3]._id, stage: 'won', amount: 45000, owner: admin._id, closeDate: new Date('2026-06-01') },
    { title: 'Urban Edge Spring Drop', customer: customers[4]._id, stage: 'lost', amount: 9000, owner: manager._id, closeDate: new Date('2026-05-15') },
  ]);
  console.log('Opportunities seeded.');

  await Activity.insertMany([
    { type: 'call', note: 'Discussed Q3 pricing', relatedTo: customers[0]._id, relatedModel: 'Customer', dueDate: new Date('2026-06-10'), completed: false, owner: admin._id },
    { type: 'email', note: 'Sent proposal PDF', relatedTo: opps[0]._id, relatedModel: 'Opportunity', dueDate: new Date('2026-06-08'), completed: true, owner: admin._id },
    { type: 'meeting', note: 'Intro call scheduled', relatedTo: leads[0]._id, relatedModel: 'Lead', dueDate: new Date('2026-06-12'), completed: false, owner: admin._id },
    { type: 'task', note: 'Prepare contract draft', relatedTo: opps[1]._id, relatedModel: 'Opportunity', dueDate: new Date('2026-06-07'), completed: false, owner: manager._id },
    { type: 'call', note: 'Follow-up on winter range', relatedTo: customers[3]._id, relatedModel: 'Customer', dueDate: new Date('2026-06-15'), completed: false, owner: admin._id },
  ]);
  console.log('Activities seeded.');

  await InventoryItem.insertMany([
    { sku: 'HOD-BLK-L', productName: 'Classic Hoodie Black', category: 'Hoodies', quantity: 240, price: 28.50, createdBy: manager._id },
    { sku: 'HOD-GRY-M', productName: 'Classic Hoodie Grey', category: 'Hoodies', quantity: 185, price: 28.50, createdBy: manager._id },
    { sku: 'TEE-WHT-M', productName: 'Premium Tee White', category: 'Tees', quantity: 500, price: 12.00, createdBy: manager._id },
    { sku: 'TEE-BLK-XL', productName: 'Premium Tee Black', category: 'Tees', quantity: 430, price: 12.00, createdBy: manager._id },
    { sku: 'CRG-KHK-32', productName: 'Cargo Pants Khaki 32', category: 'Cargo Pants', quantity: 95, price: 42.00, createdBy: manager._id },
    { sku: 'JKT-OLV-L', productName: 'Field Jacket Olive', category: 'Jackets', quantity: 60, price: 78.00, createdBy: manager._id },
    { sku: 'SHT-NVY-M', productName: 'Shorts Navy', category: 'Shorts', quantity: 310, price: 22.50, createdBy: manager._id },
    { sku: 'ACC-CAP-ONE', productName: 'Branded Cap', category: 'Accessories', quantity: 200, price: 15.00, createdBy: manager._id },
  ]);
  console.log('Inventory seeded.');

  console.log('\n Seed complete.');
  console.log('  manager@crm.test  /  Manager123!');
  console.log('  admin@crm.test    /  Admin123!');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
