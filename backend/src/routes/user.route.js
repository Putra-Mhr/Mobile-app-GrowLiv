import { Router } from "express";
import {
  addAddress,
  addToWishlist,
  completeOnboarding,
  deleteAccount,
  deleteAddress,
  exportUserData,
  getAddresses,
  getOnboardingStatus,
  getPrivacySettings,
  getProfile,
  getWishlist,
  removeFromWishlist,
  updateAddress,
  updatePrivacySettings,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

// profile routes
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// onboarding routes
router.get("/onboarding-status", getOnboardingStatus);
router.post("/complete-onboarding", completeOnboarding);

// privacy settings routes
router.get("/privacy-settings", getPrivacySettings);
router.put("/privacy-settings", updatePrivacySettings);

// account management routes
router.get("/export-data", exportUserData);
router.delete("/account", deleteAccount);

// address routes
router.post("/addresses", addAddress);
router.get("/addresses", getAddresses);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

// wishlist routes
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);
router.get("/wishlist", getWishlist);

export default router;
