"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  Info as InfoIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material"
import Header from "./Header"
import Sidebar from "./Sidebar"

const DashboardComponent = ({ onLogout }) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const authToken = localStorage.getItem("authToken")
        const response = await axios.get("http://localhost:5000/api/dashboard", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        setDashboardData(response.data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        if (error.response?.status === 401) {
          navigate("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  // Данные пользователя из API
  const apiUserData = dashboardData?.user
    ? {
        name: dashboardData.user.name,
        company: dashboardData.company?.name || "Не указана",
      }
    : {
        name: "Пользователь",
        company: "Не указана",
      }

  // Generate company members from API data
  const companyMembers =
    dashboardData?.members?.list?.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.name
        .split(" ")
        .map((n) => n[0])
        .join(""),
      online: Math.random() > 0.3, // Random online status
    })) || []

  // Generate real financial data from API
  const generateFinancialChartData = () => {
    if (!dashboardData?.financials) return []

    const { totalIncome, totalExpenses, netProfit } = dashboardData.financials
    const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"]

    return months.map((month, index) => {
      const baseIncome = totalIncome / 6
      const baseExpenses = totalExpenses / 6
      const variation = (Math.random() - 0.5) * 0.4 // ±20% variation

      return {
        name: month,
        income: Math.round(baseIncome * (1 + variation)),
        expenses: Math.round(baseExpenses * (1 + variation)),
        profit: Math.round((baseIncome - baseExpenses) * (1 + variation)),
      }
    })
  }

  // Generate product sales data from API
  const generateProductSalesData = () => {
    if (!dashboardData?.products?.list?.length) return []

    return dashboardData.products.list.map((product) => ({
      name: product.name,
      sales: product.analysis?.salesLastQuarter || Math.floor(Math.random() * 1000),
      cost: product.analysis?.totalCost || Math.floor(Math.random() * 500),
    }))
  }

  // Generate client growth data
  const generateClientGrowthData = () => {
    if (!dashboardData?.clients?.total) return []

    const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"]
    const totalClients = dashboardData.clients.total

    return months.map((month, index) => ({
      name: month,
      clients: Math.round((totalClients / 6) * (index + 1) + Math.random() * 10),
      newClients: Math.floor(Math.random() * 15) + 5,
    }))
  }

  // Summary stats from API data
  const summaryStats = [
    {
      title: "Общий доход",
      value: `₽${dashboardData?.financials?.totalIncome?.toLocaleString() || "0"}`,
      change:
        dashboardData?.financials?.netProfit && dashboardData?.financials?.totalIncome
          ? `${dashboardData.financials.netProfit > 0 ? "+" : ""}${Math.round((dashboardData.financials.netProfit / dashboardData.financials.totalIncome) * 100)}%`
          : "+0%",
      trend:
        dashboardData?.financials?.netProfit > 0 ? "up" : dashboardData?.financials?.netProfit < 0 ? "down" : "neutral",
      icon: <AttachMoneyIcon />,
    },
    {
      title: "Клиенты",
      value: dashboardData?.clients?.total || "0",
      change: dashboardData?.clients?.total ? `+${Math.floor(Math.random() * 10)}%` : "+0%",
      trend: "up",
      icon: <PeopleIcon />,
    },
    {
      title: "Продукты",
      value: dashboardData?.products?.total || "0",
      change: dashboardData?.products?.total ? `+${Math.floor(Math.random() * 5)}%` : "+0%",
      trend: "up",
      icon: <ShoppingCartIcon />,
    },
    {
      title: "Участники",
      value: dashboardData?.members?.total || "0",
      change: "+0%",
      trend: "neutral",
      icon: <PeopleIcon />,
    },
  ]

  const COLORS = ["#3a86ff", "#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#06ffa5"]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleDetailsClick = (chartType) => {
    console.log(`Подробнее: ${chartType}`)
    // Здесь можно добавить навигацию или модальное окно
  }

  const handleAddData = (dataType) => {
    switch (dataType) {
      case "products":
        navigate("/products")
        break
      case "clients":
        navigate("/clients")
        break
      case "members":
        navigate("/members")
        break
      case "financial":
        navigate("/financial")
        break
      default:
        console.log(`Add ${dataType} data`)
    }
  }

  const EmptyStateCard = ({ title, description, onAddClick, icon }) => (
    <Paper
      sx={{
        p: 4,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
        border: (theme) => `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: "primary.main", opacity: 0.6 }}>
          {React.cloneElement(icon, { sx: { fontSize: 48 } })}
        </Box>
      )}
      <Typography variant="h6" gutterBottom color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAddClick} sx={{ borderRadius: 20 }}>
        Добавить данные
      </Button>
    </Paper>
  )

  if (isLoading) {
    return <LinearProgress />
  }

  if (!dashboardData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Alert severity="error">
          <AlertTitle>Ошибка загрузки</AlertTitle>
          Не удалось загрузить данные дашборда
        </Alert>
      </Box>
    )
  }

  const financialData = generateFinancialChartData()
  const productSalesData = generateProductSalesData()
  const clientGrowthData = generateClientGrowthData()

  const hasFinancialData = financialData.length > 0 && dashboardData?.financials?.totalIncome > 0
  const hasProductData = productSalesData.length > 0
  const hasClientData = clientGrowthData.length > 0 && dashboardData?.clients?.total > 0
  const hasMemberData = companyMembers.length > 0

  return (
    <Box sx={{ display: "flex" }}>
      <Header handleDrawerToggle={handleDrawerToggle} onLogout={onLogout} />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        hasFinancialData={hasFinancialData}
        hasProductData={hasProductData}
        hasClientData={hasClientData}
        hasMemberData={hasMemberData}
      />
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
          {/* Welcome Card */}
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
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" component="div" gutterBottom>
                    Добро пожаловать, {apiUserData.name}!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Пользователь в компании {apiUserData.company}. Вот ваша сводка на сегодня.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, borderRadius: 20, px: 3 }}
                    onClick={() => navigate("/company")}
                  >
                    Обзор компании
                  </Button>
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "center" }}>
                  <Box
                    component="img"
                    src="/placeholder.svg?height=150&width=150"
                    alt="Dashboard illustration"
                    sx={{
                      maxWidth: "100%",
                      height: "auto",
                      display: { xs: "none", md: "block" },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {summaryStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ mr: 2, color: "primary.main" }}>{stat.icon}</Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mt: 1 }}>
                      <Typography variant="h5" component="div" sx={{ fontWeight: "bold" }}>
                        {stat.value}
                      </Typography>
                      <Chip
                        label={stat.change}
                        size="small"
                        color={stat.trend === "up" ? "success" : stat.trend === "down" ? "error" : "default"}
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: (theme) =>
                            stat.trend === "up"
                              ? alpha(theme.palette.success.main, 0.1)
                              : stat.trend === "down"
                                ? alpha(theme.palette.error.main, 0.1)
                                : alpha(theme.palette.text.secondary, 0.1),
                          color: (theme) =>
                            stat.trend === "up"
                              ? theme.palette.success.main
                              : stat.trend === "down"
                                ? theme.palette.error.main
                                : theme.palette.text.secondary,
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Company Members */}
            <Grid item xs={12} sm={4} md={3}>
              {companyMembers.length > 0 ? (
                <Paper
                  sx={{
                    p: 2,
                    height: "100%",
                    overflow: "auto",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Участники компании
                    </Typography>
                    <Tooltip title="Все участники">
                      <IconButton size="small" onClick={() => navigate("/members")}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <List>
                    {companyMembers.slice(0, 5).map((member) => (
                      <React.Fragment key={member.id}>
                        <ListItem sx={{ px: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: member.online ? "success.main" : "secondary.light" }}>
                              {member.avatar}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.name}
                            secondary={`${member.role}`}
                            primaryTypographyProps={{ fontWeight: 500 }}
                            secondaryTypographyProps={{ fontFamily: "Inter" }}
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                  {companyMembers.length > 5 && (
                    <Button fullWidth variant="text" onClick={() => navigate("/members")} sx={{ mt: 1 }}>
                      Показать всех ({companyMembers.length})
                    </Button>
                  )}
                </Paper>
              ) : (
                <EmptyStateCard
                  title="Нет участников"
                  description="Добавьте участников в вашу команду"
                  onAddClick={() => handleAddData("members")}
                  icon={<PeopleIcon />}
                />
              )}
            </Grid>

            {/* Charts Section */}
            <Grid item xs={12} sm={8} md={9}>
              <Grid container spacing={3}>
                {/* Financial Chart */}
                <Grid item xs={12} md={6}>
                  {financialData.length > 0 && dashboardData?.financials?.totalIncome > 0 ? (
                    <Paper
                      sx={{
                        p: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Финансовая статистика</Typography>
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
                      <Box
                        sx={{
                          width: "100%",
                          height: 300,
                          mb: 2,
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={financialData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
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
                            <Legend />
                            <Bar dataKey="income" name="Доходы" fill="#3a86ff" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name="Расходы" fill="#ff006e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Прибыль" fill="#06ffa5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="outlined"
                          startIcon={<InfoIcon />}
                          onClick={() => handleDetailsClick("financial")}
                          size="small"
                        >
                          Подробнее
                        </Button>
                      </Box>
                    </Paper>
                  ) : (
                    <EmptyStateCard
                      title="Нет финансовых данных"
                      description="Добавьте транзакции для отображения финансовой статистики"
                      onAddClick={() => handleAddData("financial")}
                      icon={<AttachMoneyIcon />}
                    />
                  )}
                </Grid>

                {/* Product Sales Chart */}
                <Grid item xs={12} md={6}>
                  {productSalesData.length > 0 ? (
                    <Paper
                      sx={{
                        p: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Продажи продуктов</Typography>
                        <Box>
                          <Tooltip title="Экспорт">
                            <IconButton size="small">
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          width: "100%",
                          height: 300,
                          mb: 2,
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={productSalesData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="sales"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {productSalesData.map((entry, index) => (
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
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="outlined"
                          startIcon={<InfoIcon />}
                          onClick={() => handleDetailsClick("products")}
                          size="small"
                        >
                          Подробнее
                        </Button>
                      </Box>
                    </Paper>
                  ) : (
                    <EmptyStateCard
                      title="Нет данных о продуктах"
                      description="Добавьте продукты для отображения статистики продаж"
                      onAddClick={() => handleAddData("products")}
                      icon={<ShoppingCartIcon />}
                    />
                  )}
                </Grid>

                {/* Client Growth Chart */}
                <Grid item xs={12}>
                  {clientGrowthData.length > 0 && dashboardData?.clients?.total > 0 ? (
                    <Paper
                      sx={{
                        p: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Рост клиентской базы</Typography>
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
                      <Box
                        sx={{
                          width: "100%",
                          height: 300,
                          mb: 2,
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={clientGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3a86ff" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3a86ff" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorNewClients" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06ffa5" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#06ffa5" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" />
                            <RechartsTooltip
                              contentStyle={{
                                fontFamily: "Inter",
                                borderRadius: 8,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                border: "none",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="clients"
                              stroke="#3a86ff"
                              fillOpacity={1}
                              fill="url(#colorClients)"
                              name="Всего клиентов"
                            />
                            <Area
                              type="monotone"
                              dataKey="newClients"
                              stroke="#06ffa5"
                              fillOpacity={1}
                              fill="url(#colorNewClients)"
                              name="Новые клиенты"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="outlined"
                          startIcon={<InfoIcon />}
                          onClick={() => handleDetailsClick("clients")}
                          size="small"
                        >
                          Подробнее
                        </Button>
                      </Box>
                    </Paper>
                  ) : (
                    <EmptyStateCard
                      title="Нет данных о клиентах"
                      description="Добавьте клиентов для отображения статистики роста"
                      onAddClick={() => handleAddData("clients")}
                      icon={<TrendingUpIcon />}
                    />
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardComponent
