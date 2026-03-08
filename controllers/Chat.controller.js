const mongoose = require('mongoose');
const Conversation = require('../models/Chat.model');
const Message = require('../models/Message.model');
const User = require('../models/User.model');

// ═══════════════════════════════════════════════════
//  GET CONVERSATIONS  (GET /chat)
//  Auth required — returns all conversations for the
//  logged-in user, populated with the other user's
//  name and sorted by most recent activity.
// ═══════════════════════════════════════════════════
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find every conversation where the logged-in user is either user1 or user2
        const conversations = await Conversation.find({
            $or: [
                { user1: userId },
                { user2: userId },
            ],
        })
            .sort({ updatedAt: -1 })
            .populate('user1', 'fullName')
            .populate('user2', 'fullName')
            .lean();

        return res.status(200).json({
            success: true,
            conversations,
        });
    } catch (error) {
        console.error('GetConversations Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  START / GET CONVERSATION  (POST /chat/conversation)
//  Auth required — creates a new conversation between
//  the logged-in user and another user, or returns the
//  existing one if it already exists.
//  Body: { userId: "<other-user-id>" }
// ═══════════════════════════════════════════════════
const startConversation = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        
        const { userId: otherUserId } = req.body;




        // ── Validation ──
        if (!otherUserId) {
            return res.status(400).json({ success: false, message: 'userId of the other user is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        if (currentUserId.toString() === otherUserId.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself' });
        }

        // ── Check other user exists ──
        const otherUser = await User.findById(otherUserId).select('fullName').lean();
        if (!otherUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // ── Find existing or create new conversation ──
        // Check both orderings since user1/user2 could be either way
        let conversation = await Conversation.findOne({
            $or: [
                { user1: currentUserId, user2: otherUserId },
                { user1: otherUserId, user2: currentUserId },
            ],
        })
            .populate('user1', 'fullName')
            .populate('user2', 'fullName');

        if (!conversation) {
            conversation = await Conversation.create({
                user1: currentUserId,
                user2: otherUserId,
            });
            // Populate after creation
            conversation = await Conversation.findById(conversation._id)
                .populate('user1', 'fullName')
                .populate('user2', 'fullName');
        }

        return res.status(200).json({
            success: true,
            conversation,
        });
    } catch (error) {
        console.error('StartConversation Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  GET MESSAGES  (GET /chat/:conversationId)
//  Auth required — returns paginated messages for a
//  specific conversation. Only participants can access.
//  Marks unseen messages from the other user as seen.
// ═══════════════════════════════════════════════════
const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
        }

        // ── Verify the user is a participant ──
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const isParticipant =
            conversation.user1.toString() === userId.toString() ||
            conversation.user2.toString() === userId.toString();
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'You are not part of this conversation' });
        }

        // ── Pagination (newest messages first) ──
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            Message.find({ conversationId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('sender', 'fullName')
                .lean(),
            Message.countDocuments({ conversationId }),
        ]);

        // ── Mark unread messages from the other user as seen (fire-and-forget) ──
        Message.updateMany(
            { conversationId, sender: { $ne: userId }, seen: false },
            { $set: { seen: true } }
        ).exec();

        return res.status(200).json({
            success: true,
            messages,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('GetMessages Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  SEND MESSAGE  (utility function — NOT a route handler)
//  Call from Socket.IO or anywhere else.
//  Saves the message to DB and updates conversation's
//  lastMessage. Returns the OTHER user's _id on success
//  so the caller can emit to them, or false on failure.
//
//  @param {String} conversationId
//  @param {String} senderId
//  @param {String} message
//  @returns {ObjectId|false}  — receiver's userId or false
// ═══════════════════════════════════════════════════
const sendMessage = async (conversationId, senderId, message) => {
    try {
        if (!conversationId || !senderId || !message) return false;
        if (typeof message !== 'string' || message.trim().length === 0) return false;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return false;

        // Save message to DB
        await Message.create({
            conversationId,
            sender: senderId,
            message: message.trim(),
        });

        // Update conversation's lastMessage
        conversation.lastMessage = message.trim();
        await conversation.save();

        // Return the OTHER participant's userId
        const receiverId = conversation.user1.toString() === senderId.toString()
            ? conversation.user2
            : conversation.user1;

        return receiverId;
    } catch (error) {
        console.error('SendMessage Error:', error.message);
        return false;
    }
};

// ═══════════════════════════════════════════════════
//  DELETE MESSAGE  (DELETE /chat/message/:messageId)
//  Auth required — only the sender can delete their
//  own message.
// ═══════════════════════════════════════════════════
const deleteMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ success: false, message: 'Invalid message ID' });
        }

        const msg = await Message.findById(messageId);
        if (!msg) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        if (msg.sender.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        }

        await Message.findByIdAndDelete(messageId);

        return res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
        });
    } catch (error) {
        console.error('DeleteMessage Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  DELETE CONVERSATION  (DELETE /chat/:conversationId)
//  Auth required — only participants can delete.
//  Cascade-deletes all messages in the conversation.
// ═══════════════════════════════════════════════════
const deleteConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const isParticipant =
            conversation.user1.toString() === userId.toString() ||
            conversation.user2.toString() === userId.toString();
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'You are not part of this conversation' });
        }

        // Cascade delete: remove all messages then the conversation itself
        await Promise.all([
            Message.deleteMany({ conversationId }),
            Conversation.findByIdAndDelete(conversationId),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Conversation and all messages deleted',
        });
    } catch (error) {
        console.error('DeleteConversation Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getConversations,
    startConversation,
    getMessages,
    sendMessage,
    deleteMessage,
    deleteConversation,
};