import mongoose, { Schema } from "mongoose";

const dealerSchema = new Schema(
    {

        email: {
            type: String,
            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
        },
        phone: {
            type: Number,
            trim: true
        },
        adress: {
            type: String,
            trim: true

        },
        pincode: {
            type: Number,
            trim: true

        },
        gstNumber:{
            type:String,
            trim:true,
        },
        BussinessDescription: {
            type: String
        },
        state: {
            type: String,
            trim: true,

        },
        BusinessCategory: {
            type: String,
            enum: {
                values: [
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
                    "Kirana/General Merchant"],
                message: "{VALUE} is not a valid business type"
            },
            trim: true


        },
        BusinessType: {
            type: String,
            enum: {
                values: [
                    "Retail",
                    "Wholesale",
                    "Manufacturer",
                    "Distributor",
                    "Service Provider",
                    "others"],
                message: "{VALUE} is not a valid business type"
            },
            trim: true

        },
        outStandingBill:{
            type:Number,
            default:0,

        },
        TotalBill:{
            type:Number,
            default:0,

        }
        
      

    },
    {
        timestamps: true,
    }
);

export const Dealer = mongoose.model("Dealer", dealerSchema);

