import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 3,
      max: 256,
      trim: true,
      unique: true,
    },
    name: { type: String, required: true, min: 3, max: 256, trim: true },
    email: {
      type: String,
      required: true,
      min: 6,
      max: 256,
      trim: true,
      unique: true,
    },
    password: { type: String, required: true, min: 6, max: 1024 },
  },
  { timestamps: true },
)

export default mongoose.model("User", userSchema)
