import dbConnect from "@/lib/dbConnect"
import User from "@/models/users";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

const ObjectId = require('mongoose').Types.ObjectId;

export const GET = async () => {
    try {
        await dbConnect();
        const users = await User.find({});
        return new NextResponse(JSON.stringify(users), {status: 200});

    } catch (error) {
        return new NextResponse("Error in fetching users", {status: 500});
    }
};


export const POST = async (request: Request) => {
    try {
        const data = await request.json();
        await dbConnect();
        const newUser = new User(data);
        await newUser.save();

        return new NextResponse(JSON.stringify({message: "User is created", user: newUser}), 
        {status: 201});

    } catch (error) {
        return new NextResponse("Error in creating user", {status: 500});
    }
};

export const PATCH = async (request: Request) => {
    try {
        const data = await request.json();
        const { userId, newUsername } = data;
        await dbConnect();

        if (!userId || !newUsername) {
            return new NextResponse(JSON.stringify({message: "userId or new username are required"}), 
            {status: 400});
        }

        if(!Types.ObjectId.isValid(userId)){
            return new NextResponse(JSON.stringify({
                message: "Invalid userId"
            }), 
            {
                status: 400
            });
        }

        const updatedUser = await User.findOneAndUpdate(
            {_id: new ObjectId(userId)},
            {name: newUsername},
            {new: true}
        );

        if(!updatedUser){
            return new NextResponse(JSON.stringify({
                message: "User not found or didn't update user successfully"
            }), 
            {
                status: 404
            });
        }

        return new NextResponse(JSON.stringify({
            message: "User is updated successfully", 
            user: updatedUser
        }),
        {
            status: 200
        });
    } 
    
    catch (error) {
        return new NextResponse("Error in updating user", {status: 500}); 
    }
};


export const DELETE = async (request: Request) => {
    try {
        const {searchParams} = new URL(request.url);
        const userId = searchParams.get("userId");

        if(!userId){
            return new NextResponse(JSON.stringify({
                message: "userId is required"
            }), 
            {
                status: 400
            });
        }

        if(!Types.ObjectId.isValid(userId)){
            return new NextResponse(JSON.stringify({
                message: "Invalid userId"
            }), 
            {
                status: 400
            });
        }

        await dbConnect();

        const deletedUser = await User.findOneAndDelete({_id: new ObjectId(userId)});

        if(!deletedUser){
            return new NextResponse(JSON.stringify({
                message: "User not found or didn't delete user successfully"
            }), 
            {
                status: 404
            });
        }

        return new NextResponse(JSON.stringify({
            message: "User is deleted successfully", 
            user: deletedUser
        }),
        {
            status: 200
        }); 
    }   catch (error) {
        return new NextResponse("Error in deleting user", {status: 500});
    }
};



