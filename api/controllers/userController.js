const { User } = require("../models")
const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, lastName, phone, city, position, department } = req.body

    // Find user
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" })
    }

    // Update fields
    if (name !== undefined) user.name = name
    if (lastName !== undefined) user.lastName = lastName
    if (phone !== undefined) user.phone = phone
    if (city !== undefined) user.city = city
    if (position !== undefined) user.position = position
    if (department !== undefined) user.department = department

    await user.save()

    // Return updated user without password
    const userData = user.toJSON()
    delete userData.password

    res.status(200).json(userData)
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Ошибка сервера при обновлении профиля" })
  }
}

// Upload profile avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: "Файл не загружен" })
    }

    // Find user
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../uploads/avatars")
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Delete old avatar if exists
    if (user.avatar && !user.avatar.startsWith("http")) {
      const oldAvatarPath = path.join(uploadsDir, path.basename(user.avatar))
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath)
      }
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname)
    const fileName = `${uuidv4()}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    fs.writeFileSync(filePath, req.file.buffer)

    // Update user avatar URL
    const avatarUrl = `/uploads/avatars/${fileName}`
    user.avatar = avatarUrl
    await user.save()

    res.status(200).json({
      message: "Аватар успешно загружен",
      avatarUrl,
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    res.status(500).json({ message: "Ошибка сервера при загрузке аватара" })
  }
}

// Delete profile avatar
exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id

    // Find user
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" })
    }

    // Delete avatar file if exists
    if (user.avatar && !user.avatar.startsWith("http")) {
      const uploadsDir = path.join(__dirname, "../uploads/avatars")
      const avatarPath = path.join(uploadsDir, path.basename(user.avatar))
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath)
      }
    }

    // Clear avatar field
    user.avatar = null
    await user.save()

    res.status(200).json({ message: "Аватар успешно удален" })
  } catch (error) {
    console.error("Error deleting avatar:", error)
    res.status(500).json({ message: "Ошибка сервера при удалении аватара" })
  }
}
