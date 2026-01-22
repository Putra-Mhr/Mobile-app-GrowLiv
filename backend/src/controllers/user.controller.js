import { User } from "../models/user.model.js";

export async function addAddress(req, res) {
  try {
    const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, coordinates, isDefault } =
      req.body;

    const user = req.user;

    if (!fullName || !streetAddress || !city || !state || !zipCode) {
      return res.status(400).json({ error: "Missing required address fields" });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      coordinates, // Include coordinates
      isDefault: isDefault || false,
    });

    await user.save();

    res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in addAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAddresses(req, res) {
  try {
    const user = req.user;

    res.status(200).json({ addresses: user.addresses });
  } catch (error) {
    console.error("Error in getAddresses controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateAddress(req, res) {
  try {
    const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, coordinates, isDefault } =
      req.body;

    const { addressId } = req.params;

    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    address.label = label || address.label;
    address.fullName = fullName || address.fullName;
    address.streetAddress = streetAddress || address.streetAddress;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.phoneNumber = phoneNumber || address.phoneNumber;
    address.coordinates = coordinates || address.coordinates; // Update coordinates
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();

    res.status(200).json({ message: "Address updated successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in updateAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;
    const user = req.user;

    user.addresses.pull(addressId);
    await user.save();

    res.status(200).json({ message: "Address deleted successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in deleteAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const user = req.user;

    // check if product is already in the wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in addToWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    const user = req.user;

    // check if product is already in the wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product not found in wishlist" });
    }

    user.wishlist.pull(productId);
    await user.save();

    res.status(200).json({ message: "Product removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in removeFromWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    // we're using populate, bc wishlist is just an array of product ids
    const user = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in getWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Profile management
export async function getProfile(req, res) {
  try {
    const user = req.user;

    res.status(200).json({
      profile: {
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        phoneNumber: user.phoneNumber || "",
        birthDate: user.birthDate || null,
        gender: user.gender || "",
        bio: user.bio || "",
      },
    });
  } catch (error) {
    console.error("Error in getProfile controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phoneNumber, birthDate, gender, bio, preferences } = req.body;
    const user = req.user;

    // Update profile fields
    if (name !== undefined) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (gender !== undefined) user.gender = gender;
    if (bio !== undefined) user.bio = bio;

    // Update preferences if provided
    if (preferences !== undefined) {
      if (!user.preferences) {
        user.preferences = {};
      }
      if (preferences.deliveryTime !== undefined) {
        user.preferences.deliveryTime = preferences.deliveryTime;
      }
      if (preferences.favoriteCategories !== undefined) {
        user.preferences.favoriteCategories = preferences.favoriteCategories;
      }
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        phoneNumber: user.phoneNumber || "",
        birthDate: user.birthDate || null,
        gender: user.gender || "",
        bio: user.bio || "",
        preferences: user.preferences || {},
      },
    });
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Onboarding management
export async function getOnboardingStatus(req, res) {
  try {
    const user = req.user;

    res.status(200).json({
      onboardingCompleted: user.onboardingCompleted || false,
      needsOnboarding: !user.onboardingCompleted,
    });
  } catch (error) {
    console.error("Error in getOnboardingStatus controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function completeOnboarding(req, res) {
  try {
    const user = req.user;

    // Mark onboarding as completed
    user.onboardingCompleted = true;
    await user.save();

    res.status(200).json({
      message: "Onboarding completed successfully",
      onboardingCompleted: true,
    });
  } catch (error) {
    console.error("Error in completeOnboarding controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


// Privacy Settings management
export async function getPrivacySettings(req, res) {
  try {
    const user = req.user;

    // Set defaults if privacySettings doesn't exist
    const settings = user.privacySettings || {
      biometricEnabled: false,
      pushNotifications: true,
      emailNotifications: true,
      marketingEmails: false,
      shareData: false,
    };

    res.status(200).json({ privacySettings: settings });
  } catch (error) {
    console.error("Error in getPrivacySettings controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updatePrivacySettings(req, res) {
  try {
    const { biometricEnabled, pushNotifications, emailNotifications, marketingEmails, shareData } = req.body;
    const user = req.user;

    // Initialize privacySettings if it doesn't exist
    if (!user.privacySettings) {
      user.privacySettings = {};
    }

    // Update only provided fields
    if (biometricEnabled !== undefined) user.privacySettings.biometricEnabled = biometricEnabled;
    if (pushNotifications !== undefined) user.privacySettings.pushNotifications = pushNotifications;
    if (emailNotifications !== undefined) user.privacySettings.emailNotifications = emailNotifications;
    if (marketingEmails !== undefined) user.privacySettings.marketingEmails = marketingEmails;
    if (shareData !== undefined) user.privacySettings.shareData = shareData;

    await user.save();

    res.status(200).json({
      message: "Privacy settings updated successfully",
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    console.error("Error in updatePrivacySettings controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Export user data
export async function exportUserData(req, res) {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");

    // Compile all user data
    const exportData = {
      exportDate: new Date().toISOString(),
      profile: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        birthDate: user.birthDate || null,
        gender: user.gender || "",
        bio: user.bio || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      addresses: user.addresses.map((addr) => ({
        label: addr.label,
        fullName: addr.fullName,
        streetAddress: addr.streetAddress,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        phoneNumber: addr.phoneNumber,
        isDefault: addr.isDefault,
      })),
      wishlist: user.wishlist.map((product) => ({
        id: product._id,
        name: product.name,
        price: product.price,
      })),
      privacySettings: user.privacySettings || {},
    };

    res.status(200).json({
      message: "Data exported successfully",
      data: exportData,
    });
  } catch (error) {
    console.error("Error in exportUserData controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Delete user account (Soft Delete)
export async function deleteAccount(req, res) {
  try {
    const user = req.user;
    const userId = user._id;

    // Import models for cascade operations
    const { Cart } = await import("../models/cart.model.js");
    const { Order } = await import("../models/order.model.js");

    // 1. Mark user as deleted (soft delete)
    user.deletedAt = new Date();

    // 2. Anonymize personal data
    user.name = "Deleted User";
    user.email = `deleted_${userId}@deleted.local`;
    user.phoneNumber = "";
    user.birthDate = null;
    user.gender = "";
    user.bio = "";
    user.imageUrl = "";

    // 3. Clear addresses
    user.addresses = [];

    // 4. Clear wishlist
    user.wishlist = [];

    await user.save();

    // 5. Delete cart (personal shopping data)
    await Cart.deleteOne({ user: userId });
    console.log(`Deleted cart for user ${userId}`);

    // 6. Anonymize orders (keep for sellers but remove personal info)
    const ordersUpdated = await Order.updateMany(
      { user: userId },
      {
        $set: {
          "shippingAddress.fullName": "Deleted User",
          "shippingAddress.streetAddress": "[Redacted]",
          "shippingAddress.phoneNumber": "[Redacted]",
        },
      }
    );
    console.log(`Anonymized ${ordersUpdated.modifiedCount} orders for user ${userId}`);

    // Note: Reviews don't need to be updated as they don't store user personal info
    // They only reference userId which still exists (soft deleted)

    res.status(200).json({
      message: "Account deleted successfully. Your personal data has been removed.",
    });
  } catch (error) {
    console.error("Error in deleteAccount controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
