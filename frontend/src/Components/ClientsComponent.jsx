"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Stack,
  Divider,
  InputAdornment,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material"

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

const ClientsComponent = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    fetchClients()
  }, [searchTerm])

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError("")

      const params = {}
      if (searchTerm) params.search = searchTerm

      const response = await api.get("/clients", { params })
      setClients(response.data.clients || [])
    } catch (err) {
      console.error("Error fetching clients:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch clients"
      setError(`Ошибка при загрузке клиентов: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError("")

      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData)
      } else {
        await api.post("/clients", formData)
      }

      resetForm()
      fetchClients()
    } catch (err) {
      console.error("Error saving client:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to save client"
      setError(`Ошибка при сохранении клиента: ${errorMessage}`)
    }
  }

  const handleDelete = async (clientId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого клиента?")) {
      return
    }

    try {
      setError("")
      await api.delete(`/clients/${clientId}`)
      fetchClients()
    } catch (err) {
      console.error("Error deleting client:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete client"
      setError(`Ошибка при удалении клиента: ${errorMessage}`)
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    })
    setEditingClient(null)
    setShowForm(false)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Нет данных"
    return new Date(dateString).toLocaleDateString("ru-RU")
  }

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Загрузка клиентов...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Управление клиентами
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            placeholder="Поиск клиентов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
            Добавить клиента
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Summary Card */}
      {clients.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Всего клиентов
                    </Typography>
                    <Typography variant="h5" component="div">
                      {clients.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                    <AttachMoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Общие траты
                    </Typography>
                    <Typography variant="h5" component="div" color="success.main">
                      {formatCurrency(clients.reduce((sum, client) => sum + (client.totalSpent || 0), 0))}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Clients List */}
      {clients.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            Список клиентов
          </Typography>
          <Grid container spacing={3}>
            {clients.map((client) => (
              <Grid item xs={12} md={6} lg={4} key={client.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {client.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => handleEdit(client)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(client.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Box>

                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center">
                        <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                        <Typography variant="body2" color="textSecondary">
                          {client.email}
                        </Typography>
                      </Box>

                      {client.phone && (
                        <Box display="flex" alignItems="center">
                          <PhoneIcon sx={{ mr: 1, color: "text.secondary" }} />
                          <Typography variant="body2" color="textSecondary">
                            {client.phone}
                          </Typography>
                        </Box>
                      )}

                      {client.address && (
                        <Box display="flex" alignItems="center">
                          <LocationIcon sx={{ mr: 1, color: "text.secondary" }} />
                          <Typography variant="body2" color="textSecondary">
                            {client.address}
                          </Typography>
                        </Box>
                      )}

                      <Divider />

                      <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Общие траты:
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(client.totalSpent || 0)}
                        </Typography>
                      </Box>

                      {client.lastPurchaseDate && (
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Последняя покупка:
                          </Typography>
                          <Typography variant="body2">{formatDate(client.lastPurchaseDate)}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Typography variant="caption" color="textSecondary">
                      Добавлен: {formatDate(client.createdAt)}
                    </Typography>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        !loading && (
          <Card sx={{ textAlign: "center", py: 6 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                👥
              </Typography>
              <Typography variant="h6" gutterBottom>
                Нет клиентов
              </Typography>
              <Typography color="textSecondary" paragraph>
                Начните добавлять клиентов для управления вашей клиентской базой
              </Typography>
              <Button variant="contained" onClick={() => setShowForm(true)}>
                Добавить первого клиента
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Client Form Dialog */}
      <Dialog open={showForm} onClose={resetForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              {editingClient ? "Редактировать клиента" : "Добавить клиента"}
              <IconButton onClick={resetForm}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="name"
                  label="Имя клиента"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth name="phone" label="Телефон" value={formData.phone} onChange={handleFormChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="address"
                  label="Адрес"
                  value={formData.address}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Отменить</Button>
            <Button type="submit" variant="contained">
              {editingClient ? "Обновить" : "Сохранить"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}

export default ClientsComponent
