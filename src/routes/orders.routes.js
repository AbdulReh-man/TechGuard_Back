import express from "express";
import { 
  placeOrder, 
  getUserOrders, 
  getAllOrders, 
  getOrderById, 
  updateOrderStatus, 
  cancelOrder,
  confirmPayment
} from "../controllers/orders.controller.js";

import { verifyJWT, serviceProviderOnly, adminOnly} from "../middlewares/auth.middleware.js";

const router = express.Router();

//Secure routes

//  Place a new order (From Cart)
router.route("/placeOrder").post(verifyJWT, placeOrder);

router.route("/confirmPayment").post(verifyJWT, confirmPayment);

// Get all orders of the logged-in user
router.route("/getUserOrders").get(verifyJWT, getUserOrders);

//  Cancel an order (Users can cancel only if Pending)
router.route("/cancelOrder/:id").delete(verifyJWT, cancelOrder);

// Get all orders (Admin)
router.route("/getAllOrders").get(verifyJWT, adminOnly, getAllOrders);

//   Get details of a specific order
//   Private (Users, Admin)
router.route("/getOrderById/:id").get(verifyJWT, getOrderById);

//  Update order status (For Admin)
//  Private (Admin)
router.route("/updateOrderStatus/:id").put(verifyJWT, adminOnly, updateOrderStatus);




export default router;
