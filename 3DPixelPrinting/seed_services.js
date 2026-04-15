import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my_website';

// Schemas
const RepairRequest = mongoose.model('RepairRequest', new mongoose.Schema({
    customer: { name: String, email: String, phone: String, address: String },
    device: String, issue: String, urgency: String, status: String, technician: String, estimate: Number, createdAt: { type: Date, default: Date.now }
}));

const AMCPlan = mongoose.model('AMCPlan', new mongoose.Schema({
    customer: { name: String, email: String, phone: String },
    planName: String, startDate: Date, expiryDate: Date, price: Number, status: String, createdAt: { type: Date, default: Date.now }
}));

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Seeding Service Data...');
        
        await RepairRequest.deleteMany({});
        await RepairRequest.insertMany([
            { customer: { name: 'Rajesh Kumar', email: 'rajesh@mail.com', phone: '9876543210', address: 'T. Nagar, Chennai' }, device: 'Creality Ender 3', issue: 'Nozzle clogging and bed leveling issues', urgency: 'high', status: 'pending', technician: 'Selvam', estimate: 1200 },
            { customer: { name: 'Anita Rao', email: 'anita@mail.com', phone: '9123456789', address: 'Jayanagar, Bengaluru' }, device: 'Bambu Lab X1C', issue: 'AMS not retracting filament', urgency: 'medium', status: 'assigned', technician: 'Karthik', estimate: 2500 }
        ]);

        await AMCPlan.deleteMany({});
        const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
        const lastYear = new Date(); lastYear.setFullYear(lastYear.getFullYear() - 1);
        
        await AMCPlan.insertMany([
            { customer: { name: 'PSG Tech', email: 'maintenance@psg.edu', phone: '0422-123456' }, planName: 'Enterprise Gold', startDate: new Date(), expiryDate: nextYear, price: 25000, status: 'active' },
            { customer: { name: 'Maker Space', email: 'hello@maker.in', phone: '9988776655' }, planName: 'Pro Annual', startDate: lastYear, expiryDate: new Date(), price: 12000, status: 'active' }
        ]);

        console.log('Successfully seeded services!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seed();
