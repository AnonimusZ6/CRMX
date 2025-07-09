const jwt = require("jsonwebtoken")
const config = require("../config/config")

exports.authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization")

  if (!authHeader) {
    console.error("No Authorization header provided")
    return res.status(401).json({ error: "Требуется аутентификация" })
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.error("Invalid Authorization header format:", authHeader)
    return res.status(401).json({ error: "Неверный формат токена" })
  }

  const token = authHeader.split(" ")[1]
  if (!token) {
    console.error("No token provided in Authorization header")
    return res.status(401).json({ error: "Токен не предоставлен" })
  }

  try {
    console.log("Attempting to verify token...")
    const decoded = jwt.verify(token, config.jwtSecret)
    console.log("Token verified successfully for user:", decoded.id)
    req.user = decoded
    next()
  } catch (error) {
    console.error("Token verification error:", error.message)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Токен истёк" })
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Недействительный токен" })
    } else {
      return res.status(401).json({ error: "Ошибка аутентификации" })
    }
  }
}
