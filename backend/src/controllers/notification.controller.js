import { Notification } from "../models/notification.model.js";

// Get all notifications for user
export async function getNotifications(req, res) {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error in getNotifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Get unread count only
export async function getUnreadCount(req, res) {
    try {
        const userId = req.user._id;
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({ unreadCount });
    } catch (error) {
        console.error("Error in getUnreadCount:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Mark single notification as read
export async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.status(200).json({ notification });
    } catch (error) {
        console.error("Error in markAsRead:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error in markAllAsRead:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Delete single notification
export async function deleteNotification(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({ _id: id, userId });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Error in deleteNotification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Delete all notifications
export async function deleteAllNotifications(req, res) {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ userId });

        res.status(200).json({ message: "All notifications deleted" });
    } catch (error) {
        console.error("Error in deleteAllNotifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Create notification (called internally or via admin)
export async function createNotification(req, res) {
    try {
        const { userId, type, title, message, data } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const notification = await Notification.create({
            userId,
            type: type || "info",
            title,
            message,
            data: data || {},
        });

        res.status(201).json({ notification });
    } catch (error) {
        console.error("Error in createNotification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Helper function to create notification from other controllers
export async function createNotificationForUser(userId, type, title, message, data = {}) {
    try {
        await Notification.create({
            userId,
            type,
            title,
            message,
            data,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}
