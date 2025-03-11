import mongoose, { Schema } from "mongoose";

const customerSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            unique:true,
        },
        name: {
            type: String,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,

        },
        phone: {
            type: Number,
            trim: true,
            unique:true,
        },
        address: {
            type: String,
            trim: true,

        },
        outstandingBill: {
            type: Number,
            default: 0,

        },
        TotalBill: {
            type: Number,
            default: 0,
        },
        dealer: {
            type: Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        sale: [
            {
                type: Schema.Types.ObjectId,
                ref: "Sale",
            }

        ]

    }, {
    timestamps: true
});
export const Customer = mongoose.model("Customer", customerSchema);