const express = require('express');
const cors = require('cors')
const mongoose =  require('mongoose')
const dotenv = require('dotenv')
const userRouter = require('./routes/UserRouter')
const productRouter = require('./routes/Product.Route')
const orderRouter = require('./routes/Order.Route')
const chatRouter = require('./routes/Chat.Route')
const http  = require('http');
const Chat = require('./models/Chat.model') 
const { Server } = require('socket.io');
const User = require('./models/User.model')


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
app.use("/product" ,productRouter) 
app.use("/order" , orderRouter)
app.use("/chat", chatRouter)

const io = new Server(server , {
    cors:{
    origin:"http://localhost:5173",
    credentials:true
}
})

var user ={};

io.on("connection" , (socket)=>{
  
 socket.on("createConnection" , (userId)=>{
    user[userId] =socket.id
    console.log(userId)
 })
 socket.on("message1" , async (messageToSend , user1 , user2)=>{
    console.log(messageToSend + "  " + user1 +" "+ user2)
    const reciver =  user[user2]
    const sender = user1
    const finalMessage = [{owner:false , msg:messageToSend , id:Math.random()*9897}]
    io.to(reciver).emit("message2" , finalMessage , sender  )
     let chat = await Chat.findOne({
        $or:[
            {User1:user1 , User2:user2},
            {User1:user2 , User2:user1}
        ]
    })

     
     if(!chat){
        let user =await User.findById(user1)
        let userR = await User.findById(user2)
        user.messages.push(userR.userName)
        userR.messages.push(user.userName)
       chat = await Chat.create({User1:user1 , User2:user2})
     }
      chat.messages.push({owner:user1, message:messageToSend })
      chat.save()

 })

})


server.listen(3000 , ()=>{
    console.log("server is running ")
})