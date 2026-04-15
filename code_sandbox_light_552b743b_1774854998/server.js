import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import multer from 'multer';
import next from 'next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my_website';
let bucket;

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Example MongoDB Schema
const ContactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', ContactSchema);

// Product Image Schema
const ProductImageSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    data: String, // Store as base64 string or gridfs:ID
    uploadedAt: { type: Date, default: Date.now }
});

const ProductImage = mongoose.model('ProductImage', ProductImageSchema);

// Example API route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: '3D Pixel Printing Backend is running (ESM)', 
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' 
    });
});

// Endpoint for image upload
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        if (!bucket) {
            return res.status(500).json({ success: false, error: 'Storage system not ready' });
        }

        console.log('UPLOAD REQUEST:', req.file.originalname, req.file.size);

        const uploadStream = bucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype
        });
        
        const fileId = uploadStream.id;

        uploadStream.on('finish', async () => {
            try {
                const newImage = new ProductImage({
                    filename: req.file.originalname,
                    contentType: req.file.mimetype,
                    data: 'gridfs:' + fileId.toString()
                });

                await newImage.save();
                console.log('UPLOAD SUCCESS:', newImage._id);
                res.status(201).json({ success: true, imageId: newImage._id });
            } catch (saveErr) {
                console.error('UPLOAD SAVE ERROR:', saveErr);
                res.status(500).json({ success: false, error: saveErr.message });
            }
        });

        uploadStream.on('error', (err) => {
            console.error('GRIDFS UPLOAD ERROR:', err);
            res.status(500).json({ success: false, error: err.message });
        });

        uploadStream.end(req.file.buffer);
    } catch (error) {
        console.error('UPLOAD CATCH ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Product Schema
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
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
    customer: {
        name: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        pin: String,
        state: String
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        qty: Number,
        emoji: String
    }],
    subtotal: Number,
    gst: Number,
    total: Number,
    paymentMethod: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// STL Job Schema
const STLJobSchema = new mongoose.Schema({
    customer: {
        name: String,
        phone: String,
        address: String,
        city: String,
        pin: String,
        state: String,
        gst: String
    },
    filename: String,
    fileData: String,
    settings: {
        material: String,
        color: String,
        layerHeight: String,
        infill: Number,
        quantity: Number,
        volume: Number,
        supports: String,
        finish: String,
        instructions: String
    },
    quote: {
        materialCost: Number,
        electricityCost: Number,
        laborCost: Number,
        depreciationCost: Number,
        maintenanceCost: Number,
        overhead: Number,
        profit: Number,
        subtotal: Number,
        gst: Number,
        shipping: Number,
        total: Number
    },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const STLJob = mongoose.model('STLJob', STLJobSchema);

// Global Settings Schema
const SettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed
});
const Settings = mongoose.model('Settings', SettingsSchema);

// Coupon Schema
const CouponSchema = new mongoose.Schema({
    code: { type: String, unique: true, uppercase: true },
    type: { type: String, enum: ['Percentage', 'Flat'], default: 'Percentage' },
    value: Number,
    minOrder: Number,
    expiry: Date,
    uses: { type: Number, default: 0 },
    maxUses: Number,
    status: { type: String, default: 'active' }
});
const Coupon = mongoose.model('Coupon', CouponSchema);

// User Schema (Basic for management)
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    role: { type: String, default: 'customer' },
    status: { type: String, default: 'active' },
    lastLogin: Date,
    totalOrders: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// API Endpoints
app.get('/api/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/coupons', async (req, res) => {
    try {
        const newCoupon = new Coupon(req.body);
        await newCoupon.save();
        res.json({ success: true, coupon: newCoupon });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/coupons/:id', async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, user: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/settings/pricing', async (req, res) => {
    try {
        let config = await Settings.findOne({ key: 'pricing_framework' });
        if (!config) {
            // Default values if not set
            config = {
                key: 'pricing_framework',
                value: {
                    ELECTRICITY_RATE: 7,
                    LABOR_RATE: 400,
                    DEPRECIATION_RATE: 8,
                    MAINTENANCE_RATE: 0.20,
                    OVERHEAD_PCT: 8,
                    PROFIT_PCT: 25,
                    PRINTER_WATTAGE: 150,
                    GST_PCT: 18,
                    MIN_SHIPPING: 100,
                    FREE_SHIPPING_THRESHOLD: 2000,
                    MATERIALS: [
                        { name: 'PLA', price: 1000, unit: 'kg', color: '#ffffff', density: 1.24 },
                        { name: 'PETG', price: 1300, unit: 'kg', color: '#1a3aff', density: 1.27 },
                        { name: 'ABS', price: 1200, unit: 'kg', color: '#ff4b2b', density: 1.04 },
                        { name: 'Resin', price: 2200, unit: 'L', color: '#ffd700', density: 1.10 },
                        { name: 'TPU', price: 1800, unit: 'kg', color: '#00e676', density: 1.21 }
                    ],
                    FINISHES: [
                        { name: 'Standard (As-printed)', price: 0 },
                        { name: 'Sanded Smooth', price: 150 },
                        { name: 'Painted', price: 299 },
                        { name: 'Primed & Sanded', price: 199 }
                    ],
                    COLORS: [
                        { name: 'White', hex: '#ffffff' },
                        { name: 'Black', hex: '#000000' },
                        { name: 'Grey', hex: '#808080' },
                        { name: 'Royal Blue', hex: '#1a3aff' },
                        { name: 'Gold', hex: '#ffd700' }
                    ],
                    LAYER_HEIGHTS: [
                        { name: '0.10mm — Ultra Fine', value: '0.1', multiplier: 1.4 },
                        { name: '0.15mm — Fine', value: '0.15', multiplier: 1.2 },
                        { name: '0.20mm — Standard', value: '0.2', multiplier: 1.0 },
                        { name: '0.25mm — Draft', value: '0.25', multiplier: 0.85 },
                        { name: '0.30mm — Fast', value: '0.3', multiplier: 0.7 }
                    ]
                }
            };
        }
        res.json(config.value);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/settings/pricing', async (req, res) => {
    try {
        const updated = await Settings.findOneAndUpdate(
            { key: 'pricing_framework' },
            { key: 'pricing_framework', value: req.body },
            { upsert: true, new: true }
        );
        res.json({ success: true, config: updated.value });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ success: true, message: 'Product saved!', product: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ success: false, error: 'Product not found' });
        res.json({ success: true, message: 'Product updated!', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ success: false, error: 'Product not found' });
        res.json({ success: true, message: 'Product deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        console.log('ORDER REQUEST:', JSON.stringify(req.body));
        const newOrder = new Order(req.body);
        const saved = await newOrder.save();
        console.log('ORDER SAVED SUCCESS:', saved._id);
        res.status(201).json({ success: true, message: 'Order placed!', orderId: saved._id });
    } catch (error) {
        console.error('ORDER SAVE ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/stl-jobs', async (req, res) => {
    try {
        console.log('STL JOB REQUEST:', JSON.stringify(req.body));
        const newJob = new STLJob(req.body);
        const saved = await newJob.save();
        console.log('STL JOB SAVED SUCCESS:', saved._id);
        res.status(201).json({ success: true, message: 'STL Job submitted!', jobId: saved._id });
    } catch (error) {
        console.error('STL JOB SAVE ERROR:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stl-jobs', async (req, res) => {
    try {
        const jobs = await STLJob.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('imageIds');
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stl-jobs/:id', async (req, res) => {
    try {
        const job = await STLJob.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().populate('imageIds');
        res.json(products);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/orders/:id', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!updatedOrder) return res.status(404).json({ success: false, error: 'Order not found' });
        res.json({ success: true, message: 'Order status updated!', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/image/:id', async (req, res) => {
    try {
        const image = await ProductImage.findById(req.params.id);
        if (!image) return res.status(404).send('Image not found');

        if (image.data && image.data.startsWith('gridfs:')) {
            const gridfsId = image.data.split(':')[1];
            res.contentType(image.contentType);
            const downloadStream = bucket.openDownloadStream(new mongoose.mongo.ObjectId(gridfsId));
            downloadStream.on('data', (chunk) => res.write(chunk));
            downloadStream.on('error', () => res.status(404).send('Not found'));
            downloadStream.on('end', () => res.end());
        } else {
            const imgBuffer = Buffer.from(image.data, 'base64');
            res.contentType(image.contentType);
            res.send(imgBuffer);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Global error logging middleware
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

async function start() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Successfully connected to MongoDB.');
        bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

        await nextApp.prepare();
        app.use((req, res) => {
            if (req.url === '/' || req.url === '/index.html') return res.sendFile(path.join(__dirname, 'public', 'index.html'));
            return handle(req, res);
        });

        app.listen(PORT, () => {
            console.log(`3D Pixel Printing Server is running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Startup Error:', err);
        process.exit(1);
    }
}

start();

