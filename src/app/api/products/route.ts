import dbConnect from "@/lib/dbConnect";
import Product from "@/models/products";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

const ObjectId = Types.ObjectId;

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const totalStock = searchParams.get("totalStock");

        await dbConnect();

        // To Calculate total stock quantity for all products combined
        if (totalStock === "true") {
            const totalStockQuantity = await Product.aggregate([
                { $group: { _id: null, totalStock: { $sum: "$stockQuantity" } } },
            ]);

            const total = totalStockQuantity[0]?.totalStock || 0;

            return new NextResponse(
                JSON.stringify({ message: "Total stock quantity calculated successfully", totalStock: total }),
                { status: 200 }
            );
        }

        // Get details of a specific product
        if (productId) {
            if (!ObjectId.isValid(productId)) {
                return new NextResponse(JSON.stringify({ message: "Invalid productId" }), { status: 400 });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return new NextResponse(JSON.stringify({ message: "Product not found" }), { status: 404 });
            }

            return new NextResponse(JSON.stringify(product), { status: 200 });
        }

        // Get all products
        const products = await Product.find({});
        return new NextResponse(JSON.stringify(products), { status: 200 });
    } catch (error) {
        console.error("Error in GET method:", error);
        return new NextResponse(JSON.stringify({ message: "Error in fetching product" }), { status: 500 });
    }
};


export const POST = async (request: Request) => {
    try {
        const data = await request.json();
        await dbConnect();

        const newProduct = new Product(data);
        await newProduct.save();

        return new NextResponse(
            JSON.stringify({ message: "Product created successfully", product: newProduct }),
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST method:", error);
        return new NextResponse(JSON.stringify({ message: "Error in creating product" }), { status: 500 });
    }
};

export const PATCH = async (request: Request) => {
    try {
        const data = await request.json();
        const { productId, updatedData } = data;

        if (!productId || !updatedData) {
            return new NextResponse(JSON.stringify({ message: "productId and updatedData are required" }), { status: 400 });
        }

        if (!ObjectId.isValid(productId)) {
            return new NextResponse(JSON.stringify({ message: "Invalid productId" }), { status: 400 });
        }

        await dbConnect();

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (!updatedProduct) {
            return new NextResponse(JSON.stringify({ message: "Product not found or update failed" }), { status: 404 });
        }

        return new NextResponse(
            JSON.stringify({ message: "Product updated successfully", product: updatedProduct }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in PATCH method:", error);
        return new NextResponse(JSON.stringify({ message: "Error in updating product" }), { status: 500 });
    }
};

export const DELETE = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return new NextResponse(JSON.stringify({ message: "productId is required" }), { status: 400 });
        }

        if (!ObjectId.isValid(productId)) {
            return new NextResponse(JSON.stringify({ message: "Invalid productId" }), { status: 400 });
        }

        await dbConnect();

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return new NextResponse(JSON.stringify({ message: "Product not found or delete failed" }), { status: 404 });
        }

        return new NextResponse(
            JSON.stringify({ message: "Product deleted successfully", product: deletedProduct }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in DELETE method:", error);
        return new NextResponse(JSON.stringify({ message: "Error in deleting product" }), { status: 500 });
    }
};