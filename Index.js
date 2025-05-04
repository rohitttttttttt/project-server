const express = require('express');
const cors = require('cors')
const mongoose =  require('mongoose')
const dotenv = require('dotenv')
const userRouter = require('./routes/UserRouter')
const productRouter = require('./routes/Product.Route')
const orderRouter = require('./routes/Order.Route')
dotenv.config()
const dbConnection = async () => {
    try {
       await mongoose.connect(process.env.MongoUrl)
        console.log("Db conected")
    } catch (error) {
        console.log( "Db error:"+ error);
        
    }
}

dbConnection()
.then(
   console.log("trying to connect with db ")
)

const app = express();
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(express.json()) 
app.use(express.urlencoded({ extended: true }));



app.get("/", (req , res )=>{
    res.send("hello world ")
})
app.use("/user", userRouter)
app.use("/product" ,productRouter) // check this 
app.use("/order" , orderRouter)// route to place order 

app.listen(3000 , ()=>{
    console.log("server is running ")
})