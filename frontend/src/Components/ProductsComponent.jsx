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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

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

const ProductsComponent = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    analysis: {
      totalCost: "",
      salesLastQuarter: "",
      technicalImplementation: "",
      scalability: "",
      mainFeatures: "",
    },
  })

  useEffect(() => {
    fetchProducts()
  }, [searchTerm])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError("")

      const params = {}
      if (searchTerm) params.search = searchTerm

      const response = await api.get("/products", { params })
      setProducts(response.data.products || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch products"
      setError(`Ошибка при загрузке продуктов: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError("")

      const productData = {
        ...formData,
        analysis: {
          ...formData.analysis,
          totalCost: Number.parseFloat(formData.analysis.totalCost) || 0,
          salesLastQuarter: Number.parseFloat(formData.analysis.salesLastQuarter) || 0,
        },
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData)
      } else {
        await api.post("/products", productData)
      }

      resetForm()
      fetchProducts()
    } catch (err) {
      console.error("Error saving product:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to save product"
      setError(`Ошибка при сохранении продукта: ${errorMessage}`)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот продукт?")) {
      return
    }

    try {
      setError("")
      await api.delete(`/products/${productId}`)
      fetchProducts()
    } catch (err) {
      console.error("Error deleting product:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete product"
      setError(`Ошибка при удалении продукта: ${errorMessage}`)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      analysis: {
        totalCost: product.analysis?.totalCost?.toString() || "",
        salesLastQuarter: product.analysis?.salesLastQuarter?.toString() || "",
        technicalImplementation: product.analysis?.technicalImplementation || "",
        scalability: product.analysis?.scalability || "",
        mainFeatures: product.analysis?.mainFeatures || "",
      },
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      analysis: {
        totalCost: "",
        salesLastQuarter: "",
        technicalImplementation: "",
        scalability: "",
        mainFeatures: "",
      },
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith("analysis.")) {
      const analysisField = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          [analysisField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(amount)
  }

  // Prepare chart data
  const chartData = products
    .filter((product) => product.analysis)
    .map((product) => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + "..." : product.name,
      cost: product.analysis.totalCost || 0,
      sales: product.analysis.salesLastQuarter || 0,
      profit: (product.analysis.salesLastQuarter || 0) - (product.analysis.totalCost || 0),
    }))

  const totalCosts = products.reduce((sum, product) => sum + (product.analysis?.totalCost || 0), 0)
  const totalSales = products.reduce((sum, product) => sum + (product.analysis?.salesLastQuarter || 0), 0)

  const pieData = products
    .filter((product) => product.analysis?.salesLastQuarter > 0)
    .map((product, index) => ({
      name: product.name,
      value: product.analysis.salesLastQuarter,
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    }))

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Загрузка продуктов...
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
          Управление продуктами
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            placeholder="Поиск продуктов..."
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
            Добавить продукт
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {products.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                    <InventoryIcon />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Всего продуктов
                    </Typography>
                    <Typography variant="h5" component="div">
                      {products.length}
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
                  <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
                    <TrendingDownIcon />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Общие затраты
                    </Typography>
                    <Typography variant="h5" component="div" color="error.main">
                      {formatCurrency(totalCosts)}
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
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Общие продажи
                    </Typography>
                    <Typography variant="h5" component="div" color="success.main">
                      {formatCurrency(totalSales)}
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
                  <Avatar sx={{ bgcolor: totalSales - totalCosts >= 0 ? "info.main" : "warning.main", mr: 2 }}>
                    <AttachMoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Прибыль
                    </Typography>
                    <Typography
                      variant="h5"
                      component="div"
                      color={totalSales - totalCosts >= 0 ? "info.main" : "warning.main"}
                    >
                      {formatCurrency(totalSales - totalCosts)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {chartData.length > 0 ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Анализ затрат и продаж по продуктам
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="cost" fill="#f44336" name="Затраты" />
                    <Bar dataKey="sales" fill="#4caf50" name="Продажи" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            {pieData.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Распределение продаж
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Прибыльность продуктов
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke="#2196f3" strokeWidth={2} name="Прибыль" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        products.length > 0 && (
          <Card sx={{ mb: 4, textAlign: "center", py: 6 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                📊
              </Typography>
              <Typography variant="h6" gutterBottom>
                Нет данных для аналитики
              </Typography>
              <Typography color="textSecondary">
                Добавьте информацию об анализе продуктов для отображения графиков
              </Typography>
            </CardContent>
          </Card>
        )
      )}

      {/* Products List */}
      {products.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            Список продуктов
          </Typography>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} md={6} lg={4} key={product.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {product.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => handleEdit(product)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(product.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Box>

                    <Typography color="textSecondary" paragraph>
                      {product.description}
                    </Typography>

                    {product.analysis && (
                      <Box>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              Затраты:
                            </Typography>
                            <Typography variant="body1" color="error.main" fontWeight="medium">
                              {formatCurrency(product.analysis.totalCost)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              Продажи:
                            </Typography>
                            <Typography variant="body1" color="success.main" fontWeight="medium">
                              {formatCurrency(product.analysis.salesLastQuarter)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Прибыль:
                            </Typography>
                            <Typography
                              variant="body1"
                              fontWeight="medium"
                              color={
                                product.analysis.salesLastQuarter - product.analysis.totalCost >= 0
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {formatCurrency(product.analysis.salesLastQuarter - product.analysis.totalCost)}
                            </Typography>
                          </Grid>
                        </Grid>

                        {(product.analysis.technicalImplementation ||
                          product.analysis.scalability ||
                          product.analysis.mainFeatures) && (
                          <Accordion sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="body2">Детальный анализ</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {product.analysis.technicalImplementation && (
                                <Box mb={2}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Техническая реализация:
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {product.analysis.technicalImplementation}
                                  </Typography>
                                </Box>
                              )}
                              {product.analysis.scalability && (
                                <Box mb={2}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Масштабируемость:
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {product.analysis.scalability}
                                  </Typography>
                                </Box>
                              )}
                              {product.analysis.mainFeatures && (
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Основные функции:
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {product.analysis.mainFeatures}
                                  </Typography>
                                </Box>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Typography variant="caption" color="textSecondary">
                      Создан: {new Date(product.createdAt).toLocaleDateString("ru-RU")}
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
                📦
              </Typography>
              <Typography variant="h6" gutterBottom>
                Нет продуктов
              </Typography>
              <Typography color="textSecondary" paragraph>
                Начните добавлять продукты для управления вашим портфолио
              </Typography>
              <Button variant="contained" onClick={() => setShowForm(true)}>
                Добавить первый продукт
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Product Form Dialog */}
      <Dialog open={showForm} onClose={resetForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              {editingProduct ? "Редактировать продукт" : "Добавить продукт"}
              <IconButton onClick={resetForm}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Основная информация
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="name"
                  label="Название продукта"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="description"
                  label="Описание"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Анализ продукта
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="analysis.totalCost"
                  label="Общая стоимость"
                  value={formData.analysis.totalCost}
                  onChange={handleFormChange}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="analysis.salesLastQuarter"
                  label="Продажи за квартал"
                  value={formData.analysis.salesLastQuarter}
                  onChange={handleFormChange}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="analysis.technicalImplementation"
                  label="Техническая реализация"
                  value={formData.analysis.technicalImplementation}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="analysis.scalability"
                  label="Масштабируемость"
                  value={formData.analysis.scalability}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="analysis.mainFeatures"
                  label="Основные функции"
                  value={formData.analysis.mainFeatures}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Отменить</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? "Обновить" : "Сохранить"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}

export default ProductsComponent
