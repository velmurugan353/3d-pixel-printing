import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my_website';

async function checkDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}));
        const ProductImage = mongoose.model('ProductImage', new mongoose.Schema({}));
        
        const pCount = await Product.countDocuments();
        const iCount = await ProductImage.countDocuments();
        
        console.log(`Products in DB: ${pCount}`);
        console.log(`Images in DB: ${iCount}`);
        
        if (iCount > 0) {
            const lastImages = await ProductImage.find().sort({ uploadedAt: -1 }).limit(5);
            console.log('Last 5 uploaded images:', JSON.stringify(lastImages, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDB();
