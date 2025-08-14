import { Category } from "../models/category.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

//  Category Controller 

// Create a new category
const createCategory = asyncHandler(async (req, res) => {
  const { name, description ,type } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }
  if (!description) {
    res.status(400);
    throw new Error("Description is required");
  }
  if (!type) {
    res.status(400);
    throw new Error("Ctegory Type is required");
  }

  // Check for existing category
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    res.status(409);
    throw new Error("Category already exists");
  }

  // Create and return populated category
  const category = await Category.create({ name, description, type });
  const populatedCategory = await Category.findById(category._id).populate(
    "subcategories"
  );

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category: populatedCategory,
  });
});

// Get all products categories with subcategories
const getProductsCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ type: 'product'})
    .populate({
      path: "subcategories",
      select: "-__v -category",
    })
    .select("-__v");

  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

// Get all services categories with subcategories
const getServicesCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ type: 'service'})
  .populate('subcategories') // Uses the virtual field defined in your schema
      .sort({ createdAt: -1 }); // Optional: latest first
    // .populate({
    //   path: "subcategories",
    //   select: "-__v -category",
    // })
    // .select("-__v");

  res.status(200).json({
    success: true,
    message: 'Service categories with subcategories fetched successfully',
    count: categories.length,
    categories,
  });
});

// Update a category
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const categoryId = req.params.id;

  // Check for name conflict
  if (name) {
    const existingCategory = await Category.findOne({
      name,
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      res.status(409);
      throw new Error("Category name already exists");
    }
  }

  // Update and return populated category
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { name, description },
    { new: true, runValidators: true }
  ).populate("subcategories");

  if (!updatedCategory) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category: updatedCategory,
  });
});

// Delete a category and its subcategories
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Clean up subcategories
  await SubCategory.deleteMany({ category: req.params.id });

  res.status(200).json({
    success: true,
    message: "Category and all associated subcategories deleted successfully",
  });
});

// ```SubCategory Controller```;
import { SubCategory } from "../models/category.model.js";



// Create a new subcategory
const createSubCategory = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;

  // Basic validation
  if (!name || !category) {
    res.status(400);
    throw new Error("Name and category are required fields");
  }

  // Verify parent category exists
  const parentCategory = await Category.findById(category);
  if (!parentCategory) {
    res.status(404);
    throw new Error("Parent category not found");
  }

  // Create subcategory
  const subCategory = await SubCategory.create({
    name,
    description,
    category,
  });

  res.status(201).json({
    success: true,
    message: "Subcategory created successfully",
    subCategory,
  });
});

// Get all subcategories (with optional category filter)
const getAllSubCategories = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};

  const subCategories = await SubCategory.find(filter)
    .populate({
      path: "category",
      select: "name _id",
    })
    .select("-__v");

  res.status(200).json({
    success: true,
    count: subCategories.length,
    subCategories,
  });
});

// Get single subcategory
const getSingleSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id)
    .populate({
      path: "category",
      select: "name _id",
    })
    .select("-__v");

  if (!subCategory) {
    res.status(404);
    throw new Error("Subcategory not found");
  }

  res.status(200).json({
    success: true,
    subCategory,
  });
});

//  Get subcategories by category ID
const getSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const parentCategory = await Category.findById(categoryId);
    if (!parentCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const subcategories = await SubCategory.find({ category: categoryId });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subcategories for category', error: error.message });
  }
};

// Update a subcategory
const updateSubCategory = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (category) {
    // Verify new category exists
    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
      res.status(404);
      throw new Error("New parent category not found");
    }
    updateData.category = category;
  }

  const updatedSubCategory = await SubCategory.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate({
      path: "category",
      select: "name _id",
    })
    .select("-__v");

  if (!updatedSubCategory) {
    res.status(404);
    throw new Error("Subcategory not found");
  }

  res.status(200).json({
    success: true,
    message: "Subcategory updated successfully",
    subCategory: updatedSubCategory,
  });
});

// Delete a subcategory
const deleteSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findByIdAndDelete(req.params.id);

  if (!subCategory) {
    res.status(404);
    throw new Error("Subcategory not found");
  }

  res.status(200).json({
    success: true,
    message: "Subcategory deleted successfully",
  });
});


export {
  createSubCategory,
  getAllSubCategories,
  getSubCategoriesByCategory,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory
}
export { createCategory, getProductsCategories, getServicesCategories, updateCategory, deleteCategory };
