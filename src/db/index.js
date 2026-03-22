import mongoose from "mongoose"

// using try catch to prevent errors
const connectDB = async () => {
    try {
        // using await so that it takes as much time as needed
        await mongoose.connect(process.env.MONGO_URI)
        console.log("✅ MongoDB connected!");
    } catch (error) {
        console.log("❌ Error connecting to MongoDB!", error)
        // exit if the connection fails
        process.exit(1)
    }
}

//exporting the method so that anybody can use it
export default connectDB