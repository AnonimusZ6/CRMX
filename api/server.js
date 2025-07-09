const express = require("express")
const http = require("http")
const sequelize = require("./config/database")
const routes = require("./routes")
const { Server } = require("socket.io")
const setupSwagger = require("./swagger")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 5000

// Create HTTP server
const server = http.createServer(app)

// Настройка CORS с конкретными параметрами
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // добавьте другие допустимые домены для production
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200, // для старых браузеров
}

// Initialize Socket.IO with the HTTP server (not the Express app)
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
  },
})

// Применяем CORS middleware перед всеми остальными middleware и маршрутами
app.use(cors(corsOptions))

// Парсинг JSON запросов
app.use(express.json())

// Подключение маршрутов
app.use("/api", routes)

// Настройка Swagger
setupSwagger(app)

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join chat room
  socket.on("join_room", (roomId) => {
    socket.join(`room_${roomId}`)
    console.log(`User ${socket.id} joined room ${roomId}`)
  })

  // Leave chat room
  socket.on("leave_room", (roomId) => {
    socket.leave(`room_${roomId}`)
    console.log(`User ${socket.id} left room ${roomId}`)
  })

  // Handle new message
  socket.on("send_message", (data) => {
    socket.to(`room_${data.chatRoomId}`).emit("receive_message", data)
  })

  // Handle typing indicator
  socket.on("typing", (data) => {
    socket.to(`room_${data.chatRoomId}`).emit("user_typing", data)
  })

  socket.on("stop_typing", (data) => {
    socket.to(`room_${data.chatRoomId}`).emit("user_stop_typing", data)
  })

  // Handle user joining room
  socket.on("user_joined_room", (data) => {
    socket.to(`room_${data.roomId}`).emit("user_joined", data)
  })

  // Handle user leaving room
  socket.on("user_left_room", (data) => {
    socket.to(`room_${data.roomId}`).emit("user_left", data)
  })

  // Handle room updates
  socket.on("room_updated", (data) => {
    socket.to(`room_${data.roomId}`).emit("room_updated", data)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Make io available to other modules
app.set("io", io)

// Обработка ошибок CORS
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: "Invalid token" })
  } else if (err.name === "CorsError") {
    res.status(403).json({ error: "Not allowed by CORS" })
  } else {
    console.error("Server error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Запуск сервера после подключения к БД
sequelize
  .sync()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`)
    })
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err)
    process.exit(1)
  })

module.exports = { app, io, server }