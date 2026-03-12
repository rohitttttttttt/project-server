const express = require('express');
const cors = require('cors')
const mongoose =  require('mongoose')
const dotenv = require('dotenv')
const userRouter = require('./routes/UserRouter')
const productRouter = require('./routes/Product.Route')
const orderRouter = require('./routes/Order.Route')
const chatRouter = require('./routes/Chat.Route')
const cartRouter = require('./routes/Cart.Route')
const reviewRouter = require('./routes/Review.Route')
const addressRouter = require('./routes/Address.Route')
const notificationRouter = require('./routes/Notification.Route')
const http  = require('http');
const {initSocket} = require('./socket/index');
const {globalLimitter} = require('./middlewares/rateLimiter')



const app = express();

const server = http.createServer(app)

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


const allowedOrigin = (process.env.FRONTEND_URL || "https://orbitfarms.vercel.app").replace(/\/+$/, '');

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (origin === allowedOrigin) {
            callback(null, true);
        } else {
            console.warn(`[CORS BLOCKED] Origin "${origin}" is not allowed. Allowed: "${allowedOrigin}"`);
            callback(new Error(`CORS policy: Origin "${origin}" is not allowed.`));
        }
    },
    credentials: true
}))
app.use(express.json()) 
app.use(express.urlencoded({ extended: true }));
app.use(globalLimitter)



app.get("/" , (req , res)=>{
    res.send("Hello")
})
app.use("/user", userRouter)
app.use("/product" ,productRouter) 
app.use("/order" , orderRouter)
app.use("/chat", chatRouter)
app.use("/cart", cartRouter)
app.use("/review", reviewRouter)
app.use("/address", addressRouter)
app.use("/notification", notificationRouter)

initSocket(server);





const PORT = process.env.PORT || 3000;
server.listen(PORT , ()=>{ 
    console.log(`server is running on port ${PORT}`)
})