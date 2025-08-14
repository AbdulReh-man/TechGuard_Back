import mongoose from "mongoose";
import { uploadoncloudinary } from "../../utils/cloudinary_service.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { SubCategory } from "../models/category.model.js";
import { Service } from "../models/service.model.js";



  
  // @desc Create a new product (Only Producers)
const createService = async (req, res) => {
    try {
      const { serviceName, description, price, availability, subcategoryID } = req.body;
      const providerId = req.user.id;

      if (!serviceName || !description || !price || !availability || !subcategoryID) {
        return res.status(400).json({ message: "All fields are required!" });
      }

      // Check for duplicate service title under the same subcategory by the same provider
    const existingService = await Service.findOne({
      serviceName: serviceName.trim(),
      subcategoryID,
      serviceProvider: providerId,
    });

    if (existingService) {
      return res.status(400).json({ message: 'You already created this service under this subcategory.' });
    }

      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: 'Price must be a non-negative number' });
      }

      // Validate category existence
      const subCategoryExists = await SubCategory.findById(subcategoryID);
      if (!subCategoryExists) {
        return res.status(400).json({ message: "Invalid SubCategory ID. SubCategory does not exist." });
      }

       

      // Create and save the product
      const service = new Service({
        serviceName,
        description,
        price,
        availability, 
        subcategory: subcategoryID,
        serviceProvider: providerId
    });
      await service.save();
  
      res.status(201).json({ message: "Service created successfully", Service: service });  
    } catch (error) {
      res.status(500).json({ message: "Error adding service", error });
    }
  };
  
  // @desc Get all products
const getServices = async (req, res) => {
    try {
      const services = await Service.find().populate("subcategory serviceProvider", "name email");
      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services", error });
    }
  };
  
  // @desc Get a single product by ID
const getServiceById = async (req, res) => {
    try {
      const service = await Service.findById(req.params.id).populate(
        "subcategory serviceProvider",
        "fullname email address avatar"
      );
  
      if (!service) return res.status(404).json({ message: "Service not found" });
  
      res.status(200).json(service);
    } catch (error) {
      res.status(500).json({ message: "Error fetching service details", error });
    }
  };
  
  //  Update a Service (Only Service Providers)
const updateService = async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    // Ensure only the service provider can update their own service
    if (service.serviceProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
      const { serviceName, description, price, availability} = req.body;
  
 
      const updatedService = await Service.findByIdAndUpdate(req.params.id, { serviceName, description, price, availability}, { new: true });
  
      if (!updatedService) return res.status(404).json({ message: "Service not found" });
  
      res.status(200).json(updatedService);

    } catch (error) {
      res.status(500).json({ message: "Error updating service", error });
    }
  };
  
  // @desc Delete a product (Only srvice provider delete their own services)
 const deleteService = async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Ensure only the serviceProvider can delete his own
    if (service.serviceProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await service.deleteOne();
    res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting service", error });
    }
  };

  // @desc Get all Services of a serviceProvider (Only their own Services)
  const getServiceProviderServices = async (req, res) => {
    try {
      console.log("getServiceProviderServices", req.body.id);

      const services = await Service.find({ serviceProvider: req.user.id }).populate("subcategory serviceProvider", "name email");
      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  };

  //Get all services of subcategory from all provider
  const getServicesBySubcategory = async (req, res) => {
    try {
      const { subcategoryId } = req.params;
     
      // Validate subcategory existence
      const subCategoryExists = await SubCategory.findById(subcategoryId);
      if (!subCategoryExists) {
        return res.status(400).json({ message: "Invalid SubCategory ID. SubCategory does not exist." });
      }

      // Fetch services of the given subcategory from all providers
      const services = await Service.find({
        subcategory: subcategoryId,
      }).populate("serviceProvider", "fullname email avatar");

      if (!services || services.length === 0) {
        return res.status(404).json({ message: "No services found for this subcategory" });
      }

      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services by subcategory", error });
    }
  };

  
  const getServiceDetailsWithOtherServices = async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
  
      // Step 1: Find the main service with provider details
      const service = await Service.findById(id).populate('serviceProvider', 'username email avatar bio');
  
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
  
      // Step 2: Count total other services by same provider
      const totalOtherServices = await Service.countDocuments({
        serviceProvider: service.serviceProvider._id,
        _id: { $ne: service._id },
      });
  
      // Step 3: Get other services from same provider (excluding current)
      const otherServices = await Service.find({
        serviceProvider: service.serviceProvider._id,
        _id: { $ne: service._id },
      })
        .skip((page - 1) * limit)
        .limit(limit);
  
      // Step 4: Return service, provider, and others
      res.status(200).json({
        service,
        serviceProvider: service.serviceProvider,
        otherServices,
        pagination: {
          total: totalOtherServices,
          page,
          pages: Math.ceil(totalOtherServices / limit),
        },
      });
  
    } catch (error) {
      console.error('Error fetching service details:', error);
      res.status(500).json({
        message: 'Error fetching service details',
        error: error.message,
      });
    }
  };

export { createService, getServices, getServiceById, updateService,
  deleteService ,getServiceProviderServices, getServicesBySubcategory,
getServiceDetailsWithOtherServices };