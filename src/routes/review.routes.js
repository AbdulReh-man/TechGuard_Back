// routes/reviewRoutes.js
import express from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { canReview } from '../middlewares/review.middleware.js';
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByRef,
  getAverageRating,
  getAllReviews
} from '../controllers/review.controller.js';

const router = express.Router();


// Create a new review
// Private route (User must be logged in)
// User can only review if they have booked the service
// User can only review once per service
// User can only review if the booking status is completed
router.route("/createReview").post(verifyJWT,canReview, createReview);


// Update an existing review
// Private route (User must be logged in)
// User can only update their own review
router.route("/updateReview/:id").put(verifyJWT, updateReview);


// Delete a review
// Private route (User must be logged in)
// User can only delete their own review
// Admin can delete any review
router.route("/deleteReview/:id").delete(verifyJWT, deleteReview);


// Get reviews by reference (Service or Product)
// Public route (Anyone can access) 
router.route("/getReviewsByRef/:type/:id").get(getReviewsByRef);// e.g., /reviews/Service/123


// Get average rating for a specific service or product
// Public route (Anyone can access)
router.route("/getAverageRating/:type/:id").get(getAverageRating);// e.g., /reviews/avg/Service/123

// 
router.get("/getreviews", verifyJWT, getAllReviews);
export default router;
