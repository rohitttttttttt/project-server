const express = require('express');
const cors = require('cors')
const mongoose =  require('mongoose')
const dotenv = require('dotenv')
const userRouter = require('./routes/UserRouter')
const productRouter = require('./routes/Product.Route')
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
    console.log("finally we are connected to database") 
)

const app = express();
app.use(cors())
app.use(express.json()) 
app.use(express.urlencoded({ extended: true }));


app.get("/", (req , res )=>{
    res.send("hello world ")
})
app.use("/user", userRouter)
app.use("/product" ,productRouter) // check this 

app.listen(3000 , ()=>{
    console.log("server is running ")
}) 