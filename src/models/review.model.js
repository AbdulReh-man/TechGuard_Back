import mongoose from "mongoose";
const Schema = mongoose.Schema;

// models/review.model.js
const reviewSchema = new Schema(
  { 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who wrote it
    //refID is the ID of the product or service being reviewed
    refId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // The product or service being reviewed
    refType: {
    type: String,
    enum: ['Product', 'Service'], // What kind of thing it is
    required: true,
    },
    rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    set: v => Math.round(v * 10) / 10, // Rounds to 1 decimal
    },
    comment: { type: String, trim: true, maxlength: 500 },
    aiAnalysis: {
      isFake: { type: String, enum:['Genuine','Fake'], default: 'Fake' },
      confidenceScore: { type: Number, min: 0, max: 1 }
    }
  },
  { timestamps: true }
);

//``` Use a pre-save hook to trigger AI analysis when a review is created/updated:```;
// reviewSchema.pre("save", async function (next) {
//   if (this.isNew || this.isModified("comment")) {
//     const aiResult = await callAIApi(this.comment);
//     this.aiAnalysis = aiResult;
//     this.status = aiResult.isFake ? "flagged" : "approved";
//   }
//   next();
// });

// Indexes for product review moderation
reviewSchema.index({ status: 1 });
reviewSchema.index({ "aiAnalysis.isFake": 1 });

export const Review = mongoose.model("Review", reviewSchema);
