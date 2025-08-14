import { Router } from "express";
import { addToCart, getCart, removeFromCart, clearCart } from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


//  Add product to cart
//  Private route
router.route("/addToCart").post(verifyJWT, addToCart);


//  Get user's cart
//  Private route

router.route("/getCart").get(verifyJWT, getCart);


// Remove a product from cart
// Private route

router.route("/removeFromCart/:id").delete(verifyJWT, removeFromCart);


//   Clear entire cart
//  Private route

router.route("/clearCart").delete(verifyJWT, clearCart);

export default router;
