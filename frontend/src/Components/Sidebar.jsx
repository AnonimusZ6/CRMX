"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  Collapse,
  Drawer,
  CircularProgress,
  Badge,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  Person as ProfileIcon,
  Business as CompanyIcon,
  Group as MembersIcon,
  Inventory as ProductsIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Chat as ChatIcon,
  AttachMoney as TransactionsIcon,
  People as ClientsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  ShoppingCartCheckout as ShoppingCartCheckoutIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material"

const drawerWidth = 260

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate()
  const [openMenuItems, setOpenMenuItems] = useState({
    dashboard: true,
    analytics: false,
    management: false,
    quickActions: false,
  })
  const [userData, setUserData] = useState(null)
  const [companyData, setCompanyData] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Check if data exists for showing quick actions
  const hasData =
    dashboardData &&
    (dashboardData.clients?.total > 0 ||
      dashboardData.products?.total > 0 ||
      dashboardData.financials?.totalIncome > 0 ||
      dashboardData.financials?.totalExpenses > 0)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("token")
        if (!token) {
          // Try to get data from localStorage as fallback
          const user = JSON.parse(localStorage.getItem("user") || "{}")
          const company = JSON.parse(localStorage.getItem("selectedCompany") || "{}")

          if (user.id) {
            setUserData({
              name: user.username || `${user.name} ${user.lastName}`,
              email: user.email,
              role: user.userType === "director" ? "Директор" : "Пользователь",
            })
            setCompanyData(company)
            setLoading(false)
            return
          }

          throw new Error("No authentication token found")
        }

        // Fetch profile data
        const response = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const { user, company } = response.data
        setUserData({
          name: `${user.name} ${user.lastName}`,
          email: user.email,
          role: company.role || "Пользователь",
        })
        setCompanyData(company)

        // Fetch dashboard data to determine if quick actions should be shown
        try {
          const dashboardResponse = await axios.get("http://localhost:5000/api/dashboard", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          setDashboardData(dashboardResponse.data)
        } catch (dashboardError) {
          console.warn("Could not fetch dashboard data:", dashboardError.message)
          setDashboardData(null)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching profile data:", error)

        // Fallback to localStorage
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}")
          const company = JSON.parse(localStorage.getItem("selectedCompany") || "{}")

          if (user.id) {
            setUserData({
              name: user.username || `${user.name || ""} ${user.lastName || ""}`.trim(),
              email: user.email,
              role: user.userType === "director" ? "Директор" : "Пользователь",
            })
            setCompanyData(company)
          }
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError)
          setError("Ошибка загрузки данных")
        }

        setLoading(false)
        if (error.response && error.response.status === 401) {
          navigate("/login")
        }
      }
    }

    fetchProfileData()
  }, [navigate])

  const handleMenuItemToggle = (item) => {
    setOpenMenuItems({
      ...openMenuItems,
      [item]: !openMenuItems[item],
    })
  }

  const handleNavigation = (path) => {
    navigate(path)
    if (mobileOpen) {
      handleDrawerToggle()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    localStorage.removeItem("selectedCompany")
    navigate("/login")
  }

  const drawer = (
    <div>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
          {loading ? "Загрузка..." : companyData?.name || "CRM Система"}
        </Typography>
      </Box>
      <Divider />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", mr: 2 }}>
                {userData?.name?.charAt(0) || "U"}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {userData?.name || "Пользователь"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userData?.role || "Роль не указана"}
                </Typography>
              </Box>
              <Tooltip title="Уведомления">
                <IconButton size="small">
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
            {companyData?.location && (
              <Chip label={companyData.location} size="small" variant="outlined" sx={{ mb: 1 }} />
            )}
          </Box>
          <Divider />
        </>
      )}

      <List sx={{ px: 2, py: 1 }}>
        {/* Dashboard Section */}
        <ListItemButton onClick={() => handleMenuItemToggle("dashboard")}>
          <ListItemText primary="Дашборд" primaryTypographyProps={{ fontWeight: 500 }} />
          {openMenuItems.dashboard ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
        <Collapse in={openMenuItems.dashboard} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }} onClick={() => handleNavigation("/dashboard")}>
              <ListItemText primary="Обзор" />
              <DashboardIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} onClick={() => handleNavigation("/financial")}>
              <ListItemText primary="Финансы" />
              <TrendingUpIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Quick Actions Section - Only show if data exists */}
        {hasData && (
          <>
            <ListItemButton onClick={() => handleMenuItemToggle("quickActions")}>
              <ListItemText primary="Быстрые действия" primaryTypographyProps={{ fontWeight: 500 }} />
              <Chip label="Новое" size="small" color="success" variant="outlined" sx={{ mr: 1 }} />
              {openMenuItems.quickActions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={openMenuItems.quickActions} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4, bgcolor: "action.hover", borderRadius: 1, mx: 1, mb: 0.5 }}
                  onClick={() => handleNavigation("/clients")}
                >
                  <PersonAddIcon fontSize="small" sx={{ mr: 2, color: "primary.main" }} />
                  <ListItemText
                    primary="Добавить клиентов"
                    primaryTypographyProps={{ fontWeight: 500, color: "primary.main" }}
                  />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4, bgcolor: "action.hover", borderRadius: 1, mx: 1, mb: 0.5 }}
                  onClick={() => handleNavigation("/products")}
                >
                  <ShoppingCartCheckoutIcon fontSize="small" sx={{ mr: 2, color: "secondary.main" }} />
                  <ListItemText
                    primary="Добавить продукт"
                    primaryTypographyProps={{ fontWeight: 500, color: "secondary.main" }}
                  />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 4, bgcolor: "action.hover", borderRadius: 1, mx: 1, mb: 0.5 }}
                  onClick={() => handleNavigation("/financial")}
                >
                  <AccountBalanceIcon fontSize="small" sx={{ mr: 2, color: "success.main" }} />
                  <ListItemText
                    primary="Добавить транзакции"
                    primaryTypographyProps={{ fontWeight: 500, color: "success.main" }}
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}

        {/* Management Section */}
        <ListItemButton onClick={() => handleMenuItemToggle("management")}>
          <ListItemText primary="Управление" primaryTypographyProps={{ fontWeight: 500 }} />
          {openMenuItems.management ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
        <Collapse in={openMenuItems.management} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }} onClick={() => handleNavigation("/clients")}>
              <ListItemText primary="Клиенты" />
              <ClientsIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} onClick={() => handleNavigation("/products")}>
              <ListItemText primary="Продукция" />
              <ProductsIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} onClick={() => handleNavigation("/financial")}>
              <ListItemText primary="Транзакции" />
              <TransactionsIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} onClick={() => handleNavigation("/members")}>
              <ListItemText primary="Участники" />
              <MembersIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Analytics Section */}
        <ListItemButton onClick={() => handleMenuItemToggle("analytics")}>
          <ListItemText primary="Аналитика" primaryTypographyProps={{ fontWeight: 500 }} />
          {openMenuItems.analytics ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
        <Collapse in={openMenuItems.analytics} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }} onClick={() => handleNavigation("/reports")}>
              <ListItemText primary="Отчеты" />
              <ReportsIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemText primary="Статистика" />
              <InfoIcon fontSize="small" sx={{ ml: 1 }} />
            </ListItemButton>
          </List>
        </Collapse>

        <Divider sx={{ my: 1 }} />

        {/* Chat - Highlighted */}
        <ListItemButton
          onClick={() => handleNavigation("/chat")}
          selected={window.location.pathname === "/chat"}
          sx={{
            bgcolor: window.location.pathname === "/chat" ? "primary.light" : "transparent",
            "&:hover": { bgcolor: "primary.light" },
            borderRadius: 1,
            mx: 1,
          }}
        >
          <Badge badgeContent={unreadMessages} color="error">
            <ChatIcon fontSize="small" sx={{ mr: 2 }} />
          </Badge>
          <ListItemText primary="Чат" primaryTypographyProps={{ fontWeight: 500 }} />
          <Chip label="Новое" size="small" color="success" variant="outlined" />
        </ListItemButton>

        {/* Kanban Board - Highlighted */}
        <ListItemButton
          onClick={() => handleNavigation("/kanban")}
          selected={window.location.pathname === "/kanban"}
          sx={{
            bgcolor: window.location.pathname === "/kanban" ? "primary.light" : "transparent",
            "&:hover": { bgcolor: "primary.light" },
            borderRadius: 1,
            mx: 1,
          }}
        >
          <AssignmentIcon fontSize="small" sx={{ mr: 2 }} />
          <ListItemText primary="Список дел" primaryTypographyProps={{ fontWeight: 500 }} />
          <Chip label="Задачи" size="small" color="info" variant="outlined" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Direct Navigation Items */}
        <ListItemButton onClick={() => handleNavigation("/profile")} selected={window.location.pathname === "/profile"}>
          <ProfileIcon fontSize="small" sx={{ mr: 2 }} />
          <ListItemText primary="Профиль" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItemButton>

        <ListItemButton onClick={() => handleNavigation("/company")} selected={window.location.pathname === "/company"}>
          <CompanyIcon fontSize="small" sx={{ mr: 2 }} />
          <ListItemText primary="Компания" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItemButton>

        <ListItemButton
          onClick={() => handleNavigation("/settings")}
          selected={window.location.pathname === "/settings"}
        >
          <SettingsIcon fontSize="small" sx={{ mr: 2 }} />
          <ListItemText primary="Настройки" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItemButton>
      </List>

      {/* Footer with Logout */}
      <Box sx={{ mt: "auto", p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            "&:hover": { bgcolor: "error.light", color: "error.contrastText" },
          }}
        >
          <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
          <ListItemText primary="Выйти" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItemButton>
      </Box>
    </div>
  )

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="mailbox folders">
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            position: "fixed",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}

export default Sidebar
