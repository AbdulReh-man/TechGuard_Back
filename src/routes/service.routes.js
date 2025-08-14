import { Router } from "express";
import { createService, getServices, getServiceById, updateService,
    deleteService, getServiceProviderServices, getServicesBySubcategory,
getServiceDetailsWithOtherServices } from "../controllers/service.controller.js";
// import { upload } from "../middlewares/multer.middleware.js";



import { verifyJWT,serviceProviderOnly } from "../middlewares/auth.middleware.js";

const router = Router();

// Create a service (Only Service Providers)
router.route("/createService").post(verifyJWT, serviceProviderOnly,createService)

// Get all services
router.route("/getServices").get(getServices)

//Get all services of a specific service provider
router.route("/getServiceProviderServices").get(verifyJWT, serviceProviderOnly, getServiceProviderServices)

// Get a single Service by ID
router.route("/getServiceById/:id").get(getServiceById)

// // Update a Service (Only Service Providers)
// Service Provider: Update their services
router.route("/updateService/:id").put(verifyJWT,serviceProviderOnly, updateService);

// Delete a Service (Only Service Providers)
router.route("/deleteService/:id").delete(verifyJWT,serviceProviderOnly, deleteService)

// getallservices of subcategory from all provider
router.route("/getServicesBySubcategory/:subcategoryId").get(getServicesBySubcategory)

// routes/serviceRoutes.js
router.get("/service/:id/details", getServiceDetailsWithOtherServices);


export default router;

