const mongoose = require('mongoose');
const User = require('./User.model');

const chatSchema = new mongoose.Schema({
  User1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  User2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});
const Chat = mongoose.model('Chat', chatSchema);


module.exports = Chat