import { Schema, model, models } from "mongoose";

    const OrderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User", 
        required: true,
    },
    productOrdered: {
        type: Schema.Types.ObjectId, 
        ref: "Product",
        required: true,
    },
    orderDate: {
        type: Date,
        required: true,
        default: Date.now, 
    orderQuantity: {
        type: Number,
        required: true,
    },
}});

const Order = models.Order || model("Order", OrderSchema);

export default Order;
