import express from "express"
import User from "../models/User.js"
import Post from "../models/Post.js"
import verifyToken from "../verifyToken.js"
import { postValidation } from "../validations/validation.js"
import { validTopics } from "../validations/validation.js"

const router = express.Router()

const validateTopic = (topic) => {
  const validTopic = validTopics.find(
    (t) => t === topic.toLowerCase(),
  )
  if (!validTopic) {
    throw new Error(`Invalid topic. Must be one of: ${validTopics.join(", ")}`)
  }
  return validTopic
}

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

router.get("/topic/:topic", verifyToken, async (req, res) => {
  try {
    const validTopic = validateTopic(req.params.topic)
    const posts = await Post.find({ topics: validTopic })
    const enrichedPosts = await Promise.all(
      posts.map((post) => post.enrichPost()),
    )
    const livePosts = enrichedPosts.filter((post) => post.status === "live")
    res.send(livePosts)
  } catch (err) {
    res.status(400).send({ message: err.message || err })
  }
})

router.get("/topic/:topic/expired", verifyToken, async (req, res) => {
  try {
    const validTopic = validateTopic(req.params.topic)
    const now = new Date()
    const expiredPosts = await Post.find({
      topics: validTopic,
      expires_at: { $lt: now },
    })
    if (expiredPosts.length === 0) {
      return res
        .status(404)
        .send({ message: "No expired posts found for this topic" })
    }
    const enrichedPosts = await Promise.all(
      expiredPosts.map((post) => post.enrichPost()),
    )
    res.send(enrichedPosts)
  } catch (err) {
    res.status(400).send({ message: err.message || err })
  }
})

router.get("/topic/:topic/most-active", verifyToken, async (req, res) => {
  try {
    const validTopic = validateTopic(req.params.topic)
    const posts = await Post.find({ topics: validTopic })
    if (posts.length === 0) {
      return res.status(404).send({ message: "No posts found for this topic" })
    }
    const enrichedPosts = await Promise.all(
      posts.map((post) => post.enrichPost()),
    )
    const livePosts = enrichedPosts.filter((post) => post.status === "live")
    if (livePosts.length === 0) {
      return res
        .status(404)
        .send({ message: "No live posts found for this topic" })
    }
    const mostActivePost = livePosts.reduce((prev, current) => {
      const prevEngagement = prev.like_count + prev.dislike_count
      const currentEngagement = current.like_count + current.dislike_count
      return currentEngagement > prevEngagement ? current : prev
    })
    res.send(mostActivePost)
  } catch (err) {
    res.status(400).send({ message: err.message || err })
  }
})

export default router
