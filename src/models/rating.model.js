// models/rating.model.js
import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ratingBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: false, // Optional if rating is for general provider performance
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "flagged", "rejected"],
      default: "pending",
    },
    aiAnalysis: {
      isFake: { type: Boolean, default: false },
      confidenceScore: { type: Number, min: 0, max: 1 },
      flaggedReasons: {
        type: [String],
        default: [],
      },
      analyzedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings for same service/provider by same user
ratingSchema.index({ ratedUser: 1, ratingBy: 1, service: 1 }, { unique: true });

// Static method to calculate average rating
ratingSchema.statics.calculateAverageRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { ratedUser: userId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  try {
    await mongoose.model("User").findByIdAndUpdate(userId, {
      "serviceProviderDetails.rating": result[0]?.averageRating.toFixed(1) || 0,
    });
  } catch (error) {
    console.error("Error updating average rating:", error);
  }
};

// Update average rating after saving
ratingSchema.post("save", async function (doc) {
  await doc.constructor.calculateAverageRating(doc.ratedUser);
});

// Update average rating after removing
ratingSchema.post("remove", async function (doc) {
  await doc.constructor.calculateAverageRating(doc.ratedUser);
});

ratingSchema.index({ status: 1 });
ratingSchema.index({ "aiAnalysis.isFake": 1 });

export const Rating = mongoose.model("Rating", ratingSchema);
