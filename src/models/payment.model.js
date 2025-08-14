import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order', // For product payments, reference Order model
    },
    serviceBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceBooking', // For service payments, reference ServiceBooking model
    },
    stripeSessionId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'failed', 'pending'],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['product', 'service'], // Differentiates product and service payments
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);


