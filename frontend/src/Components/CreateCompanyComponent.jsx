"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
  Alert,
  Snackbar,
  LinearProgress,
  FormHelperText,
} from "@mui/material"
import {
  Business as BusinessIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import Header from "./Header"
import Sidebar from "./Sidebar"

const CreateCompanyComponent = ({ onLogout }) => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    location: "",
    phone: "",
    email: "",
    fullDescription: "",
  })

  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    shortDescription: "",
    location: "",
    phone: "",
    email: "",
    fullDescription: "",
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
      newErrors.name = "Название компании обязательно"
      isValid = false
    } else if (formData.name.length < 3) {
      newErrors.name = "Название должно содержать минимум 3 символа"
      isValid = false
    }

    // Validate short description
    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = "Краткое описание обязательно"
      isValid = false
    } else if (formData.shortDescription.length > 100) {
      newErrors.shortDescription = "Краткое описание не должно превышать 100 символов"
      isValid = false
    }

    // Validate location
    if (!formData.location.trim()) {
      newErrors.location = "Местоположение обязательно"
      isValid = false
    }

    // Validate phone
    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/
    if (!formData.phone.trim()) {
      newErrors.phone = "Телефон обязателен"
      isValid = false
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Введите корректный номер телефона"
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

    // Validate full description
    if (!formData.fullDescription.trim()) {
      newErrors.fullDescription = "Полное описание обязательно"
      isValid = false
    } else if (formData.fullDescription.length < 50) {
      newErrors.fullDescription = "Полное описание должно содержать минимум 50 символов"
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("Создание компании:", formData)

      // Show success message
      setShowSuccess(true)

      // Reset form after successful submission
      setFormData({
        name: "",
        shortDescription: "",
        location: "",
        phone: "",
        email: "",
        fullDescription: "",
      })

      // Redirect to company page after a delay
      setTimeout(() => {
        navigate("/company")
      }, 2000)
    } catch (error) {
      console.error("Ошибка при создании компании:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate(-1) // Go back to previous page
  }

  const handleCloseSnackbar = () => {
    setShowSuccess(false)
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
              Создание новой компании
            </Typography>
          </Box>

          <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <BusinessIcon sx={{ mr: 1 }} /> Основная информация
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Company Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Название компании"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Short Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Краткое описание"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  error={!!errors.shortDescription}
                  helperText={errors.shortDescription || `${formData.shortDescription.length}/100 символов`}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Местоположение"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  error={!!errors.location}
                  helperText={errors.location}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
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

              <Grid item xs={12}>
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

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                  <DescriptionIcon sx={{ mr: 1 }} /> Подробное описание
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={6}
                  label="Полное описание компании"
                  name="fullDescription"
                  value={formData.fullDescription}
                  onChange={handleChange}
                  error={!!errors.fullDescription}
                  helperText={errors.fullDescription}
                />
                <FormHelperText>Опишите подробно деятельность компании, историю, миссию и ценности</FormHelperText>
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
                  Создать компанию
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
          Компания успешно создана! Перенаправление...
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CreateCompanyComponent
