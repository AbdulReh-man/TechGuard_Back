// models/Booking.js
import mongoose from 'mongoose';
import {addressSchema} from "./user.model.js";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: {
    serviceId: {type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    title: String,
    description: String,
    price: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  shippingAddress: { type: addressSchema, required: true },
  paymentMethod: { type: String, enum: ["COD", "Online"], default: "COD" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
},{
  timestamps: true,
}); 

export const Booking = mongoose.model('Booking', bookingSchema);

