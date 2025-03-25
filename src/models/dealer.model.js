import mongoose, { Schema } from "mongoose";

const dealerSchema = new Schema(
    {

        email: {
            type: String,
            required: true,
            trim: true,
            unique:true
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
            trim: true,
            unique:true
            
        },
        address: {
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
            trim: true


        },
        BusinessType: {
            type: String,
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

