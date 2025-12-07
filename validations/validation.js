import joi from "joi"

export const validTopics = ["politics", "health", "sport", "tech"]

// User Registration Validation
export const registerValidation = (data) => {
  const schemaValidation = joi.object({
    username: joi.string().required().min(3).max(256),
    email: joi.string().required().min(6).max(256).email(),
    password: joi.string().required().min(6).max(1024),
    name: joi.string().required().min(3).max(256),
  })
  return schemaValidation.validate(data)
}

// User Login Validation
export const loginValidation = (data) => {
  const schemaValidation = joi.object({
    email: joi.string().required().min(6).max(256).email(),
    password: joi.string().required().min(6).max(1024),
  })
  return schemaValidation.validate(data)
}

// Post Creation Validation
export const postValidation = (data) => {
  const schemaValidation = joi.object({
    title: joi.string().required().min(3).max(256),
    body: joi.string().required().min(10),
    expires_in: joi.number().required().positive(),
    topics: joi
      .array()
      .items(joi.string().valid(...validTopics))
      .min(1)
      .required(),
  })
  return schemaValidation.validate(data)
}

// Interaction Validation
export const interactionValidation = (data) => {
  const schemaValidation = joi.object({
    post_id: joi.string().required(),
    type: joi.string().valid("like", "dislike", "comment").required(),
    comment_body: joi.when("type", {
      is: "comment",
      then: joi.string().required().min(1),
      otherwise: joi.forbidden(),
    }),
  })
  return schemaValidation.validate(data)
}