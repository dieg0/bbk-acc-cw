import mongoose from "mongoose"

const interactionSchema = new mongoose.Schema(
  {
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
    type: {
      type: String,
      enum: ["like", "dislike", "comment"],
      required: true,
    },
    comment_body: { type: String, trim: true },
  },
  { timestamps: true },
)

export default mongoose.model("Interaction", interactionSchema)
