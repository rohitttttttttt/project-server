const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const userStore = require('./userStore');
const User = require('../models/User.model');
const chatHandler = require('./handler/chat.handler');
let io ;



 function  initSocket(server){
     io = new Server(server , {
        cors : {
            origin : process.env.FRONTEND_URL || "http://localhost:5173",
            methods : ["GET" , "POST"],
            credentials : true
        }
    });

    io.use(async(socket , next)=>{
        let token = socket.handshake.auth?.token;
        if(!token || typeof token !== 'string'){
            return next(new Error("Authentication error"))
        }
        token = token.trim();
        if(!token){
            return next(new Error("Authentication error"))
        }
        try {
            const decoded = jwt.verify(token , process.env.ATS);
            socket.userId = decoded._id;
            const user = await User.findById(decoded._id);
            if(!user){
                return next(new Error("User not found"))
            }
            socket.user = user;
        
            next();
        } catch (error) {
            return next(new Error("Authentication error"))
        }
    })

    io.on("connection" , (socket)=>{
        userStore.addUser(socket.userId , socket.id);

        // Register chat handlers for this socket
        chatHandler(io, socket);

        socket.on("disconnect" , ()=>{
            userStore.removeUser(socket.id);
        })
    })


    
}

const getIO = () => {
    if (!io) throw new Error("Socket.IO not initialized");
    return io;
};
module.exports = { initSocket, getIO };