import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllProducts } from "../controllers/admin-product.controller.js";
import { getProductById, getProductsByStore, searchProducts } from "../controllers/product.controller.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/by-store/:storeId", getProductsByStore);
router.get("/:id", protectRoute, getProductById);

export default router;

