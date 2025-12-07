import mongoose from "mongoose"
import { validTopics } from "../validations/validation.js"
import Interaction from "./Interaction.js"

const postSchema = new mongoose.Schema(
  {
    // Post title
    title: { type: String, required: true, trim: true },
    // Post body/content
    body: { type: String, required: true, trim: true },
    // Expiration date and time of the post
    expires_at: { type: Date, required: true },
    // Topics associated with the post
    topics: [
      {
        type: String,
        enum: [...validTopics],
        required: true,
      },
    ],
    // Owner of the post
    owner: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    }
  },
  { timestamps: true },
)

postSchema.methods.enrichPost = async function () {
  // Fetch all interactions related to this post
  const interactions = await Interaction.find({ post_id: this._id })
  // Aggregate interaction data
  const { likeCount, dislikeCount, comments } = interactions.reduce(
    (acc, i) => {
      if (i.type === "like") {
        acc.likeCount++
      } else if (i.type === "dislike") {
        acc.dislikeCount++
      } else if (i.type === "comment") {
        acc.comments.push(i)
      }
      return acc
    },
    { likeCount: 0, dislikeCount: 0, comments: [] },
  )
  // Determine post status and remaining time until expiration
  const now = new Date()
  // Calculate remaining time in minutes
  const remainingMs = this.expires_at - now
  // Round up to the nearest whole minute, minimum 0
  const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000))
  return {
    ...this.toObject(),
    status: now >= this.expires_at ? "expired" : "live",
    expires_in: remainingMinutes,
    like_count: likeCount,
    dislike_count: dislikeCount,
    comments,
  }
}

export default mongoose.model("Post", postSchema)
