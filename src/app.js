import { Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = new Express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))//use method used for middlewares & configs

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))//folder to save defult files
app.use(cookieParser());


export { app }