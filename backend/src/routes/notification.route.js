import { Router } from "express";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification,
} from "../controllers/notification.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

// Get notifications
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);

// Mark as read
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

// Delete
router.delete("/:id", deleteNotification);
router.delete("/", deleteAllNotifications);

// Create (for testing/admin)
router.post("/", createNotification);

export default router;
