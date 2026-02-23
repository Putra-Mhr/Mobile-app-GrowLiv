import { Notification } from "../models/notification.model.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// Get all notifications for user
export const getNotifications = asyncHandler(async (req, res) => {
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
});

// Get unread count only
export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    res.status(200).json({ unreadCount });
});

// Mark single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    res.status(200).json({ notification });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
});

// Delete single notification
export const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    res.status(200).json({ message: "Notification deleted" });
});

// Delete all notifications
export const deleteAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    await Notification.deleteMany({ userId });
    res.status(200).json({ message: "All notifications deleted" });
});

// Create notification (called internally or via admin)
export const createNotification = asyncHandler(async (req, res) => {
    const { userId, type, title, message, data } = req.body;

    if (!userId || !title || !message) {
        throw new AppError("Missing required fields", 400);
    }

    const notification = await Notification.create({
        userId,
        type: type || "info",
        title,
        message,
        data: data || {},
    });

    res.status(201).json({ notification });
});

// Helper function to create notification from other controllers
// NOTE: This is NOT a route handler — it keeps its own try-catch
// because it's called internally and must not crash the calling function
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
