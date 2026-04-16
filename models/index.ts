import mongoose from 'mongoose';

// Contact Schema
const ContactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

// Product Image Schema
const ProductImageSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    data: String, // Store as base64 string or gridfs:ID
    uploadedAt: { type: Date, default: Date.now }
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

// Global Settings Schema
const SettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed
});

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

// AMC Plan Schema
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

export const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
export const ProductImage = mongoose.models.ProductImage || mongoose.model('ProductImage', ProductImageSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const STLJob = mongoose.models.STLJob || mongoose.model('STLJob', STLJobSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const RepairRequest = mongoose.models.RepairRequest || mongoose.model('RepairRequest', RepairRequestSchema);
export const AMCPlan = mongoose.models.AMCPlan || mongoose.model('AMCPlan', AMCPlanSchema);
