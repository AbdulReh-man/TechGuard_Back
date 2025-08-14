import express from "express"
import { createCategory, getProductsCategories, getServicesCategories,
    updateCategory, deleteCategory } from "../controllers/category.controller.js";
import { verifyJWT, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

//Category Routes
router.route("/createCategory").post(verifyJWT,adminOnly,createCategory)
router.route("/getProductsCategories").get(getProductsCategories)
router.route("/getServicesCategories").get(getServicesCategories)
router.route("/updateCategory/:id").put(verifyJWT,adminOnly,updateCategory)
router.route("/deleteCategory/:id").delete(verifyJWT,adminOnly,deleteCategory)

// Subcategory routes


import {
  createSubCategory,
  getAllSubCategories,
  getSubCategoriesByCategory,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory
} from '../controllers/category.controller.js';

// All routes below are protected and only for admin

//  Create subcategory
router.route("/createSubCategory").post(verifyJWT,adminOnly,createSubCategory)

//  Get all subcategories
router.route("/getAllSubCategories").get(getAllSubCategories)

//  Get all subcategories for a specific category
router.route("/getSubCategoriesByCategory/:categoryId").get(getSubCategoriesByCategory)

//  Get single subcategory by ID
router.route("/getSingleSubCategory/:id").get(getSingleSubCategory)

//  Update subcategory
router.route("/updateCategory/:id").put(verifyJWT,adminOnly,updateSubCategory)

//  Delete subcategory
router.route("/deleteSubCategory/:id").delete(verifyJWT,adminOnly,deleteSubCategory)


export default router;

