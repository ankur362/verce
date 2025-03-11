import { Customer } from "../models/customer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create new customer with only name, email, phone
const createCustomer = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const dealerId = req.dealer._id;

    if (!email || !phone || !name) {
        throw new ApiError(400, "Name, email, and phone are required");
    }

    const existingCustomer = await Customer.findOne({ email, dealer: dealerId });
    if (existingCustomer) {
        throw new ApiError(400, "Customer with this email already exists");
    }

    const existingPhoneCustomer = await Customer.findOne({ phone, dealer: dealerId });
    if (existingPhoneCustomer) {
        throw new ApiError(400, "Customer with this phone already exists");
    }

    // Set SSE headers only once
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const customer = await Customer.create({
            name,
            email,
            phone,
            dealer: dealerId
        });

        // Stream customer data
        res.write(`data: ${JSON.stringify({ message: "Customer created successfully", customer })}\n\n`);

        // End the stream properly
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: "Error creating customer" })}\n\n`);
        res.end();
    }
});



const updateCustomer = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;
    const { customerId } = req.body;

    // Find customer
    const customer = await Customer.findOne({
        _id: customerId,
        dealer: dealerId
    });

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    const { name, email, phone, address, gstNumber } = req.body;

    // Check if the new email already exists for this dealer (if provided)
    if (email) {
        const existingCustomer = await Customer.findOne({
            email,
            dealer: dealerId,
            _id: { $ne: customerId }
        });
        if (existingCustomer) {
            throw new ApiError(400, "Email already in use");
        }
        customer.email = email;
    }

    // Update only provided fields
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (gstNumber) customer.gstNumber = gstNumber;

    await customer.save();

    return res.status(200).json(
        new ApiResponse(200, customer, "Customer details updated successfully")
    );
});

const deleteCustomer = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;
    const { customerId } = req.body;
    const customer = await Customer.findOne({
        _id: customerId,
        dealer: dealerId
    });

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }
    await Customer.findByIdAndDelete(customerId)
    return res.status(200).json(
        new ApiResponse(200, {}, "Dealer deleted successfully")
    );


})
const getOutstandingBill = asyncHandler(async (req, res) => {
    const { customerId } = req.body;


    // Find customer by ID
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new ApiError(404, "customer  not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { outstandingBill: customer.outstandingBill }, "Outstanding bill retrieved successfully")
    );
});

const getTotalBill = asyncHandler(async (req, res) => {
    const { customerId } = req.body;

    // Find customer  by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { totalBill: customer.TotalBill }, "Total bill retrieved successfully")
    );
});

export {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getOutstandingBill,
    getTotalBill
};