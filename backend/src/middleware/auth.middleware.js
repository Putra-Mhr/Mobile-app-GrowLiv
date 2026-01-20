import { requireAuth, clerkClient } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;
      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      let user = await User.findOne({ clerkId });
      if (!user) {
        // Fetch user data from Clerk API
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);

          const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
          const firstName = clerkUser.firstName || '';
          const lastName = clerkUser.lastName || '';
          const name = `${firstName} ${lastName}`.trim() || 'User';
          const imageUrl = clerkUser.imageUrl || '';

          if (!email) {
            console.error("User has no email address in Clerk");
            return res.status(400).json({ message: "User email is required" });
          }

          // Create user with data from Clerk
          user = await User.create({
            clerkId,
            email,
            name,
            imageUrl,
          });

          console.log("Created new user from Clerk data:", { clerkId, email, name });
        } catch (clerkError) {
          console.error("Error fetching user from Clerk:", clerkError);
          return res.status(500).json({ message: "Failed to sync user from Clerk" });
        }
      }

      req.user = user;

      // Check if user has been deleted (soft delete)
      if (user.deletedAt) {
        return res.status(403).json({
          message: "This account has been deleted. Please contact support if you want to recover your account.",
        });
      }

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - user not found" });
  }

  if (req.user.email !== ENV.ADMIN_EMAIL) {
    return res.status(403).json({ message: "Forbidden - admin access only" });
  }

  next();
};
