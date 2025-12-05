import mongoose from "mongoose"
import { validTopics } from "../validations/validation.js"

const validTopics = ["Politics", "Health", "Sport", "Tech"]

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    expires_in: { type: Number, required: true },
    status: { type: String, enum: ["live", "expired"], default: "live" },
    topics: [
      {
        type: String,
        enum: [...validTopics],
        required: true,
      },
    ],
    owner: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
    like_count: { type: Number, default: 0 },
    dislike_count: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model("Post", postSchema)
