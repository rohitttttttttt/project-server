const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
    lastMessage: {
        type: String,
        default: '',
    },
}, { timestamps: true });

conversationSchema.index({ user1: 1 , user2: 1 }, { unique: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;