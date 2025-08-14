import express from 'express';
import {
  createBooking,
  getAllBookings,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  cancelBooking,
  confirmServiceBookingPayment
} from '../controllers/serviceBooking.controller.js';
import { verifyJWT,adminOnly,serviceProviderOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

// User books a service
router.route('/createBooking').post(verifyJWT, createBooking);

//// Confirm payment after user returns from Stripe
router.route('/confirm-service-booking').post(verifyJWT, confirmServiceBookingPayment);

// Admin: get all bookings
router.route('/getAllBookings').get(verifyJWT, adminOnly, getAllBookings);

// Logged-in customer
router.route('/getUserBookings').get(verifyJWT, getUserBookings);

// Logged-in service provider
router.route('/getProviderBookings').get(verifyJWT, serviceProviderOnly, getProviderBookings);

// Update status (confirmed/cancelled/completed)
router.route('/updateBookingStatus/:id').put(verifyJWT,serviceProviderOnly, updateBookingStatus);

//Cancle booking
// User can cancel only if Pending
router.route('/cancelBooking/:id').put(verifyJWT, cancelBooking);


export default router;
