import { Booking } from '../models/serviceBooking.model.js';
import { Payment } from '../models/payment.model.js'; 
import { Service } from '../models/service.model.js';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import sendEmail from "../../utils/emailConfig.js"; // Adjust path if needed
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Make sure this is set in .env



// Helper: Validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. Create a new booking
// export const createBooking = async (req, res) => {
//   try {
//     const { serviceId, paymentMethod } = req.body;
//     const userId = req.user._id; // from middleware
//     const service = await Service.findById(serviceId).populate('serviceProvider');

//     if (!service) return res.status(404).json({ message: 'Service not found' });
   
//     if (!['COD', 'Online'].includes(paymentMethod)) {
//         return res.status(400).json({ message: 'Invalid payment method' });
//       }

//     const booking = new Booking({
//       user: userId,
//       provider: service.serviceProvider,
//       service: {
//         serviceId: service._id,
//         title: service.name,
//         description: service.description,
//         price: service.price,
//       },
//       paymentMethod,
//     });

//     await booking.save();

//     res.status(201).json({ message: 'Booking created successfully', booking });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to create booking', error: err.message });
//   }
// };
import{ User} from '../models/user.model.js'; // make sure to import your User model
export const createBooking = async (req, res) => {
  try {
    const { serviceId, paymentMethod } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const service = await Service.findById(serviceId).populate('serviceProvider');
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (!['COD', 'Online'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

     // Get address from user model
     const formattedAddress = `${user.address.street}, ${user.address.city}, ${user.address.zipCode}, ${user.address.country}`;

    console.log(formattedAddress)

    // Create Booking Immediately if COD
    if (paymentMethod === 'COD') {
      const booking = new Booking({
        user: userId,
        provider: service.serviceProvider._id,
        service: {
          serviceId: service._id,
          title: service.serviceName,
          description: service.description,
          price: service.price,
        },
        address: formattedAddress,
        paymentMethod,
        paymentStatus: 'Pending',
        status: 'Confirmed',
      });

      await booking.save();
      return res.status(201).json({ message: 'Booking created successfully (COD)', booking });
    }

    // For Online Payment → create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: service.serviceName,
            description: service.description,
          },
          unit_amount: service.price * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?bookingsession_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        userId: userId.toString(),
        serviceId: service._id.toString(),
        providerId: service.serviceProvider._id.toString(),
        address: formattedAddress , // Stored address from user model
        title: service.serviceName,
        description: service.description,
        price: service.price.toString(),
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create session', error: err.message });
  }
};


export const confirmServiceBookingPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed or session invalid' });
    }

    // Check if payment is already marked as paid
    const existingPayment = await Payment.findOne({ stripeSessionId: sessionId });
    if (existingPayment && existingPayment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment has already been processed' });
    }

    const { userId, serviceId, providerId, address, title, description, price } = session.metadata;

    // Create booking now (after payment)
    const booking = await Booking.create({
      user: userId,
      provider: providerId,
      service: {
        serviceId,
        title,
        description,
        price,
      },
      status: 'confirmed',
      shippingAddress: {
        street: address.split(',')[0].trim(),
        city: address.split(',')[1].trim(),
        zipCode: address.split(',')[2].trim(),
        country: address.split(',')[3].trim(),
      },
      paymentMethod: 'Online',
      paymentStatus: 'Paid',
    });

    await Payment.create({
      userEmail: session.customer_details.email,
      serviceBooking: booking._id,
      stripeSessionId: session.id,
      amount: session.amount_total / 100,
      currency: session.currency,
      paymentStatus: session.payment_status,
      paymentType: 'service',
    });

    // Send email to customer
    const user = await User.findById(userId);
    const provider = await User.findById(providerId);
    if (!user || !provider) {
      return res.status(404).json({ message: 'User or Provider not found' });
    }
    const emailText = `
      <h2>Your service booking has been confirmed!</h2>
      <p>Service: ${title}</p>
      <p>Provider: ${provider.username}</p>
      <p>Address: ${address}</p>
      <p>Total Paid: $${session.amount_total / 100}</p>
      <p>Thank you!</p>
    `;
    await sendEmail(session.customer_details.email, 'Service Booking Confirmed', emailText);

    res.status(200).json({ message: 'Service booking payment confirmed and booking created', booking });
  } catch (error) {
    res.status(500).json({ message: 'Payment confirmation failed', error: error.message });
  }
};




// 2. Get all bookings (admin)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'fullname email')
      .populate('provider', 'fullname email')
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings', error: err.message });
  }
};

// 3. Get bookings by logged-in user
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('provider', 'fullname email')
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your bookings', error: err.message });
  }
};

// 4. Get bookings by logged-in provider
export const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('user', 'fullname email')
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching provider bookings', error: err.message });
  }
};

// 5. Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const providerId = req.user._id;
    const { status } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    console.log(booking.provider.toString(), providerId.toString())

    // Check ownership
    if (booking.provider.toString() !== providerId.toString()) {
        return res.status(403).json({ message: 'You are not allowed to update this booking' });
      }


      // Validate status
    const allowedStatus = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    
    const updated = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });

    if (!updated) return res.status(404).json({ message: 'Booking not found' });

    res.status(200).json({ message: 'Booking status updated', booking: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update booking status', error: err.message });
  }
};




// controllers/bookingController.js
export const cancelBooking = async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user._id;
      const userRole = req.user.role;

      if (!isValidObjectId(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
      }
  
      const booking = await Booking.findById(bookingId);
  
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      // Only the user or provider who owns the booking can cancel
      if (
        booking.user.toString() !== userId.toString() &&
        booking.provider.toString() !== userId.toString() &&
        userRole !== 'admin'
      ) {
        return res.status(403).json({ message: 'Not authorized to cancel this booking' });
      }
  
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        return res.status(400).json({ message: 'Completed bookings cannot be cancelled' });
      }
  
      booking.status = 'cancelled';
      await booking.save({ validateBeforeSave: false });
  
     
      res.status(200).json({ message: 'Booking cancelled successfully', booking });
    } catch (err) {
      res.status(500).json({ message: 'Error cancelling booking', error: err.message });
    }
  };
  