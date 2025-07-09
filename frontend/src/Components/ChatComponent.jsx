"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import Sidebar from "./Sidebar"
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Menu,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material"
import {
  Send as SendIcon,
  Add as AddIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Circle as CircleIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
} from "@mui/icons-material"


// Lazy load socket.io-client to handle missing dependency gracefully
let io = null
try {
  io = require("socket.io-client").default || require("socket.io-client")
} catch (error) {
  console.warn("Socket.IO client not available:", error.message)
}

// Configure axios defaults
const API_BASE_URL = "http://localhost:5000/api"

const ChatComponent = ({ onLogout }) => {
  const [socket, setSocket] = useState(null)
  const [chatRooms, setChatRooms] = useState([])
  const [companyMembers, setCompanyMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [socketAvailable, setSocketAvailable] = useState(false)
  const [tabValue, setTabValue] = useState(0) // 0 for rooms, 1 for members
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [addParticipantSearch, setAddParticipantSearch] = useState("")

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const companyId = localStorage.getItem("companyId")
  const token = localStorage.getItem("authToken")

  // Configure axios instance
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000, // 10 second timeout
  })

  // Add request interceptor to include auth token
  apiClient.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      console.log(`Making API request: ${config.method?.toUpperCase()} ${config.url}`, config.data)
      return config
    },
    (error) => {
      console.error("Request interceptor error:", error)
      return Promise.reject(error)
    },
  )

  // Add response interceptor for better error handling
  apiClient.interceptors.response.use(
    (response) => {
      console.log(`API Response: ${response.status}`, response.data)
      return response
    },
    (error) => {
      console.error("API Error:", error)

      let errorMessage = "Неизвестная ошибка сервера"

      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response
        console.error(`Server Error ${status}:`, data)

        if (data?.message) {
          errorMessage = data.message
        } else if (data?.error) {
          errorMessage = data.error
        } else if (typeof data === "string") {
          errorMessage = data
        } else {
          errorMessage = `Ошибка сервера: ${status}`
        }
      } else if (error.request) {
        // Network error
        console.error("Network Error:", error.request)
        errorMessage = "Ошибка подключения к серверу. Проверьте, что сервер запущен."
      } else {
        // Other error
        console.error("Error:", error.message)
        errorMessage = error.message
      }

      return Promise.reject(new Error(errorMessage))
    },
  )

  // Debug logging
  console.log("Current user:", user)
  console.log("Company ID:", companyId)
  console.log("Token available:", !!token)

  useEffect(() => {
    if (!user || !companyId || !token) {
      setError("Необходимо войти в систему и выбрать компанию")
      return
    }

    // Load initial data immediately
    const loadInitialData = async () => {
      await Promise.all([loadChatRooms(), loadCompanyMembers()])
    }

    loadInitialData()

    // Check if socket.io is available
    if (!io) {
      console.warn("Socket.IO client is not available. Using API-only mode.")
      setSocketAvailable(false)
    } else {
      setSocketAvailable(true)
      // Initialize socket connection
      try {
        const newSocket = io("http://localhost:5000", {
          auth: { token },
        })
        setSocket(newSocket)

        // Socket event listeners
        newSocket.on("connect", () => {
          console.log("Connected to chat server")
        })

        newSocket.on("disconnect", () => {
          console.log("Disconnected from chat server")
        })

        return () => {
          newSocket.close()
        }
      } catch (error) {
        console.error("Failed to initialize socket connection:", error)
        setSocketAvailable(false)
      }
    }

    // Load initial data
  }, [user.id, companyId, token]) // Fixed dependencies

  useEffect(() => {
    if (!socket || !socketAvailable) return

    socket.on("receive_message", (message) => {
      if (selectedRoom && message.chatRoomId === selectedRoom.id) {
        setMessages((prev) => [...prev, message])
      }
    })

    socket.on("user_typing", (data) => {
      if (selectedRoom && data.chatRoomId === selectedRoom.id) {
        setTypingUsers((prev) => [...prev.filter((u) => u.id !== data.userId), data])
      }
    })

    socket.on("user_stop_typing", (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId))
    })

    return () => {
      socket.off("receive_message")
      socket.off("user_typing")
      socket.off("user_stop_typing")
    }
  }, [socket, selectedRoom, socketAvailable])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(companyMembers)
    } else {
      const filtered = companyMembers.filter((member) => {
        const userData = member.user || member
        const searchLower = searchQuery.toLowerCase()

        return (
          (userData.username && userData.username.toLowerCase().includes(searchLower)) ||
          (userData.name && userData.name.toLowerCase().includes(searchLower)) ||
          (userData.lastName && userData.lastName.toLowerCase().includes(searchLower)) ||
          (userData.email && userData.email.toLowerCase().includes(searchLower)) ||
          (userData.position && userData.position.toLowerCase().includes(searchLower)) ||
          (userData.department && userData.department.toLowerCase().includes(searchLower))
        )
      })
      setFilteredMembers(filtered)
    }
  }, [searchQuery, companyMembers])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChatRooms = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/chat/rooms?companyId=${companyId}&includePrivate=true`)
      const data = response.data
      console.log("Loaded chat rooms:", data)
      setChatRooms(data.rooms || data || [])
      setError("")
    } catch (error) {
      console.error("Error loading chat rooms:", error)
      setError("Ошибка загрузки чат-комнат: " + error.message)
      setChatRooms([])
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyMembers = async () => {
    try {
      setLoading(true)

      // Try company members endpoint first (more reliable)
      let data
      try {
        const response = await apiClient.get(`/companies/${companyId}/members`)
        data = response.data
        console.log("Loaded company members:", data)
      } catch (error) {
        // Fallback to chat-specific endpoint
        console.log("Trying chat members endpoint")
        const response = await apiClient.get(`/chat/members/${companyId}`)
        data = response.data
        console.log("Loaded chat members:", data)
      }

      // Normalize the data structure
      const normalizedMembers = (data || []).map((member) => {
        // Handle different API response structures
        let userData, memberId, userId

        if (member.user) {
          // From chat endpoint - has nested user object
          userData = member.user
          memberId = member.id
          userId = member.user.id
        } else {
          // From company members endpoint - user data is at root level
          userData = {
            id: member.userId || member.id,
            username:
              member.username ||
              member.name ||
              `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
              member.email,
            name: member.name || member.firstName,
            lastName: member.lastName,
            email: member.email,
            position: member.position || member.role,
            department: member.department,
          }
          memberId = member.id
          userId = member.userId || member.id
        }

        return {
          id: memberId,
          userId: userId,
          user: userData,
          isOnline: member.isOnline || Math.random() > 0.5, // Use API data or mock
          lastSeen: member.lastSeen || new Date(Date.now() - Math.random() * 86400000).toISOString(),
        }
      })

      console.log("Normalized members:", normalizedMembers)
      console.log("Current user for filtering:", user)

      // Filter out current user - check multiple possible ID fields
      const filteredMembers = normalizedMembers.filter((member) => {
        const userData = member.user
        const isCurrentUser =
          userData.id === user.id ||
          userData.email === user.email ||
          member.userId === user.id ||
          (user.email && userData.email === user.email)

        console.log(`Checking member ${userData.email} against user ${user.email}:`, !isCurrentUser)
        return !isCurrentUser
      })

      console.log("Filtered members (excluding current user):", filteredMembers)
      setCompanyMembers(filteredMembers)
      setError("")
    } catch (error) {
      console.error("Error loading company members:", error)
      setError("Ошибка загрузки участников компании: " + error.message)
      setCompanyMembers([])
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (roomId) => {
    try {
      const response = await apiClient.get(`/chat/rooms/${roomId}/messages?limit=50`)
      const data = response.data
      console.log("Loaded messages:", data)
      setMessages(data.messages || data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
      setError("Ошибка загрузки сообщений: " + error.message)
      setMessages([])
    }
  }

  const selectRoom = (room) => {
    if (selectedRoom && socket && socketAvailable) {
      socket.emit("leave_room", selectedRoom.id)
    }

    setSelectedRoom(room)
    if (socket && socketAvailable) {
      socket.emit("join_room", room.id)
    }
    loadMessages(room.id)
  }

  const addParticipants = async (participantIds) => {
    if (!selectedRoom || participantIds.length === 0) return

    try {
      setLoading(true)
      console.log("Adding participants:", participantIds, "to room:", selectedRoom.id)

      const requestData = {
        userIds: participantIds.map((id) => Number.parseInt(id)),
      }

      const response = await apiClient.post(`/chat/rooms/${selectedRoom.id}/participants`, requestData)
      const data = response.data

      console.log("Participants added:", data)

      // Refresh the selected room to show new participants
      const updatedRoom = await apiClient.get(`/chat/rooms/${selectedRoom.id}`)
      setSelectedRoom(updatedRoom.data)

      // Refresh chat rooms list
      await loadChatRooms()

      setShowAddParticipant(false)
      setSelectedParticipants([])
      setAddParticipantSearch("")
      setError("")
    } catch (error) {
      console.error("Error adding participants:", error)
      setError("Ошибка добавления участников: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createPrivateChat = async (targetUserId) => {
    try {
      setLoading(true)
      console.log("Creating private chat with user ID:", targetUserId)
      console.log("Company ID:", companyId)

      // Check if a private chat already exists
      const existingRoom = chatRooms.find((room) => {
        if (!room.isPrivate) return false

        // Check if this room has exactly 2 participants and includes the target user
        const participants = room.participants || []
        if (participants.length !== 2) return false

        return participants.some((p) => {
          const participantUserId = p.userId || p.user?.id
          return participantUserId === targetUserId
        })
      })

      if (existingRoom) {
        console.log("Found existing private chat:", existingRoom)
        selectRoom(existingRoom)
        setTabValue(0)
        return
      }

      // Create new private chat
      const requestData = {
        participantId: Number.parseInt(targetUserId),
        companyId: Number.parseInt(companyId),
      }

      console.log("Creating private chat with data:", requestData)

      const response = await apiClient.post("/chat/private", requestData)
      const data = response.data

      console.log("Private chat created:", data)

      // Refresh chat rooms to include the new private chat
      await loadChatRooms()

      // Select the new private chat
      if (data && data.id) {
        selectRoom(data)
      } else {
        // Find the newly created room
        const newRoomsResponse = await apiClient.get(`/chat/rooms?companyId=${companyId}&includePrivate=true`)
        const newRoomsData = newRoomsResponse.data
        const newPrivateRoom = (newRoomsData.rooms || newRoomsData || []).find((room) => {
          if (!room.isPrivate) return false
          const participants = room.participants || []
          return participants.some((p) => {
            const participantUserId = p.userId || p.user?.id
            return participantUserId === targetUserId
          })
        })

        if (newPrivateRoom) {
          selectRoom(newPrivateRoom)
        }
      }

      setTabValue(0) // Switch to rooms tab
      setError("")
    } catch (error) {
      console.error("Error creating private chat:", error)
      setError("Ошибка создания личного чата: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom) return

    try {
      const requestData = {
        content: newMessage,
      }

      const response = await apiClient.post(`/chat/rooms/${selectedRoom.id}/messages`, requestData)
      const messageData = response.data

      console.log("Message sent:", messageData)
      setMessages((prev) => [...prev, messageData])

      // Emit to other users via socket if available
      if (socket && socketAvailable) {
        socket.emit("send_message", messageData)
      }

      setNewMessage("")
      stopTyping()
      setError("")
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Ошибка отправки сообщения: " + error.message)
    }
  }

  const createRoom = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      setLoading(true)

      const requestData = {
        name: formData.get("name"),
        description: formData.get("description") || "",
        companyId: Number.parseInt(companyId),
        isPrivate: false,
      }

      console.log("Creating room with data:", requestData)

      // Validate required fields
      if (!requestData.name || !requestData.name.trim()) {
        throw new Error("Название комнаты обязательно")
      }

      if (!requestData.companyId || isNaN(requestData.companyId)) {
        throw new Error("Неверный ID компании")
      }

      const response = await apiClient.post("/chat/rooms", requestData)
      const data = response.data

      console.log("Room created:", data)
      setShowCreateRoom(false)
      await loadChatRooms()

      // Select the newly created room
      if (data && data.id) {
        selectRoom(data)
      }

      setError("")
    } catch (error) {
      console.error("Error creating room:", error)
      setError("Ошибка создания комнаты: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTyping = () => {
    if (!socketAvailable || !socket || !selectedRoom) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit("typing", {
        chatRoomId: selectedRoom.id,
        userId: user.id,
        username: user.username || user.name,
      })
    }

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 1000)
  }

  const stopTyping = () => {
    if (!socketAvailable || !socket || !selectedRoom) return

    if (isTyping) {
      setIsTyping(false)
      socket.emit("stop_typing", {
        chatRoomId: selectedRoom.id,
        userId: user.id,
      })
    }
  }

  const handleMemberMenuClick = (event, member) => {
    setAnchorEl(event.currentTarget)
    setSelectedMember(member)
  }

  const handleMemberMenuClose = () => {
    setAnchorEl(null)
    setSelectedMember(null)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([loadChatRooms(), loadCompanyMembers()])
    } finally {
      setRefreshing(false)
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatLastSeen = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "только что"
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    return `${diffDays} дн назад`
  }

  const getUserDisplayName = (userData) => {
    if (userData.username) return userData.username
    if (userData.name && userData.lastName) return `${userData.name} ${userData.lastName}`
    if (userData.name) return userData.name
    return userData.email || "Пользователь"
  }

  if (!companyId) {
    return (
      <Box sx={{ display: "flex" }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, ml: { sm: "260px" }, p: 3 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
              Чат
            </Typography>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Пожалуйста, выберите компанию для доступа к чату
              </Typography>
            </Paper>
          </Container>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, ml: { sm: "260px" }, p: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h4">
              Чат
              {!socketAvailable && <Chip label="API режим" color="info" size="small" sx={{ ml: 2 }} />}
            </Typography>
            <Tooltip title="Обновить данные">
              <IconButton onClick={refreshData} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ height: "calc(100vh - 200px)" }}>
            {/* Chat Rooms and Members List */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="fullWidth">
                    <Tab
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <GroupIcon />
                          Комнаты
                          <Badge badgeContent={chatRooms.length} color="primary" />
                        </Box>
                      }
                    />
                    <Tab
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <PersonIcon />
                          Сотрудники
                          <Badge badgeContent={companyMembers.length} color="secondary" />
                        </Box>
                      }
                    />
                  </Tabs>
                </Box>

                {/* Tab Content */}
                {tabValue === 0 && (
                  <>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6">Чат-комнаты</Typography>
                        <IconButton onClick={() => setShowCreateRoom(true)} color="primary">
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <List sx={{ flex: 1, overflow: "auto" }}>
                      {loading && (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                      {chatRooms.length === 0 && !loading && (
                        <Box sx={{ p: 2, textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            Нет доступных комнат
                          </Typography>
                        </Box>
                      )}
                      {chatRooms.map((room) => (
                        <ListItem
                          key={room.id}
                          button
                          selected={selectedRoom?.id === room.id}
                          onClick={() => selectRoom(room)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: room.isPrivate ? "secondary.main" : "primary.main" }}>
                              {room.isPrivate ? <PersonIcon /> : <GroupIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={room.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {room.isPrivate ? "Личный чат" : `${room.participants?.length || 0} участников`}
                                </Typography>
                                {room.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {room.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {tabValue === 1 && (
                  <>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                      <Typography variant="h6" gutterBottom>
                        Сотрудники компании
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Поиск сотрудников..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                          endAdornment: searchQuery && (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={clearSearch}>
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <List sx={{ flex: 1, overflow: "auto" }}>
                      {loading && (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                      {filteredMembers.length === 0 && !loading && (
                        <Box sx={{ p: 2, textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            {searchQuery ? "Сотрудники не найдены" : "Нет сотрудников"}
                          </Typography>
                        </Box>
                      )}
                      {filteredMembers.map((member) => {
                        const userData = member.user || member
                        return (
                          <ListItem key={member.id || userData.id}>
                            <ListItemAvatar>
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                badgeContent={
                                  <CircleIcon
                                    sx={{
                                      color: member.isOnline ? "success.main" : "grey.400",
                                      fontSize: 12,
                                    }}
                                  />
                                }
                              >
                                <Avatar>{getUserDisplayName(userData).charAt(0).toUpperCase()}</Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={getUserDisplayName(userData)}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {userData.email}
                                  </Typography>
                                  {userData.position && (
                                    <Typography variant="caption" display="block">
                                      {userData.position}
                                      {userData.department && ` • ${userData.department}`}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    {member.isOnline ? "В сети" : `Был(а) ${formatLastSeen(member.lastSeen)}`}
                                  </Typography>
                                </Box>
                              }
                            />
                            <IconButton size="small" onClick={(e) => handleMemberMenuClick(e, member)}>
                              <MoreVertIcon />
                            </IconButton>
                          </ListItem>
                        )
                      })}
                    </List>
                  </>
                )}
              </Paper>
            </Grid>

            {/* Chat Messages */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {selectedRoom ? (
                  <>
                    {/* Chat Header */}
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: selectedRoom.isPrivate ? "secondary.main" : "primary.main" }}>
                            {selectedRoom.isPrivate ? <PersonIcon /> : <GroupIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{selectedRoom.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedRoom.isPrivate
                                ? "Личный чат"
                                : `${selectedRoom.participants?.length || 0} участников`}
                            </Typography>
                          </Box>
                        </Box>
                        {!selectedRoom.isPrivate && (
                          <Button
                            startIcon={<PersonAddIcon />}
                            onClick={() => setShowAddParticipant(true)}
                            size="small"
                          >
                            Добавить
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {/* Messages */}
                    <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
                      {messages.map((message) => {
                        const isOwnMessage = message.userId === user.id || message.senderId === user.id
                        const senderName = message.sender?.username || message.sender?.name || "Пользователь"

                        return (
                          <Box
                            key={message.id}
                            sx={{
                              display: "flex",
                              justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                              mb: 1,
                            }}
                          >
                            <Card
                              sx={{
                                maxWidth: "70%",
                                bgcolor: isOwnMessage ? "primary.main" : "grey.100",
                                color: isOwnMessage ? "primary.contrastText" : "text.primary",
                              }}
                            >
                              <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                                <Typography variant="caption" display="block">
                                  {senderName} • {formatTime(message.createdAt)}
                                </Typography>
                                <Typography variant="body2">{message.message || message.content}</Typography>
                              </CardContent>
                            </Card>
                          </Box>
                        )
                      })}

                      {typingUsers.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
                          {typingUsers.map((user) => user.username).join(", ")} печатает...
                        </Typography>
                      )}

                      <div ref={messagesEndRef} />
                    </Box>

                    {/* Message Input */}
                    <Box component="form" onSubmit={sendMessage} sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="Введите сообщение..."
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value)
                            handleTyping()
                          }}
                          size="small"
                          disabled={loading}
                        />
                        <Button
                          type="submit"
                          variant="contained"
                          endIcon={<SendIcon />}
                          disabled={loading || !newMessage.trim()}
                        >
                          Отправить
                        </Button>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <ChatIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Выберите чат-комнату для начала общения
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Или выберите сотрудника из списка для создания личного чата
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Member Menu */}
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMemberMenuClose}>
            <MenuItem
              onClick={() => {
                if (selectedMember) {
                  const userData = selectedMember.user || selectedMember
                  const userId = userData.id || selectedMember.userId
                  console.log("Starting chat with user:", userId, userData)
                  createPrivateChat(userId)
                }
                handleMemberMenuClose()
              }}
              disabled={loading}
            >
              <ChatIcon sx={{ mr: 1 }} />
              Начать чат
            </MenuItem>
          </Menu>

          {/* Create Room Dialog */}
          <Dialog open={showCreateRoom} onClose={() => setShowCreateRoom(false)} maxWidth="sm" fullWidth>
            <form onSubmit={createRoom}>
              <DialogTitle>Создать новую чат-комнату</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  name="name"
                  label="Название комнаты"
                  fullWidth
                  variant="outlined"
                  required
                  sx={{ mb: 2 }}
                  disabled={loading}
                />
                <TextField
                  margin="dense"
                  name="description"
                  label="Описание"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  disabled={loading}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowCreateRoom(false)} disabled={loading}>
                  Отмена
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : "Создать"}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Add Participants Dialog */}
          <Dialog open={showAddParticipant} onClose={() => setShowAddParticipant(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Добавить участников в "{selectedRoom?.name}"</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                size="small"
                placeholder="Поиск сотрудников..."
                value={addParticipantSearch}
                onChange={(e) => setAddParticipantSearch(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: addParticipantSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setAddParticipantSearch("")}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Выберите сотрудников для добавления в чат-комнату:
              </Typography>

              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {companyMembers
                  .filter((member) => {
                    const userData = member.user || member
                    const searchLower = addParticipantSearch.toLowerCase()

                    // Filter by search query
                    const matchesSearch =
                      !addParticipantSearch ||
                      (userData.name && userData.name.toLowerCase().includes(searchLower)) ||
                      (userData.lastName && userData.lastName.toLowerCase().includes(searchLower)) ||
                      (userData.email && userData.email.toLowerCase().includes(searchLower))

                    // Filter out existing participants
                    const isAlreadyParticipant = selectedRoom?.participants?.some((p) => {
                      const participantUserId = p.userId || p.user?.id
                      const memberUserId = userData.id || member.userId
                      return participantUserId === memberUserId
                    })

                    return matchesSearch && !isAlreadyParticipant
                  })
                  .map((member) => {
                    const userData = member.user || member
                    const memberId = userData.id || member.userId
                    const isSelected = selectedParticipants.includes(memberId)

                    return (
                      <ListItem
                        key={member.id || userData.id}
                        button
                        selected={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedParticipants((prev) => prev.filter((id) => id !== memberId))
                          } else {
                            setSelectedParticipants((prev) => [...prev, memberId])
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            badgeContent={
                              <CircleIcon
                                sx={{
                                  color: member.isOnline ? "success.main" : "grey.400",
                                  fontSize: 12,
                                }}
                              />
                            }
                          >
                            <Avatar>{getUserDisplayName(userData).charAt(0).toUpperCase()}</Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getUserDisplayName(userData)}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {userData.email}
                              </Typography>
                              {userData.position && (
                                <Typography variant="caption" display="block">
                                  {userData.position}
                                  {userData.department && ` • ${userData.department}`}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        {isSelected && <CheckIcon color="primary" />}
                      </ListItem>
                    )
                  })}
              </List>

              {selectedParticipants.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Выбрано участников: {selectedParticipants.length}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectedParticipants.map((participantId) => {
                      const member = companyMembers.find((m) => {
                        const userData = m.user || m
                        return (userData.id || m.userId) === participantId
                      })
                      const userData = member?.user || member
                      return (
                        <Chip
                          key={participantId}
                          label={getUserDisplayName(userData)}
                          onDelete={() => setSelectedParticipants((prev) => prev.filter((id) => id !== participantId))}
                          size="small"
                        />
                      )
                    })}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setShowAddParticipant(false)
                  setSelectedParticipants([])
                  setAddParticipantSearch("")
                }}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button
                onClick={() => addParticipants(selectedParticipants)}
                variant="contained"
                disabled={loading || selectedParticipants.length === 0}
              >
                {loading ? <CircularProgress size={20} /> : `Добавить (${selectedParticipants.length})`}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  )
}

export default ChatComponent
