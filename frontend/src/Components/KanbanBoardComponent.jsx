"use client"

import { useState, useEffect, useCallback } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import axios from "axios"
import Sidebar from "./Sidebar"
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"

const API_BASE_URL = "http://localhost:5000/api"

const KanbanBoardComponent = () => {
  const [columns, setColumns] = useState({
    todo: {
      id: "todo",
      title: "К выполнению",
      taskIds: [],
      tasks: [],
    },
    inProgress: {
      id: "inProgress",
      title: "В процессе",
      taskIds: [],
      tasks: [],
    },
    done: {
      id: "done",
      title: "Выполнено",
      taskIds: [],
      tasks: [],
    },
  })

  const [tasks, setTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddTask, setShowAddTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

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
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  const [isDragDisabled, setIsDragDisabled] = useState(false)

  useEffect(() => {
    if (!user || !companyId || !token) {
      setError("Необходимо войти в систему и выбрать компанию")
      setLoading(false)
      return
    }

    fetchTasks()
  }, [companyId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      // Use the correct API endpoint
      const response = await apiClient.get(`/kanban/tasks?companyId=${companyId}`)

      const data = response.data
      console.log("Loaded tasks:", data)

      // Process tasks from API response structure
      const tasksById = {}
      const columnsCopy = { ...columns }

      // Reset task IDs and tasks in columns
      columnsCopy.todo.taskIds = []
      columnsCopy.todo.tasks = []
      columnsCopy.inProgress.taskIds = []
      columnsCopy.inProgress.tasks = []
      columnsCopy.done.taskIds = []
      columnsCopy.done.tasks = []

      // API returns tasks grouped by status
      const apiTasks = data.tasks || {}

      // Process todo tasks
      if (apiTasks.todo && Array.isArray(apiTasks.todo)) {
        apiTasks.todo.forEach((task) => {
          tasksById[task.id] = { ...task, status: "todo" }
          columnsCopy.todo.taskIds.push(task.id)
          columnsCopy.todo.tasks.push({ ...task, status: "todo" })
        })
      }

      // Process in_progress tasks (API uses in_progress, frontend uses inProgress)
      if (apiTasks.in_progress && Array.isArray(apiTasks.in_progress)) {
        apiTasks.in_progress.forEach((task) => {
          tasksById[task.id] = { ...task, status: "inProgress" }
          columnsCopy.inProgress.taskIds.push(task.id)
          columnsCopy.inProgress.tasks.push({ ...task, status: "inProgress" })
        })
      }

      // Process done tasks
      if (apiTasks.done && Array.isArray(apiTasks.done)) {
        apiTasks.done.forEach((task) => {
          tasksById[task.id] = { ...task, status: "done" }
          columnsCopy.done.taskIds.push(task.id)
          columnsCopy.done.tasks.push({ ...task, status: "done" })
        })
      }

      setTasks(tasksById)
      setColumns(columnsCopy)
      setError("")
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Ошибка при загрузке задач: " + (error.message || "Неизвестная ошибка"))
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = useCallback(
    async (result) => {
      const { destination, source, draggableId } = result

      // If dropped outside a droppable area
      if (!destination) return

      // If dropped in the same position
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return
      }

      // Check if source and destination columns exist
      if (!columns[source.droppableId] || !columns[destination.droppableId]) {
        console.error("Invalid droppable ID:", source.droppableId, destination.droppableId)
        return
      }

      setIsDragDisabled(true)

      try {
        // Get source and destination columns
        const sourceColumn = columns[source.droppableId]
        const destColumn = columns[destination.droppableId]

        // Create new arrays for task IDs
        const sourceTaskIds = Array.from(sourceColumn.taskIds)
        const destTaskIds =
          source.droppableId === destination.droppableId ? sourceTaskIds : Array.from(destColumn.taskIds)

        // Remove from source
        sourceTaskIds.splice(source.index, 1)

        // Add to destination
        destTaskIds.splice(destination.index, 0, draggableId)

        // Update task status if moved to a different column
        if (source.droppableId !== destination.droppableId) {
          // Map frontend status to API status
          const statusMapping = {
            todo: "todo",
            inProgress: "in_progress",
            done: "done",
          }

          const apiStatus = statusMapping[destination.droppableId]

          const updatedTask = {
            ...tasks[draggableId],
            status: destination.droppableId, // Keep frontend status for UI
          }

          // Update tasks state immediately for better UX
          setTasks((prevTasks) => ({
            ...prevTasks,
            [draggableId]: updatedTask,
          }))

          // Update the task status in your API with correct status
          try {
            await apiClient.put(`/kanban/tasks/${draggableId}`, {
              status: apiStatus, // Send API status
            })
          } catch (error) {
            console.error("Error updating task status:", error)
            // Revert the change if API call fails
            setTasks((prevTasks) => ({
              ...prevTasks,
              [draggableId]: tasks[draggableId],
            }))
            setError("Ошибка при обновлении статуса задачи")
            return
          }
        }

        // Create updated columns
        const updatedSourceColumn = {
          ...sourceColumn,
          taskIds: sourceTaskIds,
          tasks: sourceTaskIds.map((taskId) => tasks[taskId]).filter(Boolean),
        }

        const updatedDestColumn = {
          ...destColumn,
          taskIds: destTaskIds,
          tasks: destTaskIds
            .map(
              (taskId) =>
                tasks[taskId] ||
                (draggableId === taskId ? { ...tasks[draggableId], status: destination.droppableId } : null),
            )
            .filter(Boolean),
        }

        // Update columns state
        setColumns((prevColumns) => ({
          ...prevColumns,
          [source.droppableId]: updatedSourceColumn,
          [destination.droppableId]: updatedDestColumn,
        }))
      } catch (error) {
        console.error("Error in drag and drop:", error)
        setError("Ошибка при перемещении задачи")
      } finally {
        setIsDragDisabled(false)
      }
    },
    [columns, tasks, apiClient],
  )

  const handleAddTask = async (formData) => {
    try {
      setLoading(true)

      // Create new task object for API
      const newTaskData = {
        title: formData.title,
        content: formData.content,
        companyId: Number.parseInt(companyId),
        status: "todo",
      }

      // Send the new task to your API
      const response = await apiClient.post("/kanban/tasks", newTaskData)
      const savedTask = response.data

      // Update tasks state
      setTasks({
        ...tasks,
        [savedTask.id]: savedTask,
      })

      // Update columns state
      const updatedColumns = { ...columns }
      updatedColumns.todo.taskIds.push(savedTask.id)
      updatedColumns.todo.tasks.push(savedTask)
      setColumns(updatedColumns)

      setShowAddTask(false)
      setSnackbar({
        open: true,
        message: "Задача успешно создана",
        severity: "success",
      })
    } catch (error) {
      console.error("Error adding task:", error)
      setError("Ошибка при создании задачи: " + (error.message || "Неизвестная ошибка"))
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = async (formData) => {
    try {
      setLoading(true)

      if (!currentTask) return

      // Create updated task object
      const updatedTaskData = {
        title: formData.title,
        content: formData.content,
      }

      // Send the updated task to your API
      const response = await apiClient.put(`/kanban/tasks/${currentTask.id}`, updatedTaskData)
      const savedTask = response.data

      // Update tasks state
      setTasks({
        ...tasks,
        [savedTask.id]: savedTask,
      })

      // Update columns state
      const updatedColumns = { ...columns }
      const columnId = savedTask.status

      // Find and update the task in the column
      const taskIndex = updatedColumns[columnId].tasks.findIndex((task) => task.id === savedTask.id)

      if (taskIndex !== -1) {
        updatedColumns[columnId].tasks[taskIndex] = savedTask
        setColumns(updatedColumns)
      }

      setShowEditTask(false)
      setCurrentTask(null)
      setSnackbar({
        open: true,
        message: "Задача успешно обновлена",
        severity: "success",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      setError("Ошибка при обновлении задачи: " + (error.message || "Неизвестная ошибка"))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true)

      // Delete the task from your API
      await apiClient.delete(`/kanban/tasks/${taskId}`)

      // Find which column contains the task
      let columnId = null
      for (const [id, column] of Object.entries(columns)) {
        if (column.taskIds.includes(taskId)) {
          columnId = id
          break
        }
      }

      if (!columnId) return

      // Update columns state
      const updatedColumns = { ...columns }
      updatedColumns[columnId].taskIds = updatedColumns[columnId].taskIds.filter((id) => id !== taskId)
      updatedColumns[columnId].tasks = updatedColumns[columnId].tasks.filter((task) => task.id !== taskId)

      // Update tasks state
      const updatedTasks = { ...tasks }
      delete updatedTasks[taskId]

      setColumns(updatedColumns)
      setTasks(updatedTasks)
      setAnchorEl(null)
      setSnackbar({
        open: true,
        message: "Задача успешно удалена",
        severity: "success",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      setError("Ошибка при удалении задачи: " + (error.message || "Неизвестная ошибка"))
    } finally {
      setLoading(false)
    }
  }

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget)
    setCurrentTask(task)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setCurrentTask(null)
  }

  const handleEditClick = () => {
    setShowEditTask(true)
    setAnchorEl(null)
  }

  const handleDeleteClick = () => {
    if (currentTask) {
      handleDeleteTask(currentTask.id)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getColumnIcon = (columnId) => {
    switch (columnId) {
      case "todo":
        return <AssignmentIcon />
      case "inProgress":
        return <AccessTimeIcon />
      case "done":
        return <CheckCircleIcon />
      default:
        return <AssignmentIcon />
    }
  }

  const getUserDisplayName = (author) => {
    if (!author) return "Неизвестный пользователь"
    if (author.name && author.lastName) return `${author.name} ${author.lastName}`
    if (author.name) return author.name
    return author.email || "Пользователь"
  }

  if (!companyId) {
    return (
      <Box sx={{ display: "flex" }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, ml: { sm: "260px" }, p: 3 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
              Список дел
            </Typography>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Пожалуйста, выберите компанию для доступа к задачам
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
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4">Список дел</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddTask(true)} disabled={loading}>
              Новая задача
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Grid container spacing={3}>
              {Object.values(columns).map((column) => (
                <Grid item xs={12} md={4} key={`column-${column.id}`}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      height: "calc(100vh - 200px)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ mr: 1, bgcolor: column.id === "done" ? "success.main" : "primary.main" }}>
                        {getColumnIcon(column.id)}
                      </Avatar>
                      <Typography variant="h6">
                        {column.title} ({column.tasks.length})
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Droppable droppableId={column.id} key={column.id}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            flex: 1,
                            overflowY: "auto",
                            minHeight: "100px",
                            backgroundColor: snapshot.isDraggingOver ? "action.hover" : "transparent",
                            "& > div": { mb: 2 },
                          }}
                        >
                          {column.tasks.map((task, index) => (
                            <Draggable
                              key={`task-${task.id}`}
                              draggableId={task.id.toString()}
                              index={index}
                              isDragDisabled={isDragDisabled}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    mb: 2,
                                    transform: snapshot.isDragging ? "rotate(5deg)" : "none",
                                    boxShadow: snapshot.isDragging ? 4 : 1,
                                  }}
                                >
                                  <CardHeader
                                    avatar={
                                      <Avatar src={task.author?.avatar} alt={getUserDisplayName(task.author)}>
                                        {getUserDisplayName(task.author).charAt(0)}
                                      </Avatar>
                                    }
                                    action={
                                      <IconButton onClick={(e) => handleMenuOpen(e, task)}>
                                        <MoreVertIcon />
                                      </IconButton>
                                    }
                                    title={task.title}
                                    subheader={`${getUserDisplayName(task.author)} • ${formatDate(task.createdAt)}`}
                                  />
                                  <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                      {task.content}
                                    </Typography>
                                  </CardContent>
                                  <CardActions sx={{ justifyContent: "flex-end" }}>
                                    <Chip
                                      size="small"
                                      label={
                                        column.id === "todo"
                                          ? "К выполнению"
                                          : column.id === "inProgress"
                                            ? "В процессе"
                                            : "Выполнено"
                                      }
                                      color={
                                        column.id === "todo"
                                          ? "default"
                                          : column.id === "inProgress"
                                            ? "primary"
                                            : "success"
                                      }
                                    />
                                  </CardActions>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {column.tasks.length === 0 && (
                            <Box
                              sx={{
                                p: 2,
                                textAlign: "center",
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                border: "1px dashed",
                                borderColor: "divider",
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                Перетащите задачи сюда
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Droppable>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DragDropContext>

          {/* Add Task Dialog */}
          <Dialog open={showAddTask} onClose={() => setShowAddTask(false)} maxWidth="sm" fullWidth>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleAddTask({
                  title: formData.get("title"),
                  content: formData.get("content"),
                })
              }}
            >
              <DialogTitle>Создать новую задачу</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  name="title"
                  label="Заголовок задачи"
                  fullWidth
                  variant="outlined"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  name="content"
                  label="Описание задачи"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  required
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowAddTask(false)}>Отмена</Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "Создать"}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Edit Task Dialog */}
          <Dialog open={showEditTask} onClose={() => setShowEditTask(false)} maxWidth="sm" fullWidth>
            {currentTask && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  handleEditTask({
                    title: formData.get("title"),
                    content: formData.get("content"),
                  })
                }}
              >
                <DialogTitle>Редактировать задачу</DialogTitle>
                <DialogContent>
                  <TextField
                    autoFocus
                    margin="dense"
                    name="title"
                    label="Заголовок задачи"
                    fullWidth
                    variant="outlined"
                    required
                    defaultValue={currentTask.title}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    margin="dense"
                    name="content"
                    label="Описание задачи"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    required
                    defaultValue={currentTask.content}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setShowEditTask(false)}>Отмена</Button>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Сохранить"}
                  </Button>
                </DialogActions>
              </form>
            )}
          </Dialog>

          {/* Task Menu */}
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleEditClick}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Редактировать
            </MenuItem>
            <MenuItem onClick={handleDeleteClick}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Удалить
            </MenuItem>
          </Menu>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  )
}

export default KanbanBoardComponent
