import express from "express"
import User from "../models/User.js"
import Post from "../models/Post.js"
import Interaction from "../models/Interaction.js"
import verifyToken from "../verifyToken.js"
import { interactionValidation } from "../validations/validation.js"

const router = express.Router()

router.post("/", verifyToken, async (req, res) => {
  const { error } = interactionValidation(req.body)
  if (error) return res.status(400).send({ message: error.details[0].message })
  try {
    const post = await Post.findById(req.body.post_id)
    if (!post) {
      return res.status(404).send({ message: "Post not found" })
    }
    const now = new Date()
    if (now > post.expires_at) {
      return res
        .status(400)
        .send({ message: "Cannot interact with expired posts" })
    }
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).send({ message: "User not found" })
    }
    if (post.owner.id.toString() === user._id.toString()) {
      return res
        .status(400)
        .send({ message: "Users cannot interact with their own posts" })
    }
    if (req.body.type === "like" || req.body.type === "dislike") {
      await Interaction.deleteOne({
        post_id: req.body.post_id,
        "user.id": user._id,
        type: { $in: ["like", "dislike"] },
      })
    }
    const interactionData = new Interaction({
      post_id: req.body.post_id,
      type: req.body.type,
      comment_body: req.body.comment_body,
      user: {
        id: user._id,
        name: user.name,
      },
    })
    const interactionToSave = await interactionData.save()
    res.send(interactionToSave)
  } catch (err) {
    res.send({ message: err })
  }
})

export default router
