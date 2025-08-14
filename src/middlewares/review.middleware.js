// middleware/checkEligibilityToReview.js
import { Booking } from '../models/serviceBooking.model.js';
import { Review } from '../models/review.model.js';
import { Order } from '../models/orders.model.js';

export const canReview = async (req, res, next) => {
  const { refId, refType } = req.body;
  const userId = req.user._id.toString();

  if (!refId || !refType || !['Product', 'Service'].includes(refType)) {
    return res.status(400).json({ message: 'Invalid review reference data' });
  }

  try {
    const alreadyReviewed = await Review.findOne({ user: userId, refId, refType });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this item.' });
    }

    if (refType === 'Service') {
      const completedBooking = await Booking.findOne({
        user: userId,
        'service.serviceId': refId,
        status: 'completed',
      });

      if (!completedBooking) {
        return res.status(403).json({ message: 'You can only review services you have completed.' });
      }

    } else if (refType === 'Product') {
      const completedOrder = await Order.findOne({
        user: userId,
        orderStatus: 'Delivered',
        'items.product': refId,
      });

      if (!completedOrder) {
        return res.status(403).json({ message: 'You can only review products you have purchased and were delivered.' });
      }
    }

    next();

  } catch (error) {
    res.status(500).json({ message: 'Error checking review eligibility', error: error.message });
  }
};
