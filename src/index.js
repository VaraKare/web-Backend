
import dotenv from "dotenv"
import { app } from "./app.js";
// require('dotenv').config({path: './env'})
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})
// connectDB is async so returns a promise
connectDB()
.then(()=>{
    const port=process.env.PORT || 8000;
    app.on("errror", (error) => {
        console.log ("ERRR: ", error);
        throw error
        })
    app.listen(port,()=>{
        console.log(`server is running at port : ${port}`);
    })
})//to handle succesful
.catch((err)=>{
console.log("MONGO db Connection Failed",err);
})//to handle error