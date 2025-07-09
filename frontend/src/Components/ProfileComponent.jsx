"use client"

import { useState, useEffect } from "react"
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
  Divider,
  Button,
  IconButton,
  TextField,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  LinearProgress,
  Alert,
  Snackbar,
} from "@mui/material"
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  VisibilityOff as VisibilityOffIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material"
import Header from "./Header"
import Sidebar from "./Sidebar"

const ProfileComponent = ({ onLogout }) => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [profileData, setProfileData] = useState(null)

  // Form state for editing
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    city: "",
  })

  // Validation state
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    productUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        })
        
        setProfileData(response.data)
        setFormData({
          firstName: response.data.user.name,
          lastName: response.data.user.lastName,
          email: response.data.user.email,
          phone: response.data.user.phone,
          position: response.data.user.position,
          department: response.data.user.department,
          city: response.data.user.city,
        })
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit mode
      setFormData({
        firstName: profileData.user.name,
        lastName: profileData.user.lastName,
        email: profileData.user.email,
        phone: profileData.user.phone,
        position: profileData.user.position,
        department: profileData.user.department,
        city: profileData.user.city,
      })
      setErrors({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      })
    }
    setEditMode(!editMode)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    })
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Имя обязательно"
      isValid = false
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Фамилия обязательна"
      isValid = false
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "Email обязателен"
      isValid = false
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Введите корректный email"
      isValid = false
    }

    // Validate phone
    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Введите корректный номер телефона"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', {
        name: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        city: formData.city,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      setProfileData({
        ...profileData,
        user: {
          ...profileData.user,
          name: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          city: formData.city,
        }
      })

      // Show success message
      setShowSuccess(true)

      // Exit edit mode
      setEditMode(false)
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setShowSuccess(false)
  }

  if (isLoading || !profileData) {
    return <LinearProgress />
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Header handleDrawerToggle={handleDrawerToggle} onLogout={onLogout} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
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
            maxWidth: "1200px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* Profile Header */}
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
                      width: 80,
                      height: 80,
                      bgcolor: "primary.main",
                      fontSize: "2rem",
                      fontWeight: "bold",
                    }}
                  >
                    {profileData.user.name.charAt(0)}
                    {profileData.user.lastName.charAt(0)}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h4" component="div" gutterBottom>
                    {profileData.user.name} {profileData.user.lastName}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {profileData.user.position} {profileData.company && `в ${profileData.company.name}`}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {profileData.company && (
                      <Chip
                        icon={<BusinessIcon fontSize="small" />}
                        label={profileData.company.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {profileData.user.department && (
                      <Chip
                        icon={<WorkIcon fontSize="small" />}
                        label={profileData.user.department}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {profileData.user.city && (
                      <Chip
                        icon={<LocationIcon fontSize="small" />}
                        label={profileData.user.city}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item>
                  <Button
                    variant={editMode ? "outlined" : "contained"}
                    color={editMode ? "secondary" : "primary"}
                    startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                    onClick={handleEditToggle}
                    sx={{ borderRadius: 2 }}
                  >
                    {editMode ? "Отменить" : "Редактировать"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
              <Tab icon={<PersonIcon />} label="Профиль" id="tab-0" />
              <Tab icon={<SecurityIcon />} label="Безопасность" id="tab-1" />
              <Tab icon={<NotificationsIcon />} label="Уведомления" id="tab-2" />
            </Tabs>
          </Box>

          {/* Profile Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon sx={{ mr: 1 }} /> Личная информация
                    </Typography>
                    {editMode && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSubmit}
                        sx={{ borderRadius: 2 }}
                      >
                        Сохранить
                      </Button>
                    )}
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <Box component={editMode ? "form" : "div"} onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      {/* First Name */}
                      <Grid item xs={12} sm={6}>
                        {editMode ? (
                          <TextField
                            fullWidth
                            required
                            label="Имя"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Имя
                            </Typography>
                            <Typography variant="body1">{profileData.user.name}</Typography>
                          </Box>
                        )}
                      </Grid>

                      {/* Last Name */}
                      <Grid item xs={12} sm={6}>
                        {editMode ? (
                          <TextField
                            fullWidth
                            required
                            label="Фамилия"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Фамилия
                            </Typography>
                            <Typography variant="body1">{profileData.user.lastName}</Typography>
                          </Box>
                        )}
                      </Grid>

                      {/* Email */}
                      <Grid item xs={12} sm={6}>
                        {editMode ? (
                          <TextField
                            fullWidth
                            required
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!errors.email}
                            helperText={errors.email}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Email
                            </Typography>
                            <Typography variant="body1">{profileData.user.email}</Typography>
                          </Box>
                        )}
                      </Grid>

                      {/* Phone */}
                      <Grid item xs={12} sm={6}>
                        {editMode ? (
                          <TextField
                            fullWidth
                            label="Телефон"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={!!errors.phone}
                            helperText={errors.phone}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Телефон
                            </Typography>
                            <Typography variant="body1">{profileData.user.phone}</Typography>
                          </Box>
                        )}
                      </Grid>

                      {/* Position */}
                      <Grid item xs={12} sm={6}>
                        {editMode ? (
                          <TextField
                            fullWidth
                            label="Должность"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Должность
                            </Typography>
                            <Typography variant="body1">{profileData.user.position}</Typography>
                          </Box>
                        )}
                      </Grid>

                      {/* Department */}
                      <Grid item xs={12} sm={6}>
                        {editMode ? (
                          <TextField
                            fullWidth
                            label="Отдел"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Отдел
                            </Typography>
                            <Typography variant="body1">{profileData.user.department}</Typography>
                          </Box>
                        )}
                      </Grid>

                      {/* City */}
                      <Grid item xs={12} sm={6}>
                        {editMode ? (
                          <TextField
                            fullWidth
                            label="Город"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Город
                            </Typography>
                            <Typography variant="body1">{profileData.user.city}</Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                {profileData.company && (
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                      <BusinessIcon sx={{ mr: 1 }} /> Информация о компании
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <List disablePadding>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <BusinessIcon color="action" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Название"
                          secondary={profileData.company.name}
                          primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                          secondaryTypographyProps={{ variant: "body1" }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <WorkIcon color="action" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Роль"
                          secondary={profileData.company.role}
                          primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                          secondaryTypographyProps={{ variant: "body1" }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <EmailIcon color="action" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Корпоративный email"
                          secondary={profileData.company.corporateEmail}
                          primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                          secondaryTypographyProps={{ variant: "body1" }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <PhoneIcon color="action" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Телефон компании"
                          secondary={profileData.company.phoneNumber}
                          primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                          secondaryTypographyProps={{ variant: "body1" }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <LocationIcon color="action" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Адрес"
                          secondary={profileData.company.address}
                          primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                          secondaryTypographyProps={{ variant: "body1" }}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                )}

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                    <SecurityIcon sx={{ mr: 1 }} /> Быстрые действия
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={() => setTabValue(1)}
                      sx={{ justifyContent: "flex-start", textAlign: "left" }}
                    >
                      Изменить пароль
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={() => setTabValue(2)}
                      sx={{ justifyContent: "flex-start", textAlign: "left" }}
                    >
                      Настройки уведомлений
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={onLogout}
                      sx={{ justifyContent: "flex-start", textAlign: "left" }}
                    >
                      Выйти из системы
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Security Tab */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <SecurityIcon sx={{ mr: 1 }} /> Безопасность
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Изменить пароль
                  </Typography>
                  <Box component="form" sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Текущий пароль"
                      type="password"
                      name="currentPassword"
                      InputProps={{
                        endAdornment: (
                          <IconButton edge="end">
                            <VisibilityOffIcon />
                          </IconButton>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Новый пароль"
                      type="password"
                      name="newPassword"
                      InputProps={{
                        endAdornment: (
                          <IconButton edge="end">
                            <VisibilityOffIcon />
                          </IconButton>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Подтвердите новый пароль"
                      type="password"
                      name="confirmPassword"
                      InputProps={{
                        endAdornment: (
                          <IconButton edge="end">
                            <VisibilityOffIcon />
                          </IconButton>
                        ),
                      }}
                    />
                    <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                      Обновить пароль
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Двухфакторная аутентификация
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="subtitle2">Двухфакторная аутентификация</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Добавьте дополнительный уровень безопасности
                          </Typography>
                        </Box>
                        <Switch />
                      </Box>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="subtitle2">Уведомления о входе</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Получайте уведомления о входе в аккаунт
                          </Typography>
                        </Box>
                        <Switch defaultChecked />
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Notifications Tab */}
          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <NotificationsIcon sx={{ mr: 1 }} /> Настройки уведомлений
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <List>
                <ListItem>
                  <ListItemText primary="Email уведомления" secondary="Получать уведомления по электронной почте" />
                  <Switch
                    edge="end"
                    checked={notificationSettings.emailNotifications}
                    onChange={() => handleNotificationChange("emailNotifications")}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemText primary="SMS уведомления" secondary="Получать уведомления по SMS" />
                  <Switch
                    edge="end"
                    checked={notificationSettings.smsNotifications}
                    onChange={() => handleNotificationChange("smsNotifications")}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemText
                    primary="Обновления продуктов"
                    secondary="Уведомления о новых продуктах и обновлениях"
                  />
                  <Switch
                    edge="end"
                    checked={notificationSettings.productUpdates}
                    onChange={() => handleNotificationChange("productUpdates")}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemText
                    primary="Оповещения безопасности"
                    secondary="Важные уведомления о безопасности аккаунта"
                  />
                  <Switch
                    edge="end"
                    checked={notificationSettings.securityAlerts}
                    onChange={() => handleNotificationChange("securityAlerts")}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemText primary="Маркетинговые рассылки" secondary="Новости, акции и специальные предложения" />
                  <Switch
                    edge="end"
                    checked={notificationSettings.marketingEmails}
                    onChange={() => handleNotificationChange("marketingEmails")}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary">
                  Сохранить настройки
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          Профиль успешно обновлен!
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProfileComponent