import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import auth from "./routes/auth.js"
import dotenv from "dotenv"
import posts from "./routes/posts.js"
import interactions from "./routes/interactions.js"

if (process.env.NODE_ENV !== "production") {
  dotenv.config()
}

const app = express()

app.use(bodyParser.json())

app.use("/api/user", auth)
app.use("/api/posts", posts)
app.use("/api/interactions", interactions)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err))
app.listen(3000, () => {
  console.log("Server running on port 3000")
})
