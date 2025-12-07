import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import auth from "./routes/auth.js"
import dotenv from "dotenv"
import posts from "./routes/posts.js"
import interactions from "./routes/interactions.js"

// Load environment variables from .env file in development mode
if (process.env.NODE_ENV !== "production") {
  dotenv.config()
}

// Initialize Express app
const app = express()

// Middleware
app.use(bodyParser.json())

// Routes
app.use("/api/user", auth)
app.use("/api/posts", posts)
app.use("/api/interactions", interactions)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err))

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000")
})
