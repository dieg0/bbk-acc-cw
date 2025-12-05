import express from "express"
import User from "../models/User.js"
import Post from "../models/Post.js"
import verifyToken from "../verifyToken.js"
import { postValidation } from "../validations/validation.js"

const router = express.Router()

router.get("/", verifyToken, async (_, res) => {
  try {
    const posts = await Post.find()
    const livePosts = posts.filter((post) => post.status === "live")
    res.send(livePosts)
  } catch (err) {
    res.status(400).send({ message: err })
  }
})

router.post("/", verifyToken, async (req, res) => {
  const { error } = postValidation(req.body)
  if (error) return res.status(400).send({ message: error.details[0].message })
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).send({ message: "User not found" })
    }
    const now = new Date()
    const expiresAt = new Date(now.getTime() + req.body.expires_in * 60000)
    const postData = new Post({
      title: req.body.title,
      body: req.body.body,
      expires_in: req.body.expires_in,
      expires_at: expiresAt,
      topics: req.body.topics,
      owner: {
        id: user._id,
        name: user.name,
      },
    })
    const postToSave = await postData.save()
    res.send(postToSave)
  } catch (err) {
    res.send({ message: err })
  }
})

router.get("/:post_id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)
    if (!post) {
      return res.status(404).send({ message: "Post not found" })
    }
    res.send(post)
  } catch (err) {
    res.status(400).send({ message: err })
  }
})

export default router
