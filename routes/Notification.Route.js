const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} = require('../controllers/Notification.controller');

const router = Router();

// All notification routes require authentication
router.get('/', auth, getMyNotifications);                       // Get paginated notifications
router.get('/unread-count', auth, getUnreadCount);               // Get unread badge count
router.patch('/read-all', auth, markAllAsRead);                  // Mark all as read
router.patch('/:notificationId', auth, markAsRead);              // Mark single as read
router.delete('/clear', auth, clearAllNotifications);            // Clear all notifications
router.delete('/:notificationId', auth, deleteNotification);     // Delete single notification

module.exports = router;
