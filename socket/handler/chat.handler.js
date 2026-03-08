// ═══════════════════════════════════════════════════
//  CHAT SOCKET HANDLER
//
//  This module exports a function that registers all
//  chat-related socket events for a single connected
//  client. It is called from socket/index.js inside
//  io.on("connection") like:
//
//      const chatHandler = require('./handler/chat.handler');
//      chatHandler(io, socket);
//
//  Parameters received:
//    - io     → the Socket.IO server instance (to emit to other sockets)
//    - socket → the individual client's socket (has socket.userId from auth)
// ═══════════════════════════════════════════════════

const { sendMessage } = require('../../controllers/Chat.controller');
const userStore = require('../userStore');

module.exports = (io, socket) => {

    // ─────────────────────────────────────────────
    //  EVENT: "send-message"
    //  Client sends: { conversationId, content }
    //
    //  Flow:
    //    1. Extract conversationId & content from data
    //    2. Call sendMessage() utility → saves to DB,
    //       returns the OTHER user's _id (receiverId)
    //    3. Look up receiver's socketId in userStore
    //    4. If receiver is online → emit "message-received"
    //    5. If failed or receiver offline → do nothing
    //       (they'll see it when they fetch messages via API)
    // ─────────────────────────────────────────────
    socket.on("send-message", async (data) => {
        try {
            // Validate incoming data
            if (!data || !data.conversationId || !data.content) {
                return socket.emit("error", { message: "conversationId and content are required" });
            }

            const { conversationId, content } = data;

            // socket.userId was set by the auth middleware in socket/index.js
            const senderId = socket.userId;

            // Save message to DB and get the other participant's _id
            // Returns receiverId on success, false on failure
            const receiverId = await sendMessage(conversationId, senderId, content);

            if (!receiverId) {
                return socket.emit("error", { message: "Failed to send message" });
            }

            // Check if the receiver is currently online
            // .toString() is needed because receiverId is a Mongoose ObjectId
            // and userStore Map keys are strings
            const receiverSocketId = userStore.getUser(receiverId.toString());

            if (receiverSocketId) {
                // Receiver is online → send them the message in real-time
                io.to(receiverSocketId).emit("message-received", {
                    conversationId,
                    content,
                    senderId: senderId,
                    timestamp: new Date().toISOString(),
                });
            }
            // If receiver is offline, no action needed —
            // they'll get the message when they call GET /chat/:conversationId

        } catch (error) {
            console.error("send-message Error:", error.message);
            socket.emit("error", { message: "Something went wrong" });
        }
    });

    // ─────────────────────────────────────────────
    //  EVENT: "typing"
    //  Client sends: { conversationId, receiverId }
    //  Notifies the other user that this user is typing
    // ─────────────────────────────────────────────
    socket.on("typing", (data) => {
        if (!data || !data.receiverId) return;

        const receiverSocketId = userStore.getUser(data.receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("user-typing", {
                conversationId: data.conversationId,
                userId: socket.userId,
            });
        }
    });

    // ─────────────────────────────────────────────
    //  EVENT: "stop-typing"
    //  Client sends: { conversationId, receiverId }
    // ─────────────────────────────────────────────
    socket.on("stop-typing", (data) => {
        if (!data || !data.receiverId) return;

        const receiverSocketId = userStore.getUser(data.receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("user-stopped-typing", {
                conversationId: data.conversationId,
                userId: socket.userId,
            });
        }
    });

};