const mongoose = require('mongoose');
const Notification = require('../models/Notification.model');

// ═══════════════════════════════════════════════════
//  GET MY NOTIFICATIONS  (GET /notification)
//  Auth required — paginated, newest first
// ═══════════════════════════════════════════════════
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ userId }),
            Notification.countDocuments({ userId, isRead: false }),
        ]);

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('GetMyNotifications Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  GET UNREAD COUNT  (GET /notification/unread-count)
//  Auth required — lightweight endpoint for badge count
// ═══════════════════════════════════════════════════
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ userId, isRead: false });

        return res.status(200).json({ success: true, unreadCount: count });
    } catch (error) {
        console.error('GetUnreadCount Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  MARK AS READ  (PATCH /notification/:notificationId)
//  Auth required — mark a single notification as read
// ═══════════════════════════════════════════════════
const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification,
        });
    } catch (error) {
        console.error('MarkAsRead Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  MARK ALL AS READ  (PATCH /notification/read-all)
//  Auth required — mark all notifications as read
// ═══════════════════════════════════════════════════
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );

        return res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`,
        });
    } catch (error) {
        console.error('MarkAllAsRead Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  DELETE NOTIFICATION  (DELETE /notification/:notificationId)
//  Auth required
// ═══════════════════════════════════════════════════
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Notification.findByIdAndDelete(notificationId);

        return res.status(200).json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        console.error('DeleteNotification Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  CLEAR ALL NOTIFICATIONS  (DELETE /notification/clear)
//  Auth required — removes all notifications for user
// ═══════════════════════════════════════════════════
const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.deleteMany({ userId });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} notifications cleared`,
        });
    } catch (error) {
        console.error('ClearAllNotifications Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
};
