import mongoose from "mongoose"

// Define Interaction schema
const interactionSchema = new mongoose.Schema(
  {
    // Reference to the Post being interacted with
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    // User performing the interaction
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
    // Type of interaction: like, dislike, or comment
    type: {
      type: String,
      enum: ["like", "dislike", "comment"],
      required: true,
    },
    // Body of the comment (if type is comment)
    comment_body: { type: String, trim: true },
  },
  { timestamps: true },
)

export default mongoose.model("Interaction", interactionSchema)
