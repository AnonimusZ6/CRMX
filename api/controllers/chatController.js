const ChatRoom = require("../models/ChatRoom")
const ChatMessage = require("../models/ChatMessage")
const ChatParticipant = require("../models/ChatParticipant")
const User = require("../models/User")
const CompanyMember = require("../models/CompanyMember")
const { Op } = require("sequelize")

// Create a new chat room
exports.createRoom = async (req, res) => {
  try {
    const { name, description, companyId, isPrivate = false, participantIds = [] } = req.body
    const userId = req.user.id

    // Check if user is member of the company
    const isMember = await CompanyMember.findOne({
      where: { userId, companyId },
    })

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    // For private chats, generate a name if not provided
    let roomName = name
    if (isPrivate && !name && participantIds.length === 1) {
      const otherUser = await User.findByPk(participantIds[0])
      const currentUser = await User.findByPk(userId)
      roomName = `${currentUser.name || currentUser.email} & ${otherUser.name || otherUser.email}`
    }

    const chatRoom = await ChatRoom.create({
      name: roomName || "Private Chat",
      description: description || (isPrivate ? "Private conversation" : ""),
      companyId,
      createdBy: userId,
      isPrivate,
    })

    // Add creator as participant
    await ChatParticipant.create({
      chatRoomId: chatRoom.id,
      userId,
    })

    // Add other participants for private chats
    if (isPrivate && participantIds.length > 0) {
      for (const participantId of participantIds) {
        // Check if participant is member of the company
        const isParticipantMember = await CompanyMember.findOne({
          where: { userId: participantId, companyId },
        })

        if (isParticipantMember) {
          await ChatParticipant.create({
            chatRoomId: chatRoom.id,
            userId: participantId,
          })
        }
      }
    }

    // Return room with participants
    const roomWithParticipants = await ChatRoom.findByPk(chatRoom.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "lastName", "email"],
        },
        {
          model: ChatParticipant,
          as: "participants",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "lastName", "email"],
            },
          ],
        },
      ],
    })

    res.status(201).json(roomWithParticipants)
  } catch (error) {
    console.error("Error creating chat room:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Create or get existing private chat
exports.createPrivateChat = async (req, res) => {
  try {
    const { participantId, companyId } = req.body
    const userId = req.user.id

    if (userId === participantId) {
      return res.status(400).json({ message: "Cannot create chat with yourself" })
    }

    // Check if both users are members of the company
    const [userMember, participantMember] = await Promise.all([
      CompanyMember.findOne({ where: { userId, companyId } }),
      CompanyMember.findOne({ where: { userId: participantId, companyId } }),
    ])

    if (!userMember || !participantMember) {
      return res.status(403).json({ message: "Both users must be members of the company" })
    }

    // Check if private chat already exists between these users
    const existingChat = await ChatRoom.findOne({
      where: {
        companyId,
        isPrivate: true,
      },
      include: [
        {
          model: ChatParticipant,
          as: "participants",
          where: { isActive: true },
          required: true,
        },
      ],
    })

    if (existingChat) {
      const participantUserIds = existingChat.participants.map((p) => p.userId)
      if (
        participantUserIds.length === 2 &&
        participantUserIds.includes(userId) &&
        participantUserIds.includes(participantId)
      ) {
        // Return existing chat
        const chatWithDetails = await ChatRoom.findByPk(existingChat.id, {
          include: [
            {
              model: User,
              as: "creator",
              attributes: ["id", "name", "lastName", "email"],
            },
            {
              model: ChatParticipant,
              as: "participants",
              where: { isActive: true },
              required: false,
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "name", "lastName", "email"],
                },
              ],
            },
          ],
        })
        return res.json(chatWithDetails)
      }
    }

    // Create new private chat
    const [currentUser, otherUser] = await Promise.all([
      User.findByPk(userId, { attributes: ["name", "lastName", "email"] }),
      User.findByPk(participantId, { attributes: ["name", "lastName", "email"] }),
    ])

    const currentUserName = currentUser.name || currentUser.email.split("@")[0]
    const otherUserName = otherUser.name || otherUser.email.split("@")[0]

    const chatRoom = await ChatRoom.create({
      name: `${currentUserName} & ${otherUserName}`,
      description: "Private conversation",
      companyId,
      createdBy: userId,
      isPrivate: true,
    })

    // Add both participants
    await Promise.all([
      ChatParticipant.create({
        chatRoomId: chatRoom.id,
        userId,
      }),
      ChatParticipant.create({
        chatRoomId: chatRoom.id,
        userId: participantId,
      }),
    ])

    // Return room with participants
    const roomWithParticipants = await ChatRoom.findByPk(chatRoom.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "lastName", "email"],
        },
        {
          model: ChatParticipant,
          as: "participants",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "lastName", "email"],
            },
          ],
        },
      ],
    })

    res.status(201).json(roomWithParticipants)
  } catch (error) {
    console.error("Error creating private chat:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get all chat rooms (updated method name)
exports.getRooms = async (req, res) => {
  try {
    const { companyId, limit = 50, offset = 0, includePrivate = true } = req.query
    const userId = req.user.id

    const whereClause = { isActive: true }

    if (companyId) {
      // Check if user is member of the specific company
      const isMember = await CompanyMember.findOne({
        where: { userId, companyId },
      })

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      whereClause.companyId = companyId
    }

    // Get rooms where user is a participant
    const userParticipations = await ChatParticipant.findAll({
      where: { userId, isActive: true },
      attributes: ["chatRoomId"],
    })

    const participatingRoomIds = userParticipations.map((p) => p.chatRoomId)

    if (participatingRoomIds.length === 0) {
      return res.json({
        rooms: [],
        total: 0,
        hasMore: false,
      })
    }

    whereClause.id = { [Op.in]: participatingRoomIds }

    if (!includePrivate || includePrivate === "false") {
      whereClause.isPrivate = false
    }

    const chatRooms = await ChatRoom.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "lastName", "email"],
        },
        {
          model: ChatParticipant,
          as: "participants",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "lastName", "email"],
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })

    const total = await ChatRoom.count({
      where: {
        ...whereClause,
        id: { [Op.in]: participatingRoomIds },
      },
    })

    res.json({
      rooms: chatRooms,
      total,
      hasMore: offset + chatRooms.length < total,
    })
  } catch (error) {
    console.error("Error fetching chat rooms:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get company members for chat
exports.getCompanyMembers = async (req, res) => {
  try {
    const { companyId } = req.params
    const userId = req.user.id

    // Check if user is member of the company
    const isMember = await CompanyMember.findOne({
      where: { userId, companyId },
    })

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    const members = await CompanyMember.findAll({
      where: { companyId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "lastName", "email", "position", "department"],
        },
      ],
      order: [["user", "name", "ASC"]],
    })

    // Filter out current user and add online status (mock for now)
    const membersWithStatus = members
      .filter((member) => member.userId !== userId)
      .map((member) => ({
        ...member.toJSON(),
        isOnline: Math.random() > 0.5, // Mock online status
        lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random last seen within 24h
      }))

    res.json(membersWithStatus)
  } catch (error) {
    console.error("Error fetching company members:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get specific chat room
exports.getRoom = async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = req.user.id

    // Check if user is participant
    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" })
    }

    const chatRoom = await ChatRoom.findByPk(roomId, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "lastName", "email"],
        },
        {
          model: ChatParticipant,
          as: "participants",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "lastName", "email"],
            },
          ],
        },
      ],
    })

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" })
    }

    res.json(chatRoom)
  } catch (error) {
    console.error("Error fetching chat room:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update chat room
exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params
    const { name, description, isActive } = req.body
    const userId = req.user.id

    const chatRoom = await ChatRoom.findByPk(roomId)
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" })
    }

    // Check if user is creator or admin
    if (chatRoom.createdBy !== userId) {
      return res.status(403).json({ message: "Insufficient permissions" })
    }

    await chatRoom.update({ name, description, isActive })
    res.json(chatRoom)
  } catch (error) {
    console.error("Error updating chat room:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Delete chat room
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = req.user.id

    const chatRoom = await ChatRoom.findByPk(roomId)
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" })
    }

    // Check if user is creator
    if (chatRoom.createdBy !== userId) {
      return res.status(403).json({ message: "Insufficient permissions" })
    }

    await chatRoom.update({ isActive: false })
    res.json({ message: "Chat room deleted successfully" })
  } catch (error) {
    console.error("Error deleting chat room:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Send message (updated method name)
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params
    const { content, messageType = "text" } = req.body
    const userId = req.user.id

    // Check if user is participant
    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" })
    }

    const chatMessage = await ChatMessage.create({
      chatRoomId: roomId,
      userId,
      message: content,
      messageType,
    })

    const messageWithUser = await ChatMessage.findByPk(chatMessage.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "lastName", "email"],
        },
      ],
    })

    // Update room's last activity
    await ChatRoom.update({ updatedAt: new Date() }, { where: { id: roomId } })

    res.status(201).json(messageWithUser)
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get messages (updated method name)
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params
    const { limit = 50, offset = 0, before, after } = req.query
    const userId = req.user.id

    // Check if user is participant
    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" })
    }

    const whereClause = { chatRoomId: roomId }

    if (before) {
      whereClause.createdAt = { [Op.lt]: new Date(before) }
    }

    if (after) {
      whereClause.createdAt = { [Op.gt]: new Date(after) }
    }

    const messages = await ChatMessage.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })

    const total = await ChatMessage.count({ where: { chatRoomId: roomId } })

    res.json({
      messages: messages.reverse(),
      total,
      hasMore: offset + messages.length < total,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params
    const { content } = req.body
    const userId = req.user.id

    const message = await ChatMessage.findOne({
      where: { id: messageId, chatRoomId: roomId },
    })

    if (!message) {
      return res.status(404).json({ message: "Message not found" })
    }

    if (message.userId !== userId) {
      return res.status(403).json({ message: "Can only edit your own messages" })
    }

    await message.update({ message: content, isEdited: true })

    const updatedMessage = await ChatMessage.findByPk(messageId, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "lastName", "email"],
        },
      ],
    })

    res.json(updatedMessage)
  } catch (error) {
    console.error("Error editing message:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params
    const userId = req.user.id

    const message = await ChatMessage.findOne({
      where: { id: messageId, chatRoomId: roomId },
    })

    if (!message) {
      return res.status(404).json({ message: "Message not found" })
    }

    if (message.userId !== userId) {
      return res.status(403).json({ message: "Can only delete your own messages" })
    }

    await message.destroy()
    res.json({ message: "Message deleted successfully" })
  } catch (error) {
    console.error("Error deleting message:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Add participants
exports.addParticipants = async (req, res) => {
  try {
    const { roomId } = req.params
    const { userIds, role = "member" } = req.body
    const userId = req.user.id

    // Check if current user is participant
    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" })
    }

    const chatRoom = await ChatRoom.findByPk(roomId)
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" })
    }

    const added = []
    const skipped = []

    for (const participantId of userIds) {
      // Check if target user is member of the company
      const isMember = await CompanyMember.findOne({
        where: { userId: participantId, companyId: chatRoom.companyId },
      })

      if (!isMember) {
        skipped.push({ userId: participantId, reason: "Not a company member" })
        continue
      }

      // Check if already a participant
      const existingParticipant = await ChatParticipant.findOne({
        where: { chatRoomId: roomId, userId: participantId },
      })

      if (existingParticipant) {
        if (existingParticipant.isActive) {
          skipped.push({ userId: participantId, reason: "Already a participant" })
          continue
        } else {
          // Reactivate participant
          await existingParticipant.update({ isActive: true })
          added.push(existingParticipant)
          continue
        }
      }

      const newParticipant = await ChatParticipant.create({
        chatRoomId: roomId,
        userId: participantId,
      })

      added.push(newParticipant)
    }

    res.status(201).json({ added, skipped })
  } catch (error) {
    console.error("Error adding participants:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get participants
exports.getParticipants = async (req, res) => {
  try {
    const { roomId } = req.params
    const { includeOffline = true } = req.query
    const userId = req.user.id

    // Check if user is participant
    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" })
    }

    const participants = await ChatParticipant.findAll({
      where: { chatRoomId: roomId, isActive: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "lastName", "email", "position", "department"],
        },
      ],
    })

    res.json({
      participants,
      onlineCount: participants.length, // This would need real online tracking
      totalCount: participants.length,
    })
  } catch (error) {
    console.error("Error fetching participants:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update participant
exports.updateParticipant = async (req, res) => {
  try {
    const { roomId, userId: targetUserId } = req.params
    const { role } = req.body
    const userId = req.user.id

    const chatRoom = await ChatRoom.findByPk(roomId)
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" })
    }

    // Check if current user is creator or admin
    if (chatRoom.createdBy !== userId) {
      return res.status(403).json({ message: "Insufficient permissions" })
    }

    const participant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId: targetUserId, isActive: true },
    })

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" })
    }

    // Update participant role (this would need a role field in the model)
    res.json({ message: "Participant updated successfully" })
  } catch (error) {
    console.error("Error updating participant:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Remove participant
exports.removeParticipant = async (req, res) => {
  try {
    const { roomId, userId: targetUserId } = req.params
    const userId = req.user.id

    const chatRoom = await ChatRoom.findByPk(roomId)
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" })
    }

    // Check if current user is creator
    if (chatRoom.createdBy !== userId) {
      return res.status(403).json({ message: "Insufficient permissions" })
    }

    const participant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId: targetUserId, isActive: true },
    })

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" })
    }

    await participant.update({ isActive: false })
    res.json({ message: "Participant removed successfully" })
  } catch (error) {
    console.error("Error removing participant:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Join room
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = req.user.id

    const chatRoom = await ChatRoom.findByPk(roomId)
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" })
    }

    // Check if user is member of the company
    const isMember = await CompanyMember.findOne({
      where: { userId, companyId: chatRoom.companyId },
    })

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Check if already a participant
    const existingParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId },
    })

    if (existingParticipant) {
      if (existingParticipant.isActive) {
        return res.status(409).json({ message: "Already a participant" })
      } else {
        await existingParticipant.update({ isActive: true })
        return res.json(existingParticipant)
      }
    }

    const participant = await ChatParticipant.create({
      chatRoomId: roomId,
      userId,
    })

    res.json(participant)
  } catch (error) {
    console.error("Error joining room:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Leave room
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = req.user.id

    const participant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!participant) {
      return res.status(404).json({ message: "Not a participant" })
    }

    await participant.update({ isActive: false })
    res.json({ message: "Successfully left room" })
  } catch (error) {
    console.error("Error leaving room:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Send typing indicator
exports.sendTypingIndicator = async (req, res) => {
  try {
    const { roomId } = req.params
    const { isTyping } = req.body
    const userId = req.user.id

    // Check if user is participant
    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" })
    }

    // This would emit socket event in real implementation
    res.json({ message: "Typing indicator sent" })
  } catch (error) {
    console.error("Error sending typing indicator:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params
    const { messageId } = req.body
    const userId = req.user.id

    // Check if user is participant
    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    })

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Update read status (this would need additional tracking)
    res.json({ message: "Messages marked as read" })
  } catch (error) {
    console.error("Error marking as read:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { query, roomId, limit = 20, offset = 0 } = req.query
    const userId = req.user.id

    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" })
    }

    const whereClause = {
      message: { [Op.like]: `%${query}%` },
    }

    if (roomId) {
      whereClause.chatRoomId = roomId
    }

    const messages = await ChatMessage.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "lastName", "email"],
        },
        {
          model: ChatRoom,
          as: "chatRoom",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })

    const total = await ChatMessage.count({ where: whereClause })

    res.json({
      results: messages.map((msg) => ({
        message: msg,
        room: msg.chatRoom,
        relevanceScore: 1.0, // Simple implementation
      })),
      total,
      hasMore: offset + messages.length < total,
    })
  } catch (error) {
    console.error("Error searching messages:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Keep existing methods for backward compatibility
exports.getChatRooms = exports.getRooms
exports.createChatRoom = exports.createRoom
exports.getChatMessages = exports.getMessages
exports.sendMessage = exports.sendMessage
exports.addParticipant = exports.addParticipants
exports.getCompanyEmployees = exports.getCompanyMembers
