/**
 * ═══════════════════════════════════════════
 *  OrbitFarms — Database Seed Script
 * ═══════════════════════════════════════════
 *
 *  Run:  node scripts/seed.js
 *
 *  What it does:
 *    1. Creates 8 categories with subcategories
 *    2. Creates 3 demo farmer accounts
 *    3. Creates 1 address per farmer
 *    4. Creates ~24 products (8 per farmer) across categories
 *
 *  ⚠️  Clears existing categories before seeding.
 *      Does NOT delete existing users/products.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const Category = require('../models/Category.model');
const User = require('../models/User.model');
const Address = require('../models/Address.model');
const Product = require('../models/Product.model');

// ─── Category + SubCategory Data ─────────────────────────
const CATEGORIES = [
  {
    Category: 'Fresh Produce',
    subCategory: ['Vegetables', 'Fruits', 'Leafy Greens', 'Herbs & Medicinal Plants'],
  },
  {
    Category: 'Grains & Staples',
    subCategory: ['Whole Grains', 'Pulses & Lentils', 'Rice Varieties', 'Millets'],
  },
  {
    Category: 'Dry Fruits & Nuts',
    subCategory: ['Almonds', 'Cashews', 'Raisins', 'Walnuts', 'Pistachios'],
  },
  {
    Category: 'Dairy & Animal Products',
    subCategory: ['Milk', 'Cheese & Paneer', 'Butter & Ghee', 'Eggs', 'Honey'],
  },
  {
    Category: 'Spices & Masale',
    subCategory: ['Whole Spices', 'Ground Spices', 'Spice Blends', 'Dry Chillies'],
  },
  {
    Category: 'Seeds & Farming Inputs',
    subCategory: ['Vegetable Seeds', 'Flower Seeds', 'Fertilizers', 'Pesticides', 'Tools'],
  },
  {
    Category: 'Organic',
    subCategory: ['Organic Vegetables', 'Organic Fruits', 'Organic Grains', 'Organic Spices'],
  },
  {
    Category: 'Beverages & Oils',
    subCategory: ['Cold-Pressed Oils', 'Sugarcane Juice', 'Herbal Teas', 'Coconut Oil'],
  },
];

// ─── Demo Farmer Accounts ─────────────────────────────────
const FARMERS = [
  { fullName: 'Rajesh Kumar', email: 'rajesh@orbitfarms.demo', phone: '9876543210', password: 'farmer123', role: 'farmer' },
  { fullName: 'Meena Devi',   email: 'meena@orbitfarms.demo',  phone: '9876543211', password: 'farmer123', role: 'farmer' },
  { fullName: 'Arjun Singh',  email: 'arjun@orbitfarms.demo',  phone: '9876543212', password: 'farmer123', role: 'farmer' },
];

// ─── Demo Addresses (one per farmer) ──────────────────────
const ADDRESSES = [
  { fullName: 'Rajesh Kumar', phoneNo: 9876543210, state: 'Punjab', city: 'Amritsar', postalCode: 143001, addressLine: 'Village Khasa, GT Road', lat: 31.6340, long: 74.8723 },
  { fullName: 'Meena Devi',   phoneNo: 9876543211, state: 'Maharashtra', city: 'Nashik', postalCode: 422001, addressLine: 'Deolali Farm Area', lat: 19.9975, long: 73.7898 },
  { fullName: 'Arjun Singh',  phoneNo: 9876543212, state: 'Uttar Pradesh', city: 'Lucknow', postalCode: 226001, addressLine: 'Chinhat Farm Belt', lat: 26.8467, long: 80.9462 },
];

// ─── Product Data (8 per farmer = 24 total) ───────────────
// Each product has 3 curated Unsplash images matched to the item
const PRODUCT_TEMPLATES = [
  // ── Farmer 0 — Rajesh (Punjab: wheat, rice, dairy) ──
  {
    title: 'Organic Basmati Rice', catIdx: 1, sub: 'Rice Varieties', price: 120, unit: 'kg', stock: 500, isOrganic: true,
    desc: 'Long-grain aromatic basmati rice from Punjab farms. Perfectly aged for 1 year for the best flavor.',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
      'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80',
      'https://images.unsplash.com/photo-1594313898968-a99cbfce0b60?w=600&q=80',
    ],
  },
  {
    title: 'Fresh Spinach Bundle', catIdx: 0, sub: 'Leafy Greens', price: 30, unit: 'kg', stock: 100,
    desc: 'Crisp, dark green spinach leaves harvested same morning. Rich in iron and vitamins.',
    images: [
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80',
      'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=600&q=80',
      'https://images.unsplash.com/photo-1515686811547-3b4b5130e05e?w=600&q=80',
    ],
  },
  {
    title: 'Whole Wheat Atta', catIdx: 1, sub: 'Whole Grains', price: 55, unit: 'kg', stock: 300,
    desc: 'Stone-ground whole wheat flour from Sharbati wheat. Perfect for making soft rotis.',
    images: [
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
      'https://images.unsplash.com/photo-1556908153-2ad61cf75b07?w=600&q=80',
    ],
  },
  {
    title: 'Pure Desi Ghee', catIdx: 3, sub: 'Butter & Ghee', price: 650, unit: 'kg', stock: 50,
    desc: 'Traditional hand-churned desi ghee from grass-fed cow milk. Golden and aromatic.',
    images: [
      'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',
      'https://images.unsplash.com/photo-1612187242456-923e8e9e2407?w=600&q=80',
    ],
  },
  {
    title: 'Raw Multiflora Honey', catIdx: 3, sub: 'Honey', price: 350, unit: 'kg', stock: 80,
    desc: 'Unprocessed raw honey from beekeepers in Punjab. Rich in natural enzymes and antioxidants.',
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&q=80',
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=600&q=80',
    ],
  },
  {
    title: 'Moong Dal (Split)', catIdx: 1, sub: 'Pulses & Lentils', price: 110, unit: 'kg', stock: 200,
    desc: 'Clean, polished moong dal. Cooks quickly and is easy to digest. Perfect for khichdi.',
    images: [
      'https://images.unsplash.com/photo-1612257999756-2f1a67e8e809?w=600&q=80',
      'https://images.unsplash.com/photo-1585996834833-e1a9e2091200?w=600&q=80',
      'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&q=80',
    ],
  },
  {
    title: 'Farm-Fresh Tomatoes', catIdx: 0, sub: 'Vegetables', price: 40, unit: 'kg', stock: 150,
    desc: 'Vine-ripened red tomatoes. Juicy and perfect for curries, salads, and chutneys.',
    images: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
      'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=600&q=80',
      'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=600&q=80',
    ],
  },
  {
    title: 'Pure Mustard Oil', catIdx: 7, sub: 'Cold-Pressed Oils', price: 180, unit: 'litre', stock: 100,
    desc: 'Cold-pressed kachi ghani mustard oil. Pungent aroma and perfect for Indian cooking.',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7f28d9e5e5e2?w=600&q=80',
      'https://images.unsplash.com/photo-1611070961560-9b4e1111a2a3?w=600&q=80',
      'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600&q=80',
    ],
  },

  // ── Farmer 1 — Meena (Maharashtra: fruits, spices, organic) ──
  {
    title: 'Alphonso Mangoes (Hapus)', catIdx: 0, sub: 'Fruits', price: 800, unit: 'dozen', stock: 200,
    desc: 'GI-tagged Ratnagiri Alphonso mangoes. Sweet, aromatic, and fiber-free. Seasonal delight.',
    images: [
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80',
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80',
      'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80',
    ],
  },
  {
    title: 'Organic Turmeric Powder', catIdx: 4, sub: 'Ground Spices', price: 220, unit: 'kg', stock: 150, isOrganic: true,
    desc: 'Lakadong turmeric with 7%+ curcumin content. Deep golden color, naturally dried.',
    images: [
      'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
      'https://images.unsplash.com/photo-1607438007177-e75cfec1e0b0?w=600&q=80',
    ],
  },
  {
    title: 'Fresh Coriander Leaves', catIdx: 0, sub: 'Herbs & Medicinal Plants', price: 20, unit: 'kg', stock: 80,
    desc: 'Freshly picked coriander with strong aroma. Essential for garnishing Indian dishes.',
    images: [
      'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&q=80',
      'https://images.unsplash.com/photo-1590402494610-2c378a9114c6?w=600&q=80',
      'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=600&q=80',
    ],
  },
  {
    title: 'Premium Cashew Nuts', catIdx: 2, sub: 'Cashews', price: 750, unit: 'kg', stock: 100,
    desc: 'W320 grade whole cashews from Konkan region. Crunchy and naturally sweet.',
    images: [
      'https://images.unsplash.com/photo-1607113308187-c85b55651746?w=600&q=80',
      'https://images.unsplash.com/photo-1563292900-8c6a7f967d2e?w=600&q=80',
      'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&q=80',
    ],
  },
  {
    title: 'Garam Masala Blend', catIdx: 4, sub: 'Spice Blends', price: 280, unit: 'kg', stock: 60,
    desc: 'Traditional 13-spice garam masala. Hand-roasted and freshly ground for maximum aroma.',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
      'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',
      'https://images.unsplash.com/photo-1599021456807-25db0f320f70?w=600&q=80',
    ],
  },
  {
    title: 'Organic Pomegranates', catIdx: 6, sub: 'Organic Fruits', price: 150, unit: 'kg', stock: 120, isOrganic: true,
    desc: 'Bhagwa variety pomegranates. Ruby red arils, sweet-tart flavor. Farm-fresh and chemical-free.',
    images: [
      'https://images.unsplash.com/photo-1615485020940-93c7f5281d2e?w=600&q=80',
      'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&q=80',
      'https://images.unsplash.com/photo-1603392513242-e2b0c52cf5f1?w=600&q=80',
    ],
  },
  {
    title: 'Farm Eggs (Free Range)', catIdx: 3, sub: 'Eggs', price: 90, unit: 'dozen', stock: 300,
    desc: 'Free-range country chicken eggs. Darker yolk, richer taste. Hens fed natural grain diet.',
    images: [
      'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=600&q=80',
      'https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=600&q=80',
      'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&q=80',
    ],
  },
  {
    title: 'Ragi Flour (Finger Millet)', catIdx: 1, sub: 'Millets', price: 85, unit: 'kg', stock: 180,
    desc: 'Stone-ground ragi flour rich in calcium and iron. Great for dosas, rotis, and porridge.',
    images: [
      'https://images.unsplash.com/photo-1609252924198-d9a0a8e5e20e?w=600&q=80',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
    ],
  },

  // ── Farmer 2 — Arjun (UP: veggies, seeds, dairy) ──
  {
    title: 'Fresh Green Peas', catIdx: 0, sub: 'Vegetables', price: 60, unit: 'kg', stock: 200,
    desc: 'Sweet and tender green peas. Freshly shelled from Lucknow farms. Perfect for pulao and curry.',
    images: [
      'https://images.unsplash.com/photo-1563565375-192e0b49b7e8?w=600&q=80',
      'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&q=80',
      'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&q=80',
    ],
  },
  {
    title: 'Paneer (Cottage Cheese)', catIdx: 3, sub: 'Cheese & Paneer', price: 320, unit: 'kg', stock: 60,
    desc: 'Fresh homemade paneer from full-cream buffalo milk. Soft, spongy, and chemical-free.',
    images: [
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',
      'https://images.unsplash.com/photo-1612187242456-923e8e9e2407?w=600&q=80',
    ],
  },
  {
    title: 'Sabja Seeds (Basil Seeds)', catIdx: 5, sub: 'Vegetable Seeds', price: 200, unit: 'kg', stock: 90,
    desc: 'Premium quality basil seeds for drinks and desserts. Rich in fiber and cooling properties.',
    images: [
      'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=600&q=80',
      'https://images.unsplash.com/photo-1542223616-9de9adb5e3e8?w=600&q=80',
      'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&q=80',
    ],
  },
  {
    title: 'Kashmiri Red Chilli', catIdx: 4, sub: 'Dry Chillies', price: 350, unit: 'kg', stock: 70,
    desc: 'Mild heat, deep red color. Perfect for adding vibrant color to curries without excess spice.',
    images: [
      'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=600&q=80',
      'https://images.unsplash.com/photo-1596097635092-6cc38d59b6f1?w=600&q=80',
      'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600&q=80',
    ],
  },
  {
    title: 'California Almonds', catIdx: 2, sub: 'Almonds', price: 680, unit: 'kg', stock: 100,
    desc: 'Grade A almonds. Crunchy, slightly sweet. Great for snacking, milk, or garnishing.',
    images: [
      'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80',
      'https://images.unsplash.com/photo-1574570068095-29bcb6e5023a?w=600&q=80',
      'https://images.unsplash.com/photo-1617898773656-8bed05ababa3?w=600&q=80',
    ],
  },
  {
    title: 'Fresh Cauliflower', catIdx: 0, sub: 'Vegetables', price: 35, unit: 'piece', stock: 250,
    desc: 'Large, tight-headed white cauliflower. Freshly harvested. Perfect for gobi curry or paratha.',
    images: [
      'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80',
      'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=600&q=80',
      'https://images.unsplash.com/photo-1613743898084-e26272be1519?w=600&q=80',
    ],
  },
  {
    title: 'Organic Wheat Seeds', catIdx: 5, sub: 'Vegetable Seeds', price: 45, unit: 'kg', stock: 500, isOrganic: true,
    desc: 'High-yield Sharbati wheat seeds for next season planting. Treated and certified.',
    images: [
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80',
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&q=80',
    ],
  },
  {
    title: 'A2 Cow Milk', catIdx: 3, sub: 'Milk', price: 70, unit: 'litre', stock: 100,
    desc: 'Fresh A2 milk from Gir cows. Delivered within 4 hours of milking. Rich and creamy.',
    images: [
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80',
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',
      'https://images.unsplash.com/photo-1523473827533-2a64d0d36748?w=600&q=80',
    ],
  },
];

// ──────────────────────────────────────────────────────────
//  Main Seed Function
// ──────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MongoUrl);
    console.log('✅ Connected to MongoDB\n');

    // 1. Seed Categories
    console.log('📦 Seeding categories...');
    await Category.deleteMany({});
    const createdCategories = await Category.insertMany(CATEGORIES);
    console.log(`   Created ${createdCategories.length} categories\n`);

    // 2. Create Farmer Accounts (skip if email exists)
    console.log('👨‍🌾 Creating farmer accounts...');
    const farmerIds = [];
    for (const farmer of FARMERS) {
      let user = await User.findOne({ email: farmer.email });
      if (!user) {
        user = await User.create(farmer);
        console.log(`   Created: ${farmer.fullName}`);
      } else {
        console.log(`   Exists:  ${farmer.fullName}`);
      }
      farmerIds.push(user._id);
    }
    console.log('');

    // 3. Create Addresses (one per farmer)
    console.log('📍 Creating addresses...');
    const addressIds = [];
    for (let i = 0; i < ADDRESSES.length; i++) {
      let addr = await Address.findOne({ phoneNo: ADDRESSES[i].phoneNo });
      if (!addr) {
        addr = await Address.create({
          ...ADDRESSES[i],
          userId: farmerIds[i],
        });
        console.log(`   Created address for ${ADDRESSES[i].fullName}`);
      } else {
        console.log(`   Exists address for ${ADDRESSES[i].fullName}`);
      }
      addressIds.push(addr._id);
    }
    console.log('');

    // 4. Seed Products
    console.log('🌾 Seeding products...');
    let created = 0;
    for (let i = 0; i < PRODUCT_TEMPLATES.length; i++) {
      const tpl = PRODUCT_TEMPLATES[i];
      const farmerIdx = i < 8 ? 0 : i < 16 ? 1 : 2;

      const existing = await Product.findOne({ title: tpl.title, userId: farmerIds[farmerIdx] });
      if (existing) {
        console.log(`   Exists: ${tpl.title}`);
        continue;
      }

      await Product.create({
        userId: farmerIds[farmerIdx],
        title: tpl.title,
        description: tpl.desc,
        categoryId: createdCategories[tpl.catIdx]._id,
        subCategory: tpl.sub,
        price: tpl.price,
        unit: tpl.unit,
        stock: tpl.stock,
        images: tpl.images,
        isOrganic: tpl.isOrganic || false,
        isVeg: true,
        addressId: addressIds[farmerIdx],
        location: {
          type: 'Point',
          coordinates: [ADDRESSES[farmerIdx].long, ADDRESSES[farmerIdx].lat],
        },
        averageRating: +(3.5 + Math.random() * 1.5).toFixed(1),
        numberOfReviews: Math.floor(5 + Math.random() * 50),
      });
      created++;
      console.log(`   ✅ ${tpl.title}`);
    }

    console.log(`\n🎉 Seed complete! Created ${created} products.\n`);
    console.log('Demo login credentials:');
    console.log('  Email: rajesh@orbitfarms.demo  Password: farmer123');
    console.log('  Email: meena@orbitfarms.demo   Password: farmer123');
    console.log('  Email: arjun@orbitfarms.demo   Password: farmer123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
