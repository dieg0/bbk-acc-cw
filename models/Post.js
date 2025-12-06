import mongoose from "mongoose"
import { validTopics } from "../validations/validation.js"
import Interaction from "./Interaction.js"

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    expires_at: { type: Date, required: true },
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
    }
  },
  { timestamps: true },
)

postSchema.methods.enrichPost = async function () {
  const interactions = await Interaction.find({ post_id: this._id })
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
  const now = new Date()
  const remainingMs = this.expires_at - now
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
