import { Customer } from "../models/customer.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Create new Product 
const createProduct = asyncHandler(async (req, res) => {
    const { name, gstRate, rate } = req.body;

    // Get dealer from auth middleware
    const dealerId = req.dealer._id;

    // Validation
    if (!name || !gstRate || !rate) {
        throw new ApiError(400, "Name, email and phone are required");
    }

    // Check if Product already exists with this mail for this dealer
    const existingProduct = await Product.findOne({
        name,
        dealer: dealerId
    });

    if (existingProduct) {
        throw new ApiError(400, "Product with this name already exists");
    }

    // Create Product with only required fields
    const customer = await Product.create({
        name,
        gstRate,
        rate,
        dealer: dealerId
    });

    return res.status(201).json(
        new ApiResponse(200, customer, "Product created successfully")
    );
});
//update the product details
const updateProduct = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;
    const { productId } = req.body;

    // Find customer
    const product = await Product.findOne({
        _id: productId,
        dealer: dealerId
    });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const { name, gstRate, rate } = req.body;

    // Check if the new Procduct name already exists for this dealer (if provided)
    if (name) {
        const existingProduct = await Product.findOne({
            name,
            dealer: dealerId,
            _id: { $ne: productId }
        });
        if (existingProduct) {
            throw new ApiError(400, "Product already in use");
        }
        product.name = name;
    }

    // Update only provided fields

    if (rate) product.rate = rate;
    if (gstRate) product.gstRate = gstRate;

    await product.save();

    return res.status(200).json(
        new ApiResponse(200, product, "Product details updated successfully")
    );
});
//delete the product
const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found")
    }
    await Product.findByIdAndDelete(productId)
    return res.status(200).json(
        new ApiResponse(200, {}, "Product deleted successfully")
    );
})
const getProductByName = asyncHandler(async (req, res) => {
    const { name } = req.body;
    // Get dealer from auth middleware
    const dealerId = req.dealer._id;
    if (!name) {
        throw new ApiError(404, "Give Product Name")
    }

    const product = await Product.findOne({
        name: { $regex: name, $options: "i" }, 
        dealer: dealerId
    });
    
    if (!product) {
        throw new ApiError(404, "Product is not present. create it first")
    }
    return res.status(200).json(
        new ApiResponse(200, { product }, "Product is found successfully")
    );
})
export {
    createProduct,
    updateProduct,
    getProductByName,
    deleteProduct
};