import { Router } from "express";
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";



import { verifyJWT,adminOnly } from "../middlewares/auth.middleware.js";

const router = Router();

// Create a product (Only Producers)
router.route("/createProduct").post(verifyJWT, adminOnly, 
   upload.array("productImages", 3),
  createProduct)

// Get all products
router.route("/getProducts").get(getProducts)


// Get a single product by ID
router.route("/getProductById/:id").get(getProductById)

// // Update a product (Only Admin)
router.route("/updateProduct/:id").put(verifyJWT, adminOnly, upload.array("productImages", 3), updateProduct);

// Delete a product (Only Producers)
router.route("/deleteProduct/:id").delete(verifyJWT, adminOnly, deleteProduct)

export default router;

