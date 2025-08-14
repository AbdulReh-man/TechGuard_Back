import mongoose from "mongoose";
import { uploadoncloudinary } from "../../utils/cloudinary_service.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";


  
  // @desc Create a new product (Only Producers)
const createProduct = async (req, res) => {
    try {
      const { name, description, price, stock, categoryID} = req.body;

      if (!name || !description || !price || !stock || !categoryID) {
        return res.status(400).json({ message: "All fields are required!" });
      }

      // Validate category existence
      const categoryExists = await Category.findById(categoryID);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID. Category does not exist." });
      }

       // Extract image paths safely using optional chaining
       const imagePaths = req.files?.map(file => file.path) || [];
    
    if (imagePaths.length === 0) {
      return res.status(400).json({ message: "At least one product image is required." });
    }
  
    // Upload images to Cloudinary and get URLs
    const imageUrls = await Promise.all(
      imagePaths.map(async (path) => {
        const result = await uploadoncloudinary(path);
        return result.secure_url;
      })
    );
    

    // const imageUrlss = uploadoncloudinary(imagePaths) 
    
  if(imageUrls.length === 0){
    return res.status(400).json({ message: "At least one product image is required." });
  }
    const imageUrl = imageUrls;

      // Create and save the product
      const product = new Product({
        name,
        description,
        price,
        stock, 
        category: categoryID,
        imageUrl: imageUrl
    });
      await product.save();
  
      res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
      res.status(500).json({ message: "Error adding product", error });
    }
  };
  
  // @desc Get all products
const getProducts = async (req, res) => {
    try {
      const products = await Product.find().populate("category", "name email");
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error });
    }
  };
  
  // @desc Get a single product by ID
const getProductById = async (req, res) => {
    try {
      console.log(req.params.id)
      const product = await Product.findById(req.params.id).populate("category", "name");
      console.log ("here")
  
      if (!product) return res.status(404).json({ message: "Product not found" });
  
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product details", error });
    }
  };
  
  //  Update a product (Only Producers)
const updateProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
   
      const { name, description, price, stock, category} = req.body;
  
  
      // Validate category existence if updating category
      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({ message: "Invalid category ID. Category does not exist." });
        }
      }
      // console.log(req.body)
      
      // If new images are uploaded
    
    // Handle image uploads only if new images are provided
    // if (req.files?.images?.length > 0) {
    //   product.imageUrl = []; // Reset existing images
    //   const imagePaths = req.files.images.map((file) => file.path);

    //   // Upload new images to Cloudinary
    //   const uploadedImages = await Promise.all(
    //     imagePaths.map(async (path) => {
    //       const result = await uploadoncloudinary(path);
    //       return result.secure_url;
    //     })
    //   );

    //   product.imageUrl = uploadedImages; // Save new images
    // }
      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, { name, description, price, stock, category }, { new: true });
  
      if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
  
      res.status(200).json(updatedProduct);

    } catch (error) {
      res.status(500).json({ message: "Error updating product", error });
    }
  };
  
  // @desc Delete a product (Only Producers delete their own products)
 const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }


    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error });
    }
  };


 

  export {createProduct,getProducts,getProductById,updateProduct,deleteProduct}
  