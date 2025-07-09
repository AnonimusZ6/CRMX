"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Tooltip,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  FormControl,
  Select,
  ListItemIcon, // Added ListItemIcon import
} from "@mui/material"
import { alpha, styled } from "@mui/material/styles"
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Logout as LogoutIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"
import { useTheme } from "../context/ThemeContext"

// Styled components for modern UI
const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(3),
    width: "auto",
  },
}))

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}))

const drawerWidth = 260

const Header = ({ handleDrawerToggle, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { mode, toggleTheme } = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null)
  const [timeRange, setTimeRange] = useState("month")

  // Mock user data
  const userData = {
    name: "Иван Петров",
    email: "ivan.petrov@example.com",
    company: "ТехноИнновации ООО",
    role: "Директор",
  }

  // Mock notifications
  const notifications = [
    { id: 1, message: "Новый заказ от клиента ООО 'Технопром'", time: "10 мин назад", read: false },
    { id: 2, message: "Елена Смирнова обновила отчет по маркетингу", time: "1 час назад", read: false },
    { id: 3, message: "Плановое обслуживание системы в 22:00", time: "3 часа назад", read: true },
  ]

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null)
  }

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value)
  }

  const handleLogoutClick = () => {
    onLogout()
    navigate("/login")
  }

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const path = location.pathname
    let breadcrumbs = []

    if (path === "/dashboard") {
      breadcrumbs = [
        { label: "Главная", icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />, path: "/" },
        { label: "Панель управления", icon: <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />, path: "/dashboard" },
      ]
    } else if (path === "/company") {
      breadcrumbs = [
        { label: "Главная", icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />, path: "/" },
        { label: "Компания", icon: <BusinessIcon sx={{ mr: 0.5 }} fontSize="inherit" />, path: "/company" },
      ]
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backdropFilter: "blur(10px)",
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8),
        color: (theme) => theme.palette.text.primary,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1

            return isLast ? (
              <Typography key={crumb.path} color="text.primary" sx={{ display: "flex", alignItems: "center" }}>
                {crumb.icon}
                {crumb.label}
              </Typography>
            ) : (
              <MuiLink
                key={crumb.path}
                underline="hover"
                sx={{ display: "flex", alignItems: "center" }}
                color="inherit"
                href={crumb.path}
              >
                {crumb.icon}
                {crumb.label}
              </MuiLink>
            )
          })}
        </Breadcrumbs>

        <Search sx={{ display: { xs: "none", md: "flex" } }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase placeholder="Поиск..." inputProps={{ "aria-label": "search" }} />
        </Search>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FormControl variant="outlined" size="small" sx={{ m: 1, minWidth: 120 }}>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              displayEmpty
              inputProps={{ "aria-label": "time range" }}
              sx={{ height: 40 }}
            >
              <MenuItem value="week">Неделя</MenuItem>
              <MenuItem value="month">Месяц</MenuItem>
              <MenuItem value="quarter">Квартал</MenuItem>
              <MenuItem value="year">Год</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Обновить данные">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Уведомления">
            <IconButton
              color="inherit"
              onClick={handleNotificationClick}
              aria-controls={Boolean(notificationAnchorEl) ? "notification-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(notificationAnchorEl) ? "true" : undefined}
            >
              <Badge badgeContent={notifications.filter((n) => !n.read).length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            id="notification-menu"
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            MenuListProps={{
              "aria-labelledby": "notification-button",
            }}
            PaperProps={{
              elevation: 3,
              sx: {
                width: 320,
                maxHeight: 400,
                overflow: "auto",
                borderRadius: 2,
                mt: 1.5,
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 600 }}>
              Уведомления
            </Typography>
            <Divider />
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={handleNotificationClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: notification.read ? "none" : `4px solid ${alpha("#3a86ff", 0.8)}`,
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
              <Button size="small">Показать все</Button>
            </Box>
          </Menu>

          <Tooltip title={mode === "light" ? "Темная тема" : "Светлая тема"}>
            <IconButton color="inherit" onClick={toggleTheme} aria-label="toggle theme" sx={{ ml: 1 }}>
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Профиль пользователя">
            <IconButton
              onClick={handleMenuClick}
              size="small"
              aria-controls={Boolean(anchorEl) ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>{userData.name.charAt(0)}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
                mt: 1.5,
                borderRadius: 2,
                minWidth: 180,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={() => navigate("/profile")}>
              <Avatar /> Мой профиль
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <Avatar /> Настройки
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogoutClick}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Выйти
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
