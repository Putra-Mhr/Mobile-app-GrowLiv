import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllProducts } from "../controllers/admin.controller.js";
import { getProductById, getProductsByStore } from "../controllers/product.controller.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/by-store/:storeId", getProductsByStore);
router.get("/:id", protectRoute, getProductById);

export default router;

