import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my_website';

// Product Schema (must match server.js)
const ProductSchema = new mongoose.Schema({
    sku: String,
    name: String,
    brand: String,
    category: String,
    price: Number,
    original: Number,
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    emoji: String,
    badge: String,
    stock: Number,
    lowStockAlert: Number,
    description: String,
    imageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductImage' }],
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);

const allProducts = [
  // PRINTERS
  { id: 1, name: 'Bambu Lab X1 Carbon Combo', brand: 'Bambu Lab', category: 'printers', price: 124999, original: 139999, rating: 4.9, reviews: 234, emoji: '🖨️', badge: 'Best Seller', stock: 1, description: 'Multi-material 600mm/s speed CoreXY 3D printer with AMS', sku: 'BL-X1C-001', imageUrl: 'https://picsum.photos/id/1/600/600' },
  { id: 2, name: 'Creality K1 Max Speed 300mm/s', brand: 'Creality', category: 'printers', price: 54999, original: 64999, rating: 4.7, reviews: 187, emoji: '🖨️', badge: 'Hot', stock: 1, description: 'Large format high-speed 3D printer 300x300x300mm', sku: 'CR-K1MAX-002', imageUrl: 'https://picsum.photos/id/2/600/600' },
  { id: 3, name: 'Prusa MK4S Complete Kit', brand: 'Prusa', category: 'printers', price: 42999, original: 48999, rating: 4.8, reviews: 312, emoji: '🖨️', badge: '', stock: 1, description: 'Fully open-source reliable FDM 3D printer', sku: 'PR-MK4S-003', imageUrl: 'https://picsum.photos/id/3/600/600' },
  { id: 7, name: 'Elegoo Mars 4 DLP Resin', brand: 'Elegoo', category: 'printers', price: 22999, original: 27999, rating: 4.6, reviews: 143, emoji: '🖨️', badge: 'Deal', stock: 1, description: 'High precision DLP resin printer for detailed models', sku: 'EL-MARS4-007', imageUrl: 'https://picsum.photos/id/4/600/600' },
  { id: 9, name: 'Bambu Lab P1S Enclosed', brand: 'Bambu Lab', category: 'printers', price: 89999, original: 99999, rating: 4.8, reviews: 98, emoji: '🖨️', badge: 'New', stock: 1, description: 'Fully enclosed high-speed 3D printer with multi-color', sku: 'BL-P1S-009', imageUrl: 'https://picsum.photos/id/5/600/600' },
  { id: 10, name: 'Anycubic Kobra 3 Combo', brand: 'Anycubic', category: 'printers', price: 34999, original: 39999, rating: 4.5, reviews: 76, emoji: '🖨️', badge: '', stock: 1, description: 'Beginner-friendly multi-color printer with ACE Pro', sku: 'AC-K3C-010', imageUrl: 'https://picsum.photos/id/6/600/600' },
  { id: 11, name: 'Creality Ender 3 V3 Plus', brand: 'Creality', category: 'printers', price: 19999, original: 22999, rating: 4.4, reviews: 289, emoji: '🖨️', badge: '', stock: 1, description: 'Entry-level workhorse 3D printer for beginners', sku: 'CR-E3V3P-011', imageUrl: 'https://picsum.photos/id/7/600/600' },
  { id: 12, name: 'Prusa MINI+ Semi-Assembled', brand: 'Prusa', category: 'printers', price: 26999, original: 29999, rating: 4.7, reviews: 155, emoji: '🖨️', badge: '', stock: 0, description: 'Compact reliable 3D printer for small spaces', sku: 'PR-MINI-012', imageUrl: 'https://picsum.photos/id/8/600/600' },

  // FILAMENTS
  { id: 4, name: 'eSUN PLA+ 1kg Silk Black', brand: 'eSUN', category: 'filaments', price: 1299, original: 1599, rating: 4.6, reviews: 541, emoji: '🧵', badge: 'Top Rated', stock: 1, description: '1.75mm premium PLA+ filament, excellent layer adhesion', sku: 'ES-PLA-BLK-004', imageUrl: 'https://picsum.photos/id/9/600/600' },
  { id: 5, name: 'Polymaker PolyTerra PLA 1kg', brand: 'Polymaker', category: 'filaments', price: 1499, original: 1799, rating: 4.7, reviews: 289, emoji: '🧵', badge: 'Eco', stock: 1, description: 'Plant-based eco-friendly matte PLA filament', sku: 'PM-PTERRA-005', imageUrl: 'https://picsum.photos/id/10/600/600' },
  { id: 13, name: 'eSUN PETG 1kg Transparent', brand: 'eSUN', category: 'filaments', price: 1399, original: 1699, rating: 4.5, reviews: 198, emoji: '🧵', badge: '', stock: 1, description: '1.75mm PETG filament, food-safe, tough and flexible', sku: 'ES-PETG-TRN-013', imageUrl: 'https://picsum.photos/id/11/600/600' },
  { id: 14, name: 'Polymaker ABS 1kg White', brand: 'Polymaker', category: 'filaments', price: 1249, original: 1499, rating: 4.4, reviews: 134, emoji: '🧵', badge: '', stock: 1, description: '1.75mm ABS filament, high temperature resistance', sku: 'PM-ABS-WHT-014', imageUrl: 'https://picsum.photos/id/12/600/600' },
  { id: 15, name: 'Bambu Lab PETG-CF 1kg', brand: 'Bambu Lab', category: 'filaments', price: 3499, original: 3999, rating: 4.8, reviews: 67, emoji: '🧵', badge: 'Premium', stock: 1, description: 'Carbon fiber reinforced PETG for structural parts', sku: 'BL-PETGCF-015', imageUrl: 'https://picsum.photos/id/13/600/600' },
  { id: 16, name: 'eSUN TPU 95A 1kg Black', brand: 'eSUN', category: 'filaments', price: 1699, original: 1999, rating: 4.5, reviews: 112, emoji: '🧵', badge: '', stock: 1, description: 'Flexible TPU filament for rubber-like prints', sku: 'ES-TPU95-016', imageUrl: 'https://picsum.photos/id/14/600/600' },
  { id: 17, name: 'Elegoo ABS-Like Resin 500ml', brand: 'Elegoo', category: 'filaments', price: 1599, original: 1899, rating: 4.6, reviews: 234, emoji: '🧵', badge: 'Resin', stock: 1, description: 'High detail UV resin for LCD/DLP 3D printers', sku: 'EL-RESIN-017', imageUrl: 'https://picsum.photos/id/15/600/600' },

  // PARTS
  { id: 6, name: 'Bambu Lab AMS Lite', brand: 'Bambu Lab', category: 'parts', price: 8999, original: 10999, rating: 4.5, reviews: 95, emoji: '⚙️', badge: 'New', stock: 1, description: 'Automatic Multi-material System for Bambu printers', sku: 'BL-AMSL-006', imageUrl: 'https://picsum.photos/id/16/600/600' },
  { id: 8, name: 'Creality Sprite Extruder Pro', brand: 'Creality', category: 'parts', price: 2499, original: 2999, rating: 4.4, reviews: 178, emoji: '⚙️', badge: '', stock: 1, description: 'All-metal direct drive extruder for Ender 3 series', sku: 'CR-SPRITE-008', imageUrl: 'https://picsum.photos/id/17/600/600' },
  { id: 18, name: 'E3D V6 HotEnd Kit 1.75mm', brand: 'E3D', category: 'parts', price: 3499, original: 3999, rating: 4.7, reviews: 321, emoji: '⚙️', badge: '', stock: 1, description: 'Industry standard all-metal hotend for 285°C+', sku: 'E3D-V6-018', imageUrl: 'https://picsum.photos/id/18/600/600' },
  { id: 19, name: 'BIQU BX Nozzle 0.4mm', brand: 'BIQU', category: 'parts', price: 299, original: 399, rating: 4.3, reviews: 445, emoji: '⚙️', badge: '', stock: 1, description: 'Hardened steel nozzle, perfect for abrasive filaments', sku: 'BQ-NOZZ04-019', imageUrl: 'https://picsum.photos/id/19/600/600' },
  { id: 20, name: 'Bambu Lab Build Plate PEI', brand: 'Bambu Lab', category: 'parts', price: 1999, original: 2499, rating: 4.6, reviews: 88, emoji: '⚙️', badge: '', stock: 1, description: 'Textured PEI double-sided build plate for P1/X1 series', sku: 'BL-PEIPLT-020', imageUrl: 'https://picsum.photos/id/20/600/600' },
  { id: 21, name: '3DXTech Carbon Fiber Tube', brand: '3DXTech', category: 'parts', price: 899, original: 1099, rating: 4.2, reviews: 56, emoji: '⚙️', badge: '', stock: 1, description: 'PTFE-lined carbon fiber tube for direct drive upgrade', sku: 'XT-CFTUBE-021', imageUrl: 'https://picsum.photos/id/21/600/600' },

  // ACCESSORIES
  { id: 22, name: '3D Pixel Printing Tool Kit Deluxe', brand: '3D Pixel Printing', category: 'accessories', price: 1799, original: 2199, rating: 4.8, reviews: 156, emoji: '🔧', badge: 'Exclusive', stock: 1, description: '22-piece complete 3D printing maintenance & removal toolkit', sku: 'PR-TOOL-022', imageUrl: 'https://picsum.photos/id/22/600/600' },
  { id: 23, name: 'Creality Enclosure Kit Large', brand: 'Creality', category: 'accessories', price: 3499, original: 4299, rating: 4.4, reviews: 89, emoji: '🔧', badge: '', stock: 1, description: 'Foldable heat-retention enclosure for ABS/ASA printing', sku: 'CR-ENCLG-023', imageUrl: 'https://picsum.photos/id/23/600/600' },
  { id: 24, name: 'Magnetic Scraper 3D Print', brand: '3D Pixel Printing', category: 'accessories', price: 499, original: 699, rating: 4.5, reviews: 234, emoji: '🔧', badge: '', stock: 1, description: 'Professional-grade bed scraper with magnetic holder', sku: 'PR-SCRAP-024', imageUrl: 'https://picsum.photos/id/24/600/600' },
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');
        
        await Product.deleteMany({});
        console.log('Cleared existing products.');
        
        const productsToInsert = allProducts.map(p => ({
            ...p,
            stock: p.stock > 0 ? 10 : 0 // giving default stock of 10 if stock is true
        }));

        const result = await Product.insertMany(productsToInsert);
        console.log(`Successfully seeded ${result.length} products.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
