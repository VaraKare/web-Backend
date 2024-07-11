import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error){
        console.log("MongoDb connection failed (error)", error);
        process.exit(1)
    }
}
// when using database use try catch and async wait
// ;()() its an iffy , always start with semicolon

// if any changes happen in env variable we have to re run the code
export default connectDB;