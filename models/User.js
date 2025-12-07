import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    // Unique username for the user
    username: {
      type: String,
      required: true,
      min: 3,
      max: 256,
      trim: true,
      unique: true,
    },
    // Full name of the user
    name: { type: String, required: true, min: 3, max: 256, trim: true },
    // User's email address
    email: {
      type: String,
      required: true,
      min: 6,
      max: 256,
      trim: true,
      unique: true,
    },
    // Hashed password for authentication
    password: { type: String, required: true, min: 6, max: 1024 },
  },
  { timestamps: true },
)

export default mongoose.model("User", userSchema)
