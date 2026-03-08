const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    getConversations,
    startConversation,
    getMessages,
    deleteMessage,
    deleteConversation,
} = require('../controllers/Chat.controller');

const router = Router();

// ── All chat routes require authentication ──

// Conversations
router.get('/', auth, getConversations);                        // List all conversations
router.post('/conversation', auth, startConversation);          // Start or get existing conversation

// Messages (static paths before parameterized)
router.delete('/message/:messageId', auth, deleteMessage);      // Delete a single message

// Conversation-specific (parameterized — must be last)
router.get('/:conversationId', auth, getMessages);              // Get messages in a conversation
router.delete('/:conversationId', auth, deleteConversation);    // Delete conversation + messages

module.exports = router;