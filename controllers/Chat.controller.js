const Chat = require('../models/Chat.model')

const getChat = async (req ,res) => {
    const {_id} = req.user
    const user1 = _id
    const user2 = req.query.id
    if(!user2){
        return res.status(400).json({
            message:"user not found"
        })
    }

    const chat = await Chat.findOne({
        $or:[
            {User1:user1 , User2:user2},
            {User1:user2 , User2:user1}
        ]
    })
    let messageToSend = [];
    if(!chat){
        return res.status(200).json({
            message:"no chat between users",
            messageToSend
        })
    }
    
   for (let i = 0; i < chat.messages.length; i++) {
  if (chat.messages[i].owner.toString() === user1.toString()) {
    messageToSend.push({ owner: true, msg: chat.messages[i].message, id: chat._id });
  } else {
    messageToSend.push({ owner: false, msg: chat.messages[i].message, id: chat._id });
  }
}


    return res.status(200).json({
        message:"here is your  messages ",
        messageToSend
    })

    
    
}

module.exports ={getChat}