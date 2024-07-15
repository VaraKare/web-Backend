import express  from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app =  express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))//use method used for middlewares & configs

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))//folder to save defult files
app.use(cookieParser());


// routes import
import userRouter from "./routes/user.routes.js";

//routes decleration
app.use("/api/v1/users", userRouter)// we are using middlewares bcz we are declearing  routes in seperate file.
//http://localhost:8000/api/v1/users/register
export { app }