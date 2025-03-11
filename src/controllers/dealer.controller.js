import { Dealer } from "../models/dealer.model.js";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Customer } from "../models/customer.model.js";
import { Sale } from "../models/sale.model.js";
import { MongoClient } from "mongodb";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerDealer = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const existedDealer = await Dealer.findOne({ email });
    if (existedDealer) {
        throw new ApiError(400, "Dealer with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const dealer = await Dealer.create({
        email,
        password: hashedPassword
    });

    const createdDealer = await Dealer.findById(dealer._id).select("-password");

    if (!createdDealer) {
        throw new ApiError(500, "Something went wrong while registering the dealer");
    }

    return res.status(201).json(
        new ApiResponse(200, createdDealer, "Dealer registered successfully")
    );
});

const loginDealer = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const dealer = await Dealer.findOne({ email }); 
    if (!dealer) {
        throw new ApiError(404, "Dealer does not exist");
    }

    const isPasswordValid = await bcrypt.compare(password, dealer.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign(
        { _id: dealer._id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

   


    return res.status(200).json(
        new ApiResponse(200, {
            dealer: dealer,
            token
        }, "Dealer logged in successfully")
    );
});

const registerBusiness = asyncHandler(async (req, res) => {
    const {
        name,
        phone,
        address,
        pincode,
        gstNumber,
        businessDescription,
        state,
        businessCategory,
        businessType
    } = req.body;
    if (!name || !phone || !address || !pincode || !state || !businessCategory || !businessType) {
        throw new ApiError(400, "All required fields must be provided");
    }
    if (!/^\d{10}$/.test(phone)) {
        throw new ApiError(400, "Phone number must be 10 digits");
    }
    if (!/^\d{6}$/.test(pincode)) {
        throw new ApiError(400, "Pincode must be 6 digits");
    }
    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        throw new ApiError(400, "Invalid GST number format");
    }

    const dealer = await Dealer.findById(req.dealer._id);

    if (!dealer) {
        throw new ApiError(404, "Dealer not found");
    }

    dealer.name = name;
    dealer.phone = phone;
    dealer.address = address;
    dealer.pincode = pincode;
    dealer.gstNumber = gstNumber;
    dealer.businessDescription = businessDescription;
    dealer.state = state;
    dealer.businessCategory = businessCategory;
    dealer.businessType = businessType;

    await dealer.save();

    return res.status(200).json(
        new ApiResponse(200, dealer, "Business registered successfully")
    );
});

const updateBusinessDetails = asyncHandler(async (req, res) => {
    const {
        name,
        phone,
        address,
        pincode,
        gstNumber,
        businessDescription,
        state,
        businessCategory,
        businessType
    } = req.body;


    const dealer = await Dealer.findById(req.dealer._id);

    if (!dealer) {
        throw new ApiError(404, "Dealer not found");
    }


    if (phone && !/^\d{10}$/.test(phone)) {
        throw new ApiError(400, "Phone number must be 10 digits");
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
        throw new ApiError(400, "Pincode must be 6 digits");
    }

    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        throw new ApiError(400, "Invalid GST number format");
    }


    if (businessCategory) {
        const validCategories = [
            "Accounting & CA",
            "Interior Designer",
            "Automobiles/Auto parts",
            "Salon & Spa",
            "Liquor Store",
            "Book/Stationary store",
            "ConstructionMaterial&Equipment",
            "Electrical & Electronics Equipments",
            "Fashion Accessory/Cosmetics",
            "Tailoring/Boutique",
            "Fruit And Vegetable",
            "Kirana/General Merchant"
        ];
        if (!validCategories.includes(businessCategory)) {
            throw new ApiError(400, "Invalid business category");
        }
    }


    if (businessType) {
        const validTypes = [
            "Retail",
            "Wholesale",
            "Manufacturer",
            "Distributor",
            "Service Provider",
            "others"
        ];
        if (!validTypes.includes(businessType)) {
            throw new ApiError(400, "Invalid business type");
        }
    }


    if (name) dealer.name = name;
    if (phone) dealer.phone = phone;
    if (address) dealer.address = address;
    if (pincode) dealer.pincode = pincode;
    if (gstNumber) dealer.gstNumber = gstNumber;
    if (businessDescription) dealer.businessDescription = businessDescription;
    if (state) dealer.state = state;
    if (businessCategory) dealer.businessCategory = businessCategory;
    if (businessType) dealer.businessType = businessType;

    await dealer.save();

    return res.status(200).json(
        new ApiResponse(200, dealer, "Business details updated successfully")
    );
});
const deleteDealer = asyncHandler(async (req, res) => {

    const dealer = await Dealer.findById(req.dealer._id);

    if (!dealer) {
        throw new ApiError(404, "Dealer not found");
    }

    await Dealer.findByIdAndDelete(dealer._id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Dealer deleted successfully")
    );
});
const getCustomerByName = asyncHandler(async (req, res) => {
    const { name } = req.body;  // Extract 'name' from the request body
    const dealerId = req.dealer._id;

    if (!name) {
        throw new ApiError(400, "Customer name is required");
    }

    // Find customers with a case-insensitive search
    const customers = await Customer.find({
        name: { $regex: new RegExp(name, "i") },
        dealer: dealerId
    });

    if (customers.length === 0) {
        throw new ApiError(404, "No customers found with the given name");
    }

    return res.status(200).json(
        new ApiResponse(200, customers, "Customers retrieved successfully")
    );
});
const getCustomerById = asyncHandler(async (req, res) => {
    const { customerId } = req.body;
    const dealerId = req.dealer._id;

    // Find customer by ID and dealer
    const customer = await Customer.findOne({
        _id: customerId,
        dealer: dealerId
    });

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, customer, "Customer retrieved successfully")
    );
});
const getallCustomer =asyncHandler(async(req,res)=>{
    const {dealerId} = req.dealer._id;

    
    const customers = await Customer.find({ dealerId });

    if (!customers.length) {
        return res.status(404).json({ message: "No customers found for this dealer." });
    }

    res.status(200).json(new ApiResponse(200, customers, "Customer retrieved successfully"));
} 
)
const getOutstandingBill = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;

    // Find dealer by ID
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
        throw new ApiError(404, "Dealer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { outstandingBill: dealer.outStandingBill }, "Outstanding bill retrieved successfully")
    );
});

