import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]

    }
});

const User = models.User || model("User", UserSchema);

export default User;