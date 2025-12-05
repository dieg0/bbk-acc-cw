import express from "express"
import Post from "../models/Post.js"
import verifyToken from "../verifyToken.js"

const router = express.Router()

router.get("/", verifyToken, async (_, res) => {
  try {
    const posts = await Post.find()
    const livePosts = posts.filter((post) => post.status === "Live")
    res.send(livePosts)
  } catch (err) {
    res.status(400).send({ message: err })
  }
})

export default router