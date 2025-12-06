import express from "express"
import User from "../models/User.js"
import Post from "../models/Post.js"
import verifyToken from "../verifyToken.js"
import { postValidation } from "../validations/validation.js"

const router = express.Router()

router.get("/", verifyToken, async (_, res) => {
  try {
    const posts = await Post.find()
    const enrichedPosts = await Promise.all(
      posts.map((post) => post.enrichPost()),
    )
    const livePosts = enrichedPosts.filter((post) => post.status === "live")
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
    const enrichedPost = await post.enrichPost()
    res.send(enrichedPost)
  } catch (err) {
    res.status(400).send({ message: err })
  }
})

router.put("/:post_id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)
    if (!post) {
      return res.status(404).send({ message: "Post not found" })
    }
    if (post.owner.id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send({ message: "Users can only update their own posts" })
    }
    const now = new Date()
    if (now > post.expires_at) {
      return res.status(400).send({ message: "Cannot update expired posts" })
    }
    if (req.body.expires_in) {
      const expiresAt = new Date(now.getTime() + req.body.expires_in * 60000)
      post.expires_at = expiresAt
    }
    const updatedData = {
      title: req.body.title || post.title,
      body: req.body.body || post.body,
      topics: req.body.topics || post.topics,
      expires_at: post.expires_at,
    }
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.post_id,
      updatedData,
      { new: true },
    )
    res.send(updatedPost)
  } catch (err) {
    res.status(400).send({ message: err })
  }
})

router.delete("/:post_id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)
    if (!post) {
      return res.status(404).send({ message: "Post not found" })
    }
    if (post.owner.id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send({ message: "Users can only delete their own posts" })
    }
    await Post.findByIdAndDelete(req.params.post_id)
    res.send({ message: "Post deleted successfully" })
  } catch (err) {
    res.status(400).send({ message: err })
  }
})

// Missing topic routes

export default router
