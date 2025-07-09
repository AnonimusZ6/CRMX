"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Snackbar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material"
import Header from "./Header"
import Sidebar from "./Sidebar"

const AddEmployeeComponent = ({ onLogout }) => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tempPassword, setTempPassword] = useState("")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    role: "member", // Changed default to "member" to match API
    phone: "",
    city: "",
    position: "",
    department: "",
  })

  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
  })

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
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

  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Имя обязательно"
      isValid = false
    }

    // Validate lastName
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

    // Validate position
    if (!formData.position.trim()) {
      newErrors.position = "Должность обязательна"
      isValid = false
    }

    // Validate department
    if (!formData.department.trim()) {
      newErrors.department = "Отдел обязателен"
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
    setError("")

    try {
      // Get company ID from localStorage
      const companyId = localStorage.getItem("companyId") || "1" // Default to 1 if not found

      // Format request data according to API requirements
      const requestData = {
        email: formData.email,
        role: formData.role,
        name: formData.name,
        lastName: formData.lastName,
        phone: formData.phone || "",
        city: formData.city || "",
        position: formData.position,
        department: formData.department,
      }

      // Make API request
      const response = await axios.post(`http://localhost:5000/api/companies/${companyId}/members`, requestData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      console.log("Сотрудник успешно добавлен:", response.data)

      // Store the temporary password
      if (response.data && response.data.user && response.data.user.password) {
        setTempPassword(response.data.user.password)
        setPasswordDialogOpen(true)
      }

      // Show success message
      setShowSuccess(true)

      // Reset form after successful submission
      setFormData({
        name: "",
        lastName: "",
        email: "",
        role: "member",
        phone: "",
        city: "",
        position: "",
        department: "",
      })
    } catch (error) {
      console.error("Ошибка при добавлении сотрудника:", error)

      if (error.response) {
        setError(error.response.data.message || "Произошла ошибка при добавлении сотрудника")
      } else if (error.request) {
        setError("Сервер не отвечает. Пожалуйста, проверьте подключение к интернету.")
      } else {
        setError("Произошла ошибка при отправке запроса")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate("/members")
  }

  const handleCloseSnackbar = () => {
    setShowSuccess(false)
  }

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false)
    // Redirect to members page after closing the dialog
    navigate("/members")
  }

  const handleCopyPassword = () => {
    navigator.clipboard
      .writeText(tempPassword)
      .then(() => {
        // Show a brief notification that password was copied
        alert("Пароль скопирован в буфер обмена")
      })
      .catch((err) => {
        console.error("Не удалось скопировать пароль:", err)
      })
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Header handleDrawerToggle={handleDrawerToggle} onLogout={onLogout} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} aria-labelledby="password-dialog-title">
        <DialogTitle id="password-dialog-title">Временный пароль для нового сотрудника</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Пожалуйста, сохраните этот временный пароль и передайте его новому сотруднику. Пароль потребуется для
            первого входа в систему.
          </DialogContentText>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontFamily: "monospace" }}>
              {tempPassword}
            </Typography>
            <IconButton onClick={handleCopyPassword} size="small" title="Копировать пароль">
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} color="primary" variant="contained">
            Закрыть
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
        {isLoading && <LinearProgress sx={{ width: "100%", position: "absolute", top: "64px", left: 0 }} />}

        <Box
          sx={{
            width: "100%",
            maxWidth: "1000px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Добавление нового сотрудника
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <PersonIcon sx={{ mr: 1 }} /> Личная информация
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Имя"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Фамилия"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={6}>
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Телефон"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Город"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Role */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Роль в системе</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={formData.role}
                    label="Роль в системе"
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <BadgeIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="member">Участник</MenuItem>
                    <MenuItem value="admin">Администратор</MenuItem>
                  </Select>
                  <FormHelperText>Администраторы имеют расширенный доступ к функциям системы</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                  <BusinessIcon sx={{ mr: 1 }} /> Информация о должности
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Position */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Должность"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  error={!!errors.position}
                  helperText={errors.position}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Department */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Отдел"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  error={!!errors.department}
                  helperText={errors.department}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
                <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={isLoading}>
                  Добавить сотрудника
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          Сотрудник успешно добавлен!
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default AddEmployeeComponent
