import mongoose from "mongoose";

// ``` CategorySchema ```;
const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['product', 'service'],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true },
  }
);

// ``` Virtual for subcategories (not stored in DB) ```;
CategorySchema.virtual("subcategories", {
  ref: "SubCategory", // Reference SubCategory model
  localField: "_id", // _id of Category
  foreignField: "category", // Field in SubCategory that links to Category
  justOne: false, // Return array of subcategories
});

// ``` SubCategorySchema```
const SubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sub Category name is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for unique subcategory name within a category
SubCategorySchema.index({ name: 1, category: 1 }, { unique: true });

export const Category = mongoose.model("Category", CategorySchema);
export const SubCategory = mongoose.model("SubCategory", SubCategorySchema);
