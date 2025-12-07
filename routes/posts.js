import express from "express"
import User from "../models/User.js"
import Post from "../models/Post.js"
import verifyToken from "../verifyToken.js"
import { postValidation } from "../validations/validation.js"
import { validTopics } from "../validations/validation.js"

// Initialize router
const router = express.Router()

// Helper function to validate topics
const validateTopic = (topic) => {
  const validTopic = validTopics.find(
    (t) => t === topic.toLowerCase(),
  )
  if (!validTopic) {
    throw new Error(`Invalid topic. Must be one of: ${validTopics.join(", ")}`)
  }
  return validTopic
}

// Get all live posts
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

// Get a specific post by ID
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

// Create a new post
router.post("/", verifyToken, async (req, res) => {
  const { error } = postValidation(req.body)
  if (error) return res.status(400).send({ message: error.details[0].message })
  try {
    // Find the user creating the post
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).send({ message: "User not found" })
    }
    // Calculate expiration time
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

// Update a post
router.put("/:post_id", verifyToken, async (req, res) => {
  try {
    // Find the post to update
    const post = await Post.findById(req.params.post_id)
    if (!post) {
      return res.status(404).send({ message: "Post not found" })
    }
    // Check if the user is the owner of the post
    if (post.owner.id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send({ message: "Users can only update their own posts" })
    }
    // Check if the post is expired
    const now = new Date()
    if (now > post.expires_at) {
      return res.status(400).send({ message: "Cannot update expired posts" })
    }
    // Update expiration time if provided
    if (req.body.expires_in) {
      const expiresAt = new Date(now.getTime() + req.body.expires_in * 60000)
      post.expires_at = expiresAt
    }
    // Prepare updated data
    const updatedData = {
      title: req.body.title || post.title,
      body: req.body.body || post.body,
      topics: req.body.topics || post.topics,
      expires_at: post.expires_at,
    }
    // Update the post
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

// Delete a post
router.delete("/:post_id", verifyToken, async (req, res) => {
  try {
    // Find the post to delete
    const post = await Post.findById(req.params.post_id)
    if (!post) {
      return res.status(404).send({ message: "Post not found" })
    }
    // Check if the user is the owner of the post
    if (post.owner.id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send({ message: "Users can only delete their own posts" })
    }
    // Delete the post
    await Post.findByIdAndDelete(req.params.post_id)
    res.send({ message: "Post deleted successfully" })
  } catch (err) {
    res.status(400).send({ message: err })
  }
})

// Get all live posts for a specific topic
router.get("/topic/:topic", verifyToken, async (req, res) => {
  try {
    const validTopic = validateTopic(req.params.topic)
    const posts = await Post.find({ topics: validTopic })
    const enrichedPosts = await Promise.all(
      posts.map((post) => post.enrichPost()),
    )
    // Filter only live posts
    const livePosts = enrichedPosts.filter((post) => post.status === "live")
    res.send(livePosts)
  } catch (err) {
    res.status(400).send({ message: err.message || err })
  }
})

// Get all expired posts for a specific topic
router.get("/topic/:topic/expired", verifyToken, async (req, res) => {
  try {
    const validTopic = validateTopic(req.params.topic)
    // Find expired posts
    const now = new Date()
    const expiredPosts = await Post.find({
      topics: validTopic,
      expires_at: { $lt: now },
    })
    // If no expired posts found
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

// Get the most active live post for a specific topic
router.get("/topic/:topic/most-active", verifyToken, async (req, res) => {
  try {
    const validTopic = validateTopic(req.params.topic)
    const posts = await Post.find({ topics: validTopic })
    // If no posts found for the topic
    if (posts.length === 0) {
      return res.status(404).send({ message: "No posts found for this topic" })
    }
    const enrichedPosts = await Promise.all(
      posts.map((post) => post.enrichPost()),
    )
    // Filter only live posts
    const livePosts = enrichedPosts.filter((post) => post.status === "live")
    if (livePosts.length === 0) {
      return res
        .status(404)
        .send({ message: "No live posts found for this topic" })
    }
    // Determine the most active post based on likes and dislikes
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
