import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
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
const JWT_SECRET = process.env.JWT_SECRET || '3dpixelprinting_secret_key_2025';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my_website';
let bucket;

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // In a real implementation, you would check against a database
    // For now, we'll use the demo credentials from README.md
    const validCredentials = {
      'admin@3dpixelprinting.in': {
        password: 'Admin@2025',
        roles: ['superadmin', 'subadmin']
      }
    };

    if (!validCredentials[email]) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (password !== validCredentials[email].password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!validCredentials[email].roles.includes(role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized role' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email, 
        role,
        userId: 'admin_user_id' 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token, 
      user: { 
        email, 
        role 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Protected Admin Routes Middleware
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (req.user.role !== 'superadmin' && req.user.role !== 'subadmin') {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  
  next();
};

// Admin Stats Route (Protected)
app.get('/api/admin/stats', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const stlJobCount = await STLJob.countDocuments();
    const userCount = await User.countDocuments();
    
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    
    res.json({ 
      success: true,
      stats: {
        products: productCount,
        orders: orderCount,
        stlJobs: stlJobCount,
        users: userCount
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
    sku: { type: String, unique: true },
    name: String,
    brand: String,
    category: String,
    price: Number,
    original: Number,
    rating: { type: Number, default: 4.5 },
    reviews: { type: Number, default: 0 },
    emoji: String,
    badge: String,
    stock: { type: Number, default: 0 },
    lowStockAlert: { type: Number, default: 5 },
    description: String,
    imageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductImage' }],
    imageUrl: String,
    featuredImage: mongoose.Schema.Types.ObjectId,
    isFeatured: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
    tags: [String],
    specs: { type: Map, of: String }, // Flexible technical specs
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
    timeline: [{
        status: String,
        date: { type: Date, default: Date.now },
        remark: String
    }],
    adminNotes: [{
        text: String,
        date: { type: Date, default: Date.now },
        author: { type: String, default: 'Admin' }
    }],
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
    printerId: String,
    workflowTimeline: [{
        status: String,
        date: { type: Date, default: Date.now },
        remark: String,
        updatedBy: { type: String, default: 'Admin' }
    }],
    slicingSpecs: {
        wallLoops: { type: Number, default: 2 },
        topLayers: { type: Number, default: 4 },
        bottomLayers: { type: Number, default: 3 },
        supportType: { type: String, default: 'auto' },
        brimType: { type: String, default: 'auto' },
        infillPattern: { type: String, default: 'grid' }
    },
    weightEst: Number,
    thumbnailId: mongoose.Schema.Types.ObjectId,
    adminNotes: [{
        text: String,
        date: { type: Date, default: Date.now },
        author: { type: String, default: 'Admin' }
    }],
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

// Repair Request Schema
const RepairRequestSchema = new mongoose.Schema({
    customer: { name: String, email: String, phone: String, address: String },
    device: String,
    issue: String,
    urgency: { type: String, default: 'medium' },
    status: { type: String, default: 'pending' }, // pending, assigned, in_repair, completed, cancelled
    technician: String,
    estimate: Number,
    createdAt: { type: Date, default: Date.now }
});
const RepairRequest = mongoose.model('RepairRequest', RepairRequestSchema);

// AMC Plan Schema - Enhanced
const AMCPlanSchema = new mongoose.Schema({
    customer: { 
        name: String, 
        email: String, 
        phone: String,
        address: String,
        gstin: String
    },
    planName: String,
    planLevel: { type: String, enum: ['Basic', 'Standard', 'Premium', 'Enterprise'], default: 'Standard' },
    startDate: { type: Date, default: Date.now },
    expiryDate: Date,
    billingCycle: { type: String, enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'], default: 'Annual' },
    price: Number,
    includesGST: { type: Boolean, default: true },
    gstAmount: Number,
    totalAmount: Number,
    
    // Service inclusions
    includedServices: [{
        service: String,
        visits: { type: Number, default: 1 },
        maxHours: { type: Number, default: 2 },
        emergency: { type: Boolean, default: false },
        description: String
    }],
    
    // Service scheduling
    scheduledVisits: [{
        visitDate: Date,
        status: { type: String, enum: ['pending', 'scheduled', 'completed', 'cancelled'], default: 'pending' },
        technician: String,
        notes: String,
        hoursSpent: Number,
        cost: Number
    }],
    
    // Billing history
    billingHistory: [{
        invoiceNumber: String,
        period: String,
        amount: Number,
        date: { type: Date, default: Date.now },
        status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
        paymentMethod: String
    }],
    
    status: { type: String, enum: ['active', 'expired', 'pending', 'suspended', 'cancelled'], default: 'active' },
    autoRenew: { type: Boolean, default: true },
    
    // Service metrics
    usageStats: {
        totalVisits: { type: Number, default: 0 },
        completedVisits: { type: Number, default: 0 },
        emergencyVisits: { type: Number, default: 0 },
        totalHours: { type: Number, default: 0 },
        lastServiceDate: Date
    },
    
    notes: [{ 
        text: String, 
        category: { type: String, enum: ['General', 'Technical', 'Billing', 'Service', 'Customer'], default: 'General' },
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        status: { type: String, enum: ['none', 'follow-up', 'resolved', 'escalated'], default: 'none' },
        isPinned: { type: Boolean, default: false },
        assignedTo: String,
        dueDate: Date,
        date: { type: Date, default: Date.now },
        author: { type: String, default: 'Admin' }
    }],
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate totals
AMCPlanSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Calculate GST if not set
    if (this.includesGST && this.price && !this.gstAmount) {
        this.gstAmount = Math.round(this.price * 0.18 * 100) / 100; // 18% GST
        this.totalAmount = this.price + this.gstAmount;
    } else if (!this.includesGST) {
        this.gstAmount = 0;
        this.totalAmount = this.price;
    }
    
    next();
});
const AMCPlan = mongoose.model('AMCPlan', AMCPlanSchema);

// API Endpoints
app.get('/api/repairs', async (req, res) => {
    try {
        const repairs = await RepairRequest.find().sort({ createdAt: -1 });
        res.json(repairs);
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.patch('/api/repairs/:id', async (req, res) => {
    try {
        const updated = await RepairRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, repair: updated });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/amc', async (req, res) => {
    try {
        const amc = await AMCPlan.find().sort({ createdAt: -1 });
        res.json(amc);
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.patch('/api/amc/:id', async (req, res) => {
    try {
        const updated = await AMCPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, amc: updated });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// AMC Validation Middleware
function validateAMCPlan(req, res, next) {
    const amcData = req.body;
    const errors = [];

    // Basic validation
    if (!amcData.customer?.name) {
        errors.push('Customer name is required');
    }
    if (!amcData.planName) {
        errors.push('Plan name is required');
    }
    if (!amcData.price || amcData.price < 0) {
        errors.push('Valid price is required');
    }
    if (!amcData.expiryDate || new Date(amcData.expiryDate) <= new Date()) {
        errors.push('Valid expiry date is required');
    }

    // Service validation
    if (amcData.includedServices) {
        amcData.includedServices.forEach((service, index) => {
            if (!service.service) {
                errors.push(`IncludedServices[${index}]: service name is required`);
            }
            if (service.visits !== undefined && service.visits < 0) {
                errors.push(`IncludedServices[${index}]: visits cannot be negative`);
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    
    next();
}

// Enhanced AMC endpoints
app.post('/api/amc', validateAMCPlan, async (req, res) => {
    try {
        const newAMC = new AMCPlan(req.body);
        await newAMC.save();
        res.status(201).json({ success: true, amc: newAMC });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/amc/:id/notes', async (req, res) => {
    try {
        const amc = await AMCPlan.findById(req.params.id);
        if (!amc) return res.status(404).json({ success: false, error: 'AMC not found' });
        
        const note = {
            text: req.body.text,
            category: req.body.category || 'General',
            priority: req.body.priority || 'medium',
            status: req.body.status || 'none',
            isPinned: req.body.isPinned || false,
            assignedTo: req.body.assignedTo,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
            date: req.body.date ? new Date(req.body.date) : new Date(),
            author: req.body.author || 'Admin'
        };
        
        amc.notes.push(note);
        await amc.save();
        res.json({ success: true, notes: amc.notes });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/amc/:id/visits', async (req, res) => {
    try {
        const amc = await AMCPlan.findById(req.params.id);
        if (!amc) return res.status(404).json({ success: false, error: 'AMC not found' });
        
        const visit = {
            visitDate: new Date(req.body.visitDate || Date.now()),
            status: req.body.status || 'scheduled',
            technician: req.body.technician,
            notes: req.body.notes,
            hoursSpent: req.body.hoursSpent || 0,
            cost: req.body.cost || 0
        };
        
        amc.scheduledVisits.push(visit);
        
        // Update usage stats
        if (visit.status === 'completed') {
            amc.usageStats.totalVisits = (amc.usageStats.totalVisits || 0) + 1;
            amc.usageStats.completedVisits = (amc.usageStats.completedVisits || 0) + 1;
            amc.usageStats.totalHours = (amc.usageStats.totalHours || 0) + (visit.hoursSpent || 0);
            amc.usageStats.lastServiceDate = new Date();
        }
        
        await amc.save();
        res.json({ success: true, visits: amc.scheduledVisits });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/amc/:id/billing', async (req, res) => {
    try {
        const amc = await AMCPlan.findById(req.params.id);
        if (!amc) return res.status(404).json({ success: false, error: 'AMC not found' });
        
        const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
        const billingRecord = {
            invoiceNumber,
            period: req.body.period || `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
            amount: req.body.amount || amc.totalAmount || amc.price,
            date: new Date(req.body.date || Date.now()),
            status: req.body.status || 'pending',
            paymentMethod: req.body.paymentMethod || 'Unknown'
        };
        
        amc.billingHistory.push(billingRecord);
        await amc.save();
        res.json({ success: true, billing: amc.billingHistory });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/amc/stats/overview', async (req, res) => {
    try {
        const activeAMCs = await AMCPlan.countDocuments({ status: 'active' });
        const expiredAMCs = await AMCPlan.countDocuments({ status: 'expired' });
        const pendingAMCs = await AMCPlan.countDocuments({ status: 'pending' });
        
        const totalRevenue = await AMCPlan.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        const recentVisits = await AMCPlan.aggregate([
            { $unwind: '$scheduledVisits' },
            { $match: { 'scheduledVisits.status': 'completed', 'scheduledVisits.visitDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: null, count: { $sum: 1 }, hours: { $sum: '$scheduledVisits.hoursSpent' } } }
        ]);
        
        res.json({
            success: true,
            stats: {
                active: activeAMCs,
                expired: expiredAMCs,
                pending: pendingAMCs,
                totalRevenue: totalRevenue[0]?.total || 0,
                recentVisits: recentVisits[0]?.count || 0,
                recentHours: recentVisits[0]?.hours || 0
            }
        });
        
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/amc/expiring-soon', async (req, res) => {
    try {
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const expiringAMCs = await AMCPlan.find({
            status: 'active',
            expiryDate: { $lte: thirtyDaysFromNow, $gt: new Date() }
        }).sort({ expiryDate: 1 });
        
        res.json({ success: true, amcs: expiringAMCs });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/amc/:id/renew', async (req, res) => {
    try {
        const amc = await AMCPlan.findById(req.params.id);
        if (!amc) return res.status(404).json({ success: false, error: 'AMC not found' });
        
        const renewalPeriod = req.body.period || amc.billingCycle || 'Annual';
        const renewalMonths = {
            'Monthly': 1,
            'Quarterly': 3,
            'Semi-Annual': 6,
            'Annual': 12
        }[renewalPeriod] || 12;
        
        // Create renewal record
        const renewal = new AMCPlan({
            ...amc.toObject(),
            _id: new mongoose.Types.ObjectId(),
            startDate: amc.expiryDate,
            expiryDate: new Date(amc.expiryDate.getTime() + renewalMonths * 30 * 24 * 60 * 60 * 1000),
            billingHistory: [],
            scheduledVisits: [],
            usageStats: { totalVisits: 0, completedVisits: 0, emergencyVisits: 0, totalHours: 0 },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        await renewal.save();
        
        // Update old AMC status
        amc.status = 'expired';
        await amc.save();
        
        res.json({ success: true, renewedAMC: renewal });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// Enhanced AMC endpoints
app.delete('/api/amc/:id', async (req, res) => {
    try {
        const deleted = await AMCPlan.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, error: 'AMC not found' });
        res.json({ success: true, message: 'AMC plan deleted successfully' });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/amc/:id', async (req, res) => {
    try {
        const amc = await AMCPlan.findById(req.params.id);
        if (!amc) return res.status(404).json({ success: false, error: 'AMC not found' });
        res.json({ success: true, amc });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// AMC export functionality
app.get('/api/amc/export/csv', async (req, res) => {
    try {
        const amcs = await AMCPlan.find().sort({ createdAt: -1 });
        
        let csv = 'Customer Name,Email,Phone,Plan Name,Level,Start Date,Expiry Date,Price,Status\n';
        amcs.forEach(amc => {
            csv += `"${amc.customer?.name || ''}","${amc.customer?.email || ''}","${amc.customer?.phone || ''}","${amc.planName}","${amc.planLevel}","${amc.startDate.toISOString().split('T')[0]}","${amc.expiryDate.toISOString().split('T')[0]}","${amc.totalAmount}","${amc.status}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=amc-plans-export.csv');
        res.send(csv);
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// AMC search with filters
app.get('/api/amc/search', async (req, res) => {
    try {
        const { query, status, planLevel } = req.query;
        let filter = {};
        
        if (query) {
            filter.$or = [
                { 'customer.name': { $regex: query, $options: 'i' } },
                { 'customer.email': { $regex: query, $options: 'i' } },
                { 'planName': { $regex: query, $options: 'i' } }
            ];
        }
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (planLevel && planLevel !== 'all') {
            filter.planLevel = planLevel;
        }
        
        const amcs = await AMCPlan.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, amcs });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.patch('/api/amc/:id/notes/:noteId', async (req, res) => {
    try {
        const amc = await AMCPlan.findById(req.params.id);
        if (!amc) return res.status(404).json({ success: false, error: 'AMC not found' });
        
        const note = amc.notes.id(req.params.noteId);
        if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
        
        if (req.body.text !== undefined) note.text = req.body.text;
        if (req.body.category !== undefined) note.category = req.body.category;
        if (req.body.status !== undefined) note.status = req.body.status;
        if (req.body.isPinned !== undefined) note.isPinned = req.body.isPinned;
        if (req.body.date !== undefined) note.date = new Date(req.body.date);
        
        await amc.save();
        res.json({ success: true, notes: amc.notes });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/amc/:id/notes/:noteId', async (req, res) => {
    try {
        const amc = await AMCPlan.findById(req.params.id);
        if (!amc) return res.status(404).json({ success: false, error: 'AMC not found' });
        
        amc.notes.pull({ _id: req.params.noteId });
        await amc.save();
        res.json({ success: true, notes: amc.notes });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

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

app.get('/api/settings/cms', async (req, res) => {
    try {
        let config = await Settings.findOne({ key: 'website_cms' });
        if (!config) {
            config = {
                key: 'website_cms',
                value: {
                    announcementText: '<strong>Free Shipping</strong> on orders above ₹2,999 | Use code <strong>ROYAL10</strong> for 10% off',
                    heroTitle: 'India\'s Most Premium 3D Printing Destination',
                    heroSubtitle: 'Pro-grade printers, engineering filaments, and high-precision custom manufacturing services.',
                    heroButtonText: 'Shop Now',
                    heroButtonLink: 'products.html',
                    aboutText: 'We provide industrial-grade 3D printing solutions for engineers, creators, and hobbyists.'
                }
            };
        }
        res.json(config.value || config);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/settings/cms', async (req, res) => {
    try {
        await Settings.findOneAndUpdate(
            { key: 'website_cms' },
            { value: req.body },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'Website CMS Updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/settings/global', async (req, res) => {
    try {
        let config = await Settings.findOne({ key: 'global_settings' });
        if (!config) {
            config = {
                key: 'global_settings',
                value: {
                    storeName: '3D Pixel Printing',
                    supportEmail: 'hello@3dpixelprinting.in',
                    supportPhone: '+91 98765 43210',
                    rzpKey: '',
                    stripeKey: '',
                    maintenanceMode: false,
                    smtpHost: 'smtp.gmail.com',
                    smtpPort: 587,
                    smtpUser: 'alerts@3dpixelprinting.in',
                    socialInsta: 'https://instagram.com/3dpixelprinting',
                    socialTwitter: 'https://twitter.com/3dpixelprinting',
                    socialWhatsapp: 'https://wa.me/919876543210',
                    notifyOrder: true,
                    notifyStl: true,
                    notifyAmc: false,
                    taxGstPct: 18,
                    taxFreeShipping: 2999
                }
            };
        }
        res.json(config.value || config);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/settings/global', async (req, res) => {
    try {
        await Settings.findOneAndUpdate(
            { key: 'global_settings' },
            { value: req.body },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'Global Settings Updated' });
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
                    
                    // Enhanced pricing controls
                    BULK_DISCOUNT_TIERS: [
                        { minQty: 1, maxQty: 4, discount: 0 },
                        { minQty: 5, maxQty: 9, discount: 5 },
                        { minQty: 10, maxQty: 19, discount: 10 },
                        { minQty: 20, maxQty: 49, discount: 15 },
                        { minQty: 50, maxQty: null, discount: 20 }
                    ],
                    
                    REGIONAL_PRICING: {
                        domestic: { shippingMultiplier: 1.0, taxRate: 18 },
                        international: { shippingMultiplier: 2.5, taxRate: 0, customsFee: 500 }
                    },
                    
                    TIME_BASED_PRICING: {
                        rushSurcharge: 25,
                        weekendSurcharge: 15,
                        holidaySurcharge: 30
                    },
                    
                    VOLUME_BREAKS: [
                        { maxVolume: 50, priceMultiplier: 1.2 },
                        { maxVolume: 100, priceMultiplier: 1.1 },
                        { maxVolume: 200, priceMultiplier: 1.0 },
                        { maxVolume: 500, priceMultiplier: 0.95 },
                        { maxVolume: 1000, priceMultiplier: 0.9 }
                    ],
                    
                    MATERIALS: [
                        { name: 'PLA', basePrice: 1000, premiumPrice: 1200, unit: 'kg', color: '#ffffff', density: 1.24, minOrder: 0.1 },
                        { name: 'PETG', basePrice: 1300, premiumPrice: 1500, unit: 'kg', color: '#1a3aff', density: 1.27, minOrder: 0.1 },
                        { name: 'ABS', basePrice: 1200, premiumPrice: 1400, unit: 'kg', color: '#ff4b2b', density: 1.04, minOrder: 0.1 },
                        { name: 'Resin', basePrice: 2200, premiumPrice: 2500, unit: 'L', color: '#ffd700', density: 1.10, minOrder: 0.05 },
                        { name: 'TPU', basePrice: 1800, premiumPrice: 2000, unit: 'kg', color: '#00e676', density: 1.21, minOrder: 0.1 }
                    ],
                    FINISHES: [
                        { name: 'Standard (As-printed)', basePrice: 0, premiumPrice: 0, minArea: 0 },
                        { name: 'Sanded Smooth', basePrice: 150, premiumPrice: 180, minArea: 10 },
                        { name: 'Painted', basePrice: 299, premiumPrice: 350, minArea: 5 },
                        { name: 'Primed & Sanded', basePrice: 199, premiumPrice: 250, minArea: 8 },
                        { name: 'Electroplating', basePrice: 499, premiumPrice: 600, minArea: 3 },
                        { name: 'Hydro Dipping', basePrice: 399, premiumPrice: 500, minArea: 5 }
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
                    ],
                    SERVICES_STATUS: {
                        design: 'active',
                        repair: 'active',
                        amc: 'active',
                        printing: 'active'
                    },
                    DESIGN_SERVICES: [
                        { id: 'ds1', name: 'Product Design & Prototyping', price: 999, status: 'active', icon: '🏗️', desc: 'Turn your idea into a manufacturable 3D model. Multiple iterations included.' },
                        { id: 'ds2', name: 'Reverse Engineering', price: 1499, status: 'active', icon: '🔄', desc: 'Precise 3D models created from physical objects or reference images.' },
                        { id: 'ds3', name: 'Mechanical CAD', price: 2499, status: 'active', icon: '⚙️', desc: 'Functional parts with tight tolerances using SolidWorks or Fusion 360.' },
                        { id: 'ds4', name: 'Artistic & Decorative', price: 1999, status: 'active', icon: '🎨', desc: 'Custom figurines, jewelry, and sculptures designed for high-detail printing.' },
                        { id: 'ds5', name: 'Architectural Models', price: 4999, status: 'active', icon: '🏢', desc: 'Scale models for architectural presentations and urban planning.' },
                        { id: 'ds6', name: 'STL Repair & Optimization', price: 299, status: 'active', icon: '🔧', desc: 'Fix non-manifold meshes and optimize files for successful printing.' },
                        { id: 'ds7', name: '2D Image to 3D Printing', price: 499, status: 'active', icon: '🖼️', desc: 'Convert photos or logos into high-detail 3D lithophanes or wall art.' },
                        { id: 'ds8', name: 'Advanced 3D Modeling', price: 2999, status: 'active', icon: '🎭', desc: 'Complex organic modeling and character sculpting for high-end projects.' }
                    ],
                    STORE_CATEGORIES: [
                        { id: 'cat1', name: '3D Printers', slug: 'printers', icon: '🖨️', status: 'active' },
                        { id: 'cat2', name: 'Filaments', slug: 'filaments', icon: '🧵', status: 'active' },
                        { id: 'cat3', name: 'Spare Parts', slug: 'parts', icon: '⚙️', status: 'active' },
                        { id: 'cat4', name: 'Resins', slug: 'resins', icon: '🧪', status: 'active' },
                        { id: 'cat5', name: 'Accessories', slug: 'accessories', icon: '🔧', status: 'active' }
                    ],
                    STORE_BRANDS: [
                        { name: 'Bambu Lab', status: 'active' },
                        { name: 'Creality', status: 'active' },
                        { name: 'Prusa Research', status: 'active' },
                        { name: 'eSUN', status: 'active' },
                        { name: 'Elegoo', status: 'active' }
                    ]
                }
            };
        }
        res.json(config.value);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Pricing validation middleware
function validatePricingConfig(req, res, next) {
    const config = req.body;
    const errors = [];

    // Validate basic rates
    if (config.ELECTRICITY_RATE !== undefined && config.ELECTRICITY_RATE < 0) {
        errors.push('ELECTRICITY_RATE cannot be negative');
    }
    if (config.LABOR_RATE !== undefined && config.LABOR_RATE < 0) {
        errors.push('LABOR_RATE cannot be negative');
    }
    if (config.MAINTENANCE_RATE !== undefined && config.MAINTENANCE_RATE < 0) {
        errors.push('MAINTENANCE_RATE cannot be negative');
    }
    
    // Validate percentage fields (0-100)
    const percentageFields = ['DEPRECIATION_RATE', 'OVERHEAD_PCT', 'PROFIT_PCT', 'GST_PCT'];
    percentageFields.forEach(field => {
        if (config[field] !== undefined && (config[field] < 0 || config[field] > 100)) {
            errors.push(`${field} must be between 0 and 100`);
        }
    });

    // Validate bulk discount tiers
    if (config.BULK_DISCOUNT_TIERS) {
        config.BULK_DISCOUNT_TIERS.forEach((tier, index) => {
            if (tier.minQty === undefined || tier.minQty < 0) {
                errors.push(`BULK_DISCOUNT_TIERS[${index}]: minQty is required and must be >= 0`);
            }
            if (tier.discount === undefined || tier.discount < 0 || tier.discount > 100) {
                errors.push(`BULK_DISCOUNT_TIERS[${index}]: discount must be between 0 and 100`);
            }
        });
    }

    // Validate materials
    if (config.MATERIALS) {
        config.MATERIALS.forEach((material, index) => {
            if (!material.name) {
                errors.push(`MATERIALS[${index}]: name is required`);
            }
            if (material.basePrice === undefined || material.basePrice < 0) {
                errors.push(`MATERIALS[${index}]: basePrice is required and must be >= 0`);
            }
            if (material.minOrder === undefined || material.minOrder <= 0) {
                errors.push(`MATERIALS[${index}]: minOrder is required and must be > 0`);
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    
    next();
}

app.post('/api/settings/pricing', validatePricingConfig, async (req, res) => {
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

// Enhanced pricing calculation endpoints
app.post('/api/pricing/calculate/bulk', async (req, res) => {
    try {
        const config = await Settings.findOne({ key: 'pricing_framework' }) || { value: {} };
        const { material, quantity, volume, finish = 'Standard (As-printed)', region = 'domestic' } = req.body;
        
        if (!material || !quantity || !volume) {
            return res.status(400).json({ success: false, error: 'Material, quantity, and volume are required' });
        }

        const selectedMaterial = config.value.MATERIALS?.find(m => m.name === material);
        if (!selectedMaterial) {
            return res.status(404).json({ success: false, error: `Material '${material}' not found` });
        }

        const selectedFinish = config.value.FINISHES?.find(f => f.name === finish);
        const regionalSettings = config.value.REGIONAL_PRICING?.[region] || {};
        
        // Calculate material cost
        let materialCost = selectedMaterial.basePrice * volume;
        
        // Apply volume breaks
        const volumeBreak = config.value.VOLUME_BREAKS?.find(vb => volume <= vb.maxVolume || vb.maxVolume === null) || { priceMultiplier: 1.0 };
        materialCost *= volumeBreak.priceMultiplier;
        
        // Apply bulk discount
        const bulkTier = config.value.BULK_DISCOUNT_TIERS?.find(tier => 
            quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty)
        ) || { discount: 0 };
        materialCost *= (1 - bulkTier.discount / 100);
        
        // Add finish cost
        const finishCost = selectedFinish ? selectedFinish.basePrice * Math.max(1, volume / 10) : 0;
        
        // Calculate total
        const subtotal = materialCost + finishCost;
        const gst = subtotal * ((regionalSettings.taxRate || config.value.GST_PCT || 18) / 100);
        const shipping = region === 'international' ? regionalSettings.customsFee || 0 : config.value.MIN_SHIPPING || 100;
        const total = subtotal + gst + shipping;
        
        res.json({
            success: true,
            quote: {
                materialCost,
                finishCost,
                subtotal,
                gst,
                shipping,
                total,
                volumeBreak: volumeBreak,
                bulkDiscount: bulkTier.discount,
                regionalSettings
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/pricing/tiers/:material', async (req, res) => {
    try {
        const config = await Settings.findOne({ key: 'pricing_framework' }) || { value: {} };
        const { material } = req.params;
        const { volume = 100 } = req.query;
        
        const selectedMaterial = config.value.MATERIALS?.find(m => m.name === material);
        if (!selectedMaterial) {
            return res.status(404).json({ success: false, error: `Material '${material}' not found` });
        }

        const tiers = config.value.BULK_DISCOUNT_TIERS?.map(tier => ({
            minQty: tier.minQty,
            maxQty: tier.maxQty,
            discount: tier.discount,
            unitPrice: selectedMaterial.basePrice * (1 - tier.discount / 100),
            totalPrice: selectedMaterial.basePrice * volume * (1 - tier.discount / 100)
        })) || [];
        
        res.json({ success: true, material, volume, tiers });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/pricing/simulate', async (req, res) => {
    try {
        const config = await Settings.findOne({ key: 'pricing_framework' }) || { value: {} };
        const { material, finish, quantity = 1, volume = 100, region = 'domestic' } = req.query;
        
        const scenarios = config.value.VOLUME_BREAKS?.map(vb => ({
            volume: vb.maxVolume,
            priceMultiplier: vb.priceMultiplier,
            materialCost: (config.value.MATERIALS?.find(m => m.name === material)?.basePrice || 1000) * vb.maxVolume * vb.priceMultiplier,
            finishCost: (config.value.FINISHES?.find(f => f.name === finish)?.basePrice || 0) * Math.max(1, vb.maxVolume / 10)
        })) || [];
        
        res.json({ success: true, scenarios });
        
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

app.post('/api/products/:id/duplicate', async (req, res) => {
    try {
        const original = await Product.findById(req.params.id);
        if (!original) return res.status(404).json({ success: false, error: 'Product not found' });
        
        const duplicate = new Product(original.toObject());
        duplicate._id = new mongoose.Types.ObjectId();
        duplicate.sku = original.sku + '-COPY-' + Date.now().toString().slice(-4);
        duplicate.name = original.name + ' (Copy)';
        duplicate.createdAt = new Date();
        
        await duplicate.save();
        res.json({ success: true, product: duplicate });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
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

app.post('/api/stl-jobs/manual', async (req, res) => {
    try {
        console.log('MANUAL STL JOB REQUEST:', JSON.stringify(req.body));
        let customer = { name: 'Guest Walk-in', email: 'N/A', phone: 'N/A' };
        if (req.body.customerId && mongoose.Types.ObjectId.isValid(req.body.customerId)) {
            const user = await User.findById(req.body.customerId);
            if (user) {
                customer = { 
                    name: user.name, 
                    email: user.email, 
                    phone: user.phone || 'N/A', 
                    address: user.address || 'N/A', 
                    city: user.city || 'N/A' 
                };
            }
        }
        
        const newJob = new STLJob({
            filename: req.body.filename,
            fileData: req.body.fileData,
            customer: customer,
            settings: req.body.settings,
            quote: req.body.quote,
            weightEst: req.body.weightEst,
            status: 'queued',
            workflowTimeline: [{ 
                status: 'queued', 
                date: new Date(), 
                remark: 'Manual quote created by Admin', 
                updatedBy: 'Admin' 
            }]
        });
        
        const saved = await newJob.save();
        res.status(201).json({ success: true, jobId: saved._id });
    } catch (error) {
        console.error('MANUAL JOB ERROR:', error);
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
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
        
        if (req.body.status && req.body.status !== order.status) {
            order.status = req.body.status;
            order.timeline.push({ status: req.body.status, date: new Date(), remark: req.body.remark || `Status changed to ${req.body.status}` });
        }
        
        if (req.body.adminNote) {
            order.adminNotes.push({ text: req.body.adminNote, date: new Date(), author: 'Admin' });
        }

        await order.save();
        res.json({ success: true, message: 'Order updated!', order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/stl-jobs/:id', async (req, res) => {
    try {
        const job = await STLJob.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
        
        if (req.body.status && req.body.status !== job.status) {
            job.status = req.body.status;
            job.workflowTimeline.push({ 
                status: req.body.status, 
                date: new Date(), 
                remark: req.body.remark || `Workflow transitioned to ${req.body.status}`,
                updatedBy: req.body.updatedBy || 'Admin'
            });
        }

        if (req.body.printerId !== undefined) job.printerId = req.body.printerId;
        if (req.body.slicingSpecs) job.slicingSpecs = { ...job.slicingSpecs, ...req.body.slicingSpecs };
        if (req.body.weightEst !== undefined) job.weightEst = req.body.weightEst;

        if (req.body.adminNote) {
            job.adminNotes.push({ text: req.body.adminNote, date: new Date(), author: req.body.author || 'Admin' });
        }

        await job.save();
        res.json({ success: true, message: 'Production data updated!', job });
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
            res.setHeader('Content-Type', image.contentType || 'application/octet-stream');
            res.setHeader('Accept-Ranges', 'bytes');

            const downloadStream = bucket.openDownloadStream(new mongoose.mongo.ObjectId(gridfsId));
            downloadStream.pipe(res);

            downloadStream.on('error', (err) => {
                console.error('GridFS stream error:', err);
                if (!res.headersSent) res.status(404).send('Not found');
            });
        } else if (image.data) {
            const imgBuffer = Buffer.from(image.data, 'base64');
            res.contentType(image.contentType);
            res.send(imgBuffer);
        } else {
            res.status(404).send('No image data found');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/api/images', async (req, res) => {
    try {
        const images = await ProductImage.find().sort({ uploadedAt: -1 });
        res.json(images);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`3D Pixel Printing Server is running at http://localhost:${PORT}`);
            console.log(`Server also accessible on network interfaces`);
        });
    } catch (err) {
        console.error('Startup Error:', err);
        process.exit(1);
    }
}

start();
