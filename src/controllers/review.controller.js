// controllers/reviewController.js
import { Review } from '../models/review.model.js';
import mongoose from 'mongoose';
import axios from 'axios';

// POST - Add review
const ai_api = "https://ai-review-detect.onrender.com/predict";
// const ai_api = "http://0.0.0.0:10000/predict";
//

export const createReview = async (req, res) => {
  try {
    const { refId, refType, rating, comment } = req.body;
    console.log("body", req.body);

    if (!refId || !refType || !rating) {
      return res
        .status(400)
        .json({ message: "refId, refType, and rating are required." });
    }

    if (!["Product", "Service"].includes(refType)) {
      return res
        .status(400)
        .json({ message: 'Invalid refType. Must be "Product" or "Service"' });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5." });
    }

    let aiResult = { isFake: "Fake", confidenceScore: 0 };

    if (comment) {
      try {
        const response = await axios.post(ai_api, { text: comment });
        const result = response.data; // { prediction: [0] }
        console.log("AI Response from Server: ", result);
        
        aiResult = {
          isFake: result.prediction[0] === 1, // convert 1/0 to boolean
          confidenceScore: result.confidence || 0, // if your API provides confidence
        };
      } catch (error) {
        console.error("AI analysis failed:", error.message);
      }
    }

    const newReview = new Review({
      user: req.user._id,
      refId,
      refType,
      rating,
      comment,
      aiAnalysis: aiResult,
    });

    await newReview.save();

    res
      .status(201)
      .json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating review", error: error.message });
  }
};


// PUT - Update review
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment || review.comment;

    await review.save();
    res.status(200).json({ message: 'Review updated', review });

  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

// DELETE - Delete review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    res.status(200).json({ message: 'Review deleted' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

// GET - Reviews for a service or product
export const getReviewsByRef = async (req, res) => {
  try {
    const { id, type } = req.params;

    const reviews = await Review.find({ refId: id, refType: type })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};


// GET - All reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    console.log(reviews);
    

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all reviews', error: error.message });
  }
};


// GET - Average rating for product/service
export const getAverageRating = async (req, res) => {
  try {
    const { id, type } = req.params;

    const result = await Review.aggregate([
      { $match: { refId: new mongoose.Types.ObjectId(id), refType: type } },
      {
        $group: {
          _id: '$refId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(200).json({ averageRating: 0, totalReviews: 0 });
    }

    const { averageRating, totalReviews } = result[0];
    res.status(200).json({ averageRating: Math.round(averageRating * 10) / 10, totalReviews });

  } catch (error) {
    res.status(500).json({ message: 'Error calculating average rating', error: error.message });
  }
};
