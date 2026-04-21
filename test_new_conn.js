import mongoose from 'mongoose';

// Your password has an '@' symbol, so it MUST be URL-encoded to %40
const uri = "mongodb+srv://velmurugan:svmsundu%402003@cluster0.fcaodjq.mongodb.net/my_website?retryWrites=true&w=majority";

async function run() {
    try {
        console.log("Testing connection to Atlas Cluster0...");
        await mongoose.connect(uri);
        console.log("✅ SUCCESS: Connected to MongoDB Atlas!");
        
        // Check database name
        console.log("Database Name:", mongoose.connection.name);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ CONNECTION FAILED:");
        console.error(err.message);
        process.exit(1);
    }
}

run();
