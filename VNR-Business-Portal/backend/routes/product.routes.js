import express from "express";
import {
  getProducts,
  getProductById,
  getCategories,
  getProductsByCategory,
  searchProducts
} from "../controllers/product.controller.js";

const router = express.Router();

// Static routes first
router.get("/search", searchProducts);
router.get("/categories", getCategories);
router.get("/category/:categoryId", getProductsByCategory);

// Collection and parameterized routes
router.get("/", getProducts);
router.get("/:id", getProductById);

export default router;