const getTotalBill = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;

    // Find dealer by ID
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
        throw new ApiError(404, "Dealer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { totalBill: dealer.TotalBill }, "Total bill retrieved successfully")
    );
});
const recievePayment = asyncHandler(async (req, res) => {
    const { customerId, amountPaid } = req.body;
    const dealerId = req.dealer._id; // Assuming dealer info is in req

    // Validate input
    if (!customerId || !amountPaid || amountPaid <= 0) {
        throw new ApiError(400, "Invalid payment details provided");
    }

    // Fetch customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    // Fetch dealer
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
        throw new ApiError(404, "Dealer not found");
    }

    // Update customer balances
    customer.TotalBill += amountPaid;
    customer.outstandingBill -= amountPaid;
    if (customer.outstandingBill < 0) customer.outstandingBill = 0;

    // Update dealer balances
    dealer.TotalBill += amountPaid;
    dealer.outStandingBill -= amountPaid;
    if (dealer.outStandingBill < 0) dealer.outStandingBill = 0;

    // Save updates
    await customer.save();
    await dealer.save();

    res.status(200).json({
        success: true,
        message: "Payment received successfully",
        dealer: {
            TotalBill: dealer.TotalBill,
            OutstandingBill: dealer.outStandingBill,
        },
        customer: {
            TotalBill: customer.TotalBill,
            OutstandingBill: customer.outstandingBill,
        }
    });
});
const getWeeklySalesForDealer = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);

    const salesThisWeek = await Sale.aggregate([
        { $match: { dealer: dealerId, createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, totalSales: { $sum: "$totalCost" } } }
    ]);

    res.status(200).json({
        success: true,
        totalSales: salesThisWeek[0]?.totalSales || 0
    });
});

const getMonthlySalesForDealer = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const salesThisMonth = await Sale.aggregate([
        { $match: { dealer: dealerId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, totalSales: { $sum: "$totalCost" } } }
    ]);

    res.status(200).json({
        success: true,
        totalSales: salesThisMonth[0]?.totalSales || 0
    });
});

const getCustomersWithPendingBalance = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;
    
    const customers = await Customer.find({ 
        dealer: dealerId, 
        outstandingBill: { $gt: 0 } 
    }).sort({ outstandingBill: -1 }).populate("dealer");

    res.status(200).json({
        success: true,
        customers
    });
});

const getTopCustomersByBusinessValue = asyncHandler(async (req, res) => {
    const dealerId = req.dealer._id;

    const customers = await Customer.find({ dealer: dealerId })
        .sort({ TotalBill: -1 })
        .limit(10)
        .populate({
            path: "sale", 
            model: "Sale",
            populate: {
                path: "products.productId", 
                model: "Product"
            }
        });

    res.status(200).json({
        success: true,
        customers
    });
});






export {
    registerDealer,
    loginDealer,
    registerBusiness,
    updateBusinessDetails,
    deleteDealer,
    getCustomerById,
    getCustomerByName,
    getOutstandingBill,
    getTotalBill,
    recievePayment,
    getCustomersWithPendingBalance,
    getWeeklySalesForDealer,
    getMonthlySalesForDealer,
    getTopCustomersByBusinessValue,
    getallCustomer,
};