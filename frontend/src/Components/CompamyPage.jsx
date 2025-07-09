"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
  Business as BusinessIcon,
  Group as GroupIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from "@mui/icons-material"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import Header from "./Header"
import Sidebar from "./Sidebar"
import { useNavigate } from "react-router-dom"

const CompanyPage = ({ onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [companyData, setCompanyData] = useState(null)
  const [employees, setEmployees] = useState([])
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newData, setNewData] = useState({})
  const [dialogType, setDialogType] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await axios.get("http://localhost:5000/api/companies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = response.data[0]

        const transformedData = {
          name: data.name,
          logo: data.name.charAt(0),
          founded: new Date(data.createdAt).getFullYear().toString(),
          specialization: data.shortDescription,
          description: data.fullDescription,
          address: data.address,
          phone: data.phoneNumber,
          email: data.corporateEmail,
          website: "",
          employees: 0,
          products: [],
          monthlyProduction: {
            current: 0,
            previous: 0,
            growth: "+0%",
            target: 0,
            progress: 0,
          },
          productionByCategory: [],
          monthlyStats: [],
        }

        setCompanyData(transformedData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching company data:", error)
        setIsLoading(false)
        if (error.response && error.response.status === 401) {
          navigate("/login")
        }
      }
    }

    fetchData()
  }, [navigate])

  const COLORS = ["#3a86ff", "#ff006e", "#fb5607", "#ffbe0b", "#8338ec"]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleOpenAddDialog = (type) => {
    setDialogType(type)
    setOpenAddDialog(true)
    // Initialize form based on type
    if (type === "employee") {
      setNewData({
        name: "",
        position: "",
        department: "",
        email: "",
        phone: "",
        status: "active",
      })
    } else if (type === "product") {
      setNewData({
        name: "",
        category: "",
        quantity: 0,
      })
    }
  }

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false)
    setNewData({})
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddSubmit = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) throw new Error("No authentication token found")

      if (dialogType === "employee") {
        // Add employee logic
        const newEmployee = {
          id: employees.length + 1,
          name: newData.name,
          position: newData.position,
          department: newData.department,
          email: newData.email,
          phone: newData.phone,
          avatar: newData.name
            .split(" ")
            .map((n) => n[0])
            .join(""),
          status: newData.status,
        }
        setEmployees([...employees, newEmployee])
      } else if (dialogType === "product") {
        // Add product logic
        const newProduct = {
          id: companyData.products.length + 1,
          name: newData.name,
          category: newData.category,
          quantity: Number.parseInt(newData.quantity),
        }
        setCompanyData((prev) => ({
          ...prev,
          products: [...prev.products, newProduct],
        }))
      }

      // Here you would typically make an API call to save the data
      // await axios.post('your-api-endpoint', newData, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // })

      handleCloseAddDialog()
    } catch (error) {
      console.error("Error adding data:", error)
    }
  }

  const handleAddInfo = () => {
    navigate("/company/info")
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success"
      case "vacation":
        return "warning"
      case "leave":
        return "error"
      default:
        return "default"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Активен"
      case "vacation":
        return "Отпуск"
      case "leave":
        return "Отсутствует"
      default:
        return status
    }
  }

  if (isLoading) {
    return <LinearProgress />
  }

  if (!companyData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography variant="h6">Не удалось загрузить данные компании</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Header handleDrawerToggle={handleDrawerToggle} onLogout={onLogout} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Add Data Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === "employee" ? "Добавить сотрудника" : "Добавить продукт"}
          <IconButton
            aria-label="close"
            onClick={handleCloseAddDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === "employee" ? (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="ФИО" name="name" value={newData.name || ""} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Должность"
                  name="position"
                  value={newData.position || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Отдел"
                  name="department"
                  value={newData.department || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Статус</InputLabel>
                  <Select name="status" value={newData.status || "active"} onChange={handleInputChange} label="Статус">
                    <MenuItem value="active">Активен</MenuItem>
                    <MenuItem value="vacation">Отпуск</MenuItem>
                    <MenuItem value="leave">Отсутствует</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={newData.email || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Телефон"
                  name="phone"
                  value={newData.phone || ""}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Название продукта"
                  name="name"
                  value={newData.name || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Категория"
                  name="category"
                  value={newData.category || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Количество"
                  name="quantity"
                  type="number"
                  value={newData.quantity || 0}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Отмена</Button>
          <Button onClick={handleAddSubmit} variant="contained" color="primary">
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - 260px)` },
          height: "100vh",
          overflow: "auto",
          marginTop: "64px",
          display: "flex",
          flexWrap: "nowrap",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "background.default",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* Company Header */}
          <Card
            sx={{
              mb: 3,
              p: 2,
              background: (theme) =>
                theme.palette.mode === "light"
                  ? "linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%)"
                  : "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: "primary.main",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    {companyData.logo}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h4" component="div" gutterBottom>
                      {companyData.name}
                    </Typography>
                    <Chip label={`Основана в ${companyData.founded}`} size="small" sx={{ ml: 1, fontWeight: 500 }} />
                  </Box>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {companyData.specialization}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LocationIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {companyData.address}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {companyData.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <EmailIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {companyData.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item>
                  <Button variant="contained" startIcon={<InfoIcon />} sx={{ borderRadius: 2 }} onClick={handleAddInfo}>
                    Добавить информацию
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="company tabs">
              <Tab label="Обзор" id="tab-0" />
              <Tab label="Сотрудники" id="tab-1" />
              <Tab label="Продукция" id="tab-2" />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              {/* Company Description */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                    <BusinessIcon sx={{ mr: 1 }} /> О компании
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {companyData.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Сотрудников
                      </Typography>
                      <Typography variant="h6">{companyData.employees}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Продуктов
                      </Typography>
                      <Typography variant="h6">{companyData.products.length}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Monthly Production */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: "100%" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
                      <InventoryIcon sx={{ mr: 1 }} /> Производство в этом месяце
                    </Typography>
                    <Tooltip title="Экспорт">
                      <IconButton size="small">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs>
                        <Typography variant="h4" color="primary.main">
                          {companyData.monthlyProduction.current}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Предыдущий месяц: {companyData.monthlyProduction.previous}
                          </Typography>
                          <Chip
                            label={companyData.monthlyProduction.growth}
                            size="small"
                            color="success"
                            sx={{ ml: 1, height: 20, fontSize: "0.75rem" }}
                          />
                        </Box>
                      </Grid>
                      <Grid item>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="body2" color="text.secondary">
                            Цель: {companyData.monthlyProduction.target}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Прогресс: {companyData.monthlyProduction.progress}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    <LinearProgress
                      variant="determinate"
                      value={companyData.monthlyProduction.progress}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  {companyData.monthlyStats.length > 0 && (
                    <Box sx={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={companyData.monthlyStats}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={(theme) => alpha(theme.palette.text.primary, 0.1)}
                          />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip
                            contentStyle={{
                              fontFamily: "Inter",
                              borderRadius: 8,
                              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                              border: "none",
                            }}
                          />
                          <Bar dataKey="value" name="Единиц произведено" fill="#3a86ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Production by Category */}
              {companyData.productionByCategory.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
                        <WorkIcon sx={{ mr: 1 }} /> Производство по категориям
                      </Typography>
                      <Box>
                        <Tooltip title="Фильтр">
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <FilterListIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Экспорт">
                          <IconButton size="small">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={companyData.productionByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {companyData.productionByCategory.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{
                                  fontFamily: "Inter",
                                  borderRadius: 8,
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                  border: "none",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Категория</TableCell>
                                <TableCell align="right">Количество</TableCell>
                                <TableCell align="right">% от общего</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {companyData.productionByCategory.map((row, index) => (
                                <TableRow key={row.name}>
                                  <TableCell component="th" scope="row">
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                      <Box
                                        sx={{
                                          width: 12,
                                          height: 12,
                                          borderRadius: "50%",
                                          bgcolor: COLORS[index % COLORS.length],
                                          mr: 1,
                                        }}
                                      />
                                      {row.name}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">{row.value}</TableCell>
                                  <TableCell align="right">
                                    {((row.value / companyData.monthlyProduction.current) * 100).toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {/* Employees Tab */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
                  <GroupIcon sx={{ mr: 1 }} /> Сотрудники компании
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => handleOpenAddDialog("employee")}
                >
                  Добавить сотрудника
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Сотрудник</TableCell>
                      <TableCell>Должность</TableCell>
                      <TableCell>Отдел</TableCell>
                      <TableCell>Контакты</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>{employee.avatar}</Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {employee.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                <EmailIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: 16 }} />
                                <Typography variant="body2">{employee.email}</Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: 16 }} />
                                <Typography variant="body2">{employee.phone}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(employee.status)}
                              size="small"
                              color={getStatusColor(employee.status)}
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small">
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Нет данных о сотрудниках
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Products Tab */}
          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
                  <InventoryIcon sx={{ mr: 1 }} /> Продукция компании
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => handleOpenAddDialog("product")}
                >
                  Добавить продукт
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Название продукта</TableCell>
                      <TableCell>Категория</TableCell>
                      <TableCell align="right">Произведено в этом месяце</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyData.products.length > 0 ? (
                      companyData.products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={product.category} size="small" />
                          </TableCell>
                          <TableCell align="right">{product.quantity}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small">
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Нет данных о продукции
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default CompanyPage
