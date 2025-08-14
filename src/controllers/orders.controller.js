import {Order} from "../models/orders.model.js";
import { User } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";
import {Product} from "../models/product.model.js";
import Stripe from "stripe";
import { Payment } from "../models/payment.model.js";
import sendEmail from "../../utils/emailConfig.js"; // Adjust path if needed
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Make sure this is set in .env

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { values } = req.body;
    const { payment, address } = values;
    const paymentMethod = payment;
    console.log(values.address)
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    // Check stock
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${item.product.name}` });
      }
    }

    // If payment method is "Online", create Stripe Checkout session
    if (paymentMethod === "Online") {
      const lineItems = cart.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.name,
          },
          unit_amount: Math.round(item.product.price * 100), // in cents
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
        metadata: {
          userId: userId,
          street: address.street,
          city: address.city,
          zipCode: address.zipCode,
          country: address.country,
        },
      });
      console.log("Session: ", session);
      
      // res.json({ id: session.id });
      return res.status(200).json({ url: session.url ,sessionId: session.id }); // redirect frontend
    }

    // For Cash on Delivery
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    const { street, city, zipCode, country } = address;
    if (!street || !city || !zipCode || !country) {
      return res.status(400).json({ message: "All address fields are required!" });
    }
    const order = await Order.create({
      user: userId,
      items: cart.items,
      orderPrice: cart.totalPrice,
      paymentMethod,
      paymentStatus: "Pending",
      shippingAddress: {
        street: address.street,
        city: address.city,
        zipCode: address.zipCode,
        country: address.country,
      },
    });

    await Cart.findOneAndDelete({ user: userId });

    res.status(201).json({ message: "Order placed with Cash on Delivery", order });
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error: error.message });
  }
};



const confirmPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(sessionId)
    
    

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const userId = session.metadata.userId;
    console.log(userId)
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty or already cleared" });
    }

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }


    const address = {
      street: session.metadata.street,
      city: session.metadata.city,
      zipCode: session.metadata.zipCode,
      country: session.metadata.country,
    };
    
    console.log("session: ", session);
    
    console.log(address);
    
    if (!address.street || !address.city || !address.zipCode || !address.country) {
      return res.status(400).json({ message: "All address fields are required!" });
    }
    
    const order = await Order.create({
      user: userId,
      items: cart.items,
      orderPrice: cart.totalPrice,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      orderStatus: "Processing",
      shippingAddress: address
      });

  
    
  const test=  await order.save();

    console.log(session.customer_details.email)

    const paymentRecord= await Payment.create({
      userEmail: session.customer_details.email,
      order: order._id,
      stripeSessionId: session.id,
      amount: session.amount_total / 100,
      currency: session.currency,
      paymentStatus: session.payment_status,
      paymentType: 'product', // Set paymentType to "product"
    });

    console.log(paymentRecord)
    await Cart.findOneAndDelete({ user: userId });

    const user = await User.findById(userId);


const emailText =  `
<h2>Your payment has been received!</h2>
<p>Order ID: ${order._id}</p>
<p>Total Paid: $${session.amount_total / 100}</p>
<p>Thank you for shopping with us!</p>
`
await sendEmail(user.email, "Payment Successful & Order Confirmed", emailText);
res.status(200).json({ message: "Order placed after payment", order });

  } catch (error) {
    res.status(500).json({ message: "Payment confirmation failed", error: error.message });
  }
};


const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate("items.product", "name price imageUrls");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};


const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").populate("items.product", "name price");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all orders", error });
  }
};


const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name price imageUrls");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the user is the owner of the order or an admin
    if (req.user.role !== "admin"  && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order details", error });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const {orderStatus } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid status update" });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    order.orderStatus = orderStatus;
    await order.save();
    
    console.log(order);
    
    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Error updating order status", error });
  }
};


const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own orders" });
    }
    console.log(order)
    // Allow cancellation only if order is still "Pending"
    if (order.orderStatus !== "Pending") {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    // Restore stock when an order is cancelled
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    await order.deleteOne();

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling order", error });
  }
};



export { placeOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus, cancelOrder, confirmPayment }