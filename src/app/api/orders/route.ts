import dbConnect from "@/lib/dbConnect";
import Order from "@/models/orders";
import User from "@/models/users"; 
import Product from "@/models/products";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

const ObjectId = Types.ObjectId;

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const productName = searchParams.get("product");
        const recentOrders = searchParams.get("recent");

        await dbConnect();

        // Get orders placed in the last 7 days
        if (recentOrders === "true") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const orders = await Order.find({ orderDate: { $gte: sevenDaysAgo } }).populate("user");
            if (orders.length === 0) {
                return new NextResponse(JSON.stringify({ message: "No orders placed in the last 7 days" }), { status: 404 });
            }

            return new NextResponse(JSON.stringify({ message: "Recent orders", orders }), { status: 200 });
        }

        // Get orders for a specific user
        if (userId) {
            if (!ObjectId.isValid(userId)) {
                return new NextResponse(JSON.stringify({ message: "Invalid userId" }), { status: 400 });
            }

            const userOrders = await Order.find({ user: userId }).populate("user");
            if (userOrders.length === 0) {
                return new NextResponse(JSON.stringify({ message: "No orders found for this user" }), { status: 404 });
            }

            return new NextResponse(JSON.stringify({ message: "User's orders", orders: userOrders }), { status: 200 });
        }

        // Get users who bought a specific product
        if (productName) {
            const orders = await Order.find({ productOrdered: productName }).populate("user", "name email phone");
            if (orders.length === 0) {
                return new NextResponse(JSON.stringify({ message: "No users found for this product" }), { status: 404 });
            }

            // Extract unique users
            const users = orders.map(order => order.user);
            const uniqueUsers = Array.from(new Set(users.map(user => JSON.stringify(user)))).map(user => JSON.parse(user));

            return new NextResponse(JSON.stringify({ message: "Users who bought the product", product: productName, users: uniqueUsers }), { status: 200 });
        }

        // Default: Fetch all orders
        const allOrders = await Order.find({}).populate("user");
        return new NextResponse(JSON.stringify({ message: "All orders", orders: allOrders }), { status: 200 });

    } catch (error) {
        return new NextResponse("Error in fetching order", { status: 500 });
    }
};


export const POST = async (request: Request) => {
    try {
        const data = await request.json();
        const { user, productOrdered, orderQuantity } = data;

        if (!user || !productOrdered || !orderQuantity) {
            return new NextResponse(JSON.stringify({ message: "All fields are required" }), { status: 400 });
        }

        await dbConnect();

        const product = await Product.findById(productOrdered);
        if (!product) {
            return new NextResponse(JSON.stringify({ message: "Product not found" }), { status: 404 });
        }

        // Check stock availability
        if (product.stockQuantity < orderQuantity) {
            return new NextResponse(JSON.stringify({ message: "Insufficient stock" }), { status: 400 });
        }

        const newOrder = new Order({
            user,
            productOrdered,
            orderQuantity,
            orderDate: new Date(),
        });
        await newOrder.save();

        // Update stock quantity
        product.stockQuantity -= orderQuantity;
        await product.save();

        return new NextResponse(
            JSON.stringify({ message: "Order created successfully", order: newOrder }),
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST method:", error);
        return new NextResponse(JSON.stringify({ message: "Error in creating order" }), { status: 500 });
    }
};

export const PATCH = async (request: Request) => {
    try {
        const data = await request.json();
        const { orderId, updatedData } = data;

        if (!orderId || !updatedData) {
            return new NextResponse(JSON.stringify({ message: "orderId and updatedData are required" }), { status: 400 });
        }

        if (!ObjectId.isValid(orderId)) {
            return new NextResponse(JSON.stringify({ message: "Invalid orderId" }), { status: 400 });
        }

        await dbConnect();

        const order = await Order.findById(orderId);

        if (!order) {
            return new NextResponse(JSON.stringify({ message: "Order not found" }), { status: 404 });
        }

        // Handle stock quantity adjustment if orderQuantity is being updated
        if (updatedData.orderQuantity) {
            const product = await Product.findOne({ productName: order.productOrdered });

            if (!product) {
                return new NextResponse(JSON.stringify({ message: "Product not found" }), { status: 404 });
            }

            const quantityDifference = updatedData.orderQuantity - order.orderQuantity;

            if (product.stockQuantity < quantityDifference) {
                return new NextResponse(JSON.stringify({ message: "Insufficient stock for adjustment" }), { status: 400 });
            }

            product.stockQuantity -= quantityDifference;
            await product.save();
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, updatedData, { new: true });

        return new NextResponse(
            JSON.stringify({ message: "Order updated successfully", order: updatedOrder }),
            { status: 200 }
        );
    } catch (error) {
        return new NextResponse("Error in updating order", { status: 500 });
    }
};
