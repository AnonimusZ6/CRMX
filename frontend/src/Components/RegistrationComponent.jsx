"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  CssBaseline,
  Avatar,
} from "@mui/material"
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockOutlined as LockOutlinedIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useTheme } from "../context/ThemeContext"

const RegistrationComponent = () => {
  const navigate = useNavigate()
  const { mode } = useTheme()
  const [activeStep, setActiveStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    // User details
    name: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    userType: "user", // Changed default to "user" to match API

    // Company details
    companyName: "",
    shortDescription: "",
    fullDescription: "",
    address: "",
    location: "",
    phoneNumber: "",
    corporateEmail: "",
  })

  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    companyName: "",
    shortDescription: "",
    fullDescription: "",
    address: "",
    location: "",
    phoneNumber: "",
    corporateEmail: "",
  })

  // Create theme based on current mode
  const theme = createTheme({
    palette: {
      mode: mode,
      ...(mode === "light"
        ? {
            // Light mode palette
            primary: {
              main: "#1976d2",
            },
            secondary: {
              main: "#dc004e",
            },
            background: {
              default: "#f5f5f5",
              paper: "#ffffff",
            },
          }
        : {
            // Dark mode palette
            primary: {
              main: "#90caf9",
            },
            secondary: {
              main: "#f48fb1",
            },
            background: {
              default: "#121212",
              paper: "#1e1e1e",
            },
          }),
    },
  })

  const steps = ["Личная информация", "Информация о компании", "Завершение"]

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

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const validateStep = (step) => {
    let isValid = true
    const newErrors = { ...errors }

    if (step === 0) {
      // Validate personal information
      if (!formData.name.trim()) {
        newErrors.name = "Имя обязательно"
        isValid = false
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = "Фамилия обязательна"
        isValid = false
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!formData.email.trim()) {
        newErrors.email = "Email обязателен"
        isValid = false
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Введите корректный email"
        isValid = false
      }

      if (!formData.password.trim()) {
        newErrors.password = "Пароль обязателен"
        isValid = false
      } else if (formData.password.length < 8) {
        newErrors.password = "Пароль должен содержать минимум 8 символов"
        isValid = false
      }

      const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        newErrors.phone = "Введите корректный номер телефона"
        isValid = false
      }
    } else if (step === 1 && formData.userType === "company") {
      // Validate company information
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Название компании обязательно"
        isValid = false
      }

      if (!formData.shortDescription.trim()) {
        newErrors.shortDescription = "Краткое описание обязательно"
        isValid = false
      } else if (formData.shortDescription.length > 100) {
        newErrors.shortDescription = "Краткое описание не должно превышать 100 символов"
        isValid = false
      }

      if (!formData.fullDescription.trim()) {
        newErrors.fullDescription = "Полное описание обязательно"
        isValid = false
      }

      if (!formData.address.trim()) {
        newErrors.address = "Адрес обязателен"
        isValid = false
      }

      if (!formData.location.trim()) {
        newErrors.location = "Местоположение обязательно"
        isValid = false
      }

      const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Телефон компании обязателен"
        isValid = false
      } else if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Введите корректный номер телефона"
        isValid = false
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!formData.corporateEmail.trim()) {
        newErrors.corporateEmail = "Корпоративный email обязателен"
        isValid = false
      } else if (!emailRegex.test(formData.corporateEmail)) {
        newErrors.corporateEmail = "Введите корректный email"
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (activeStep === steps.length - 1) {
      setIsLoading(true)
      setError("")

      try {
        // Format the data according to the API requirements
        const requestData = {
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          city: formData.city,
          userType: "owner",
        }

        // Add company data if user type is company
        if (formData.userType === "company") {
          requestData.company = {
            name: formData.companyName,
            shortDescription: formData.shortDescription,
            fullDescription: formData.fullDescription,
            address: formData.address,
            location: formData.location,
            phoneNumber: formData.phoneNumber,
            corporateEmail: formData.corporateEmail,
          }
        }

        // Make the API request
        const response = await axios.post("http://localhost:5000/api/auth/register", requestData)

        console.log("Регистрация успешна:", response.data)

        // Show success message
        setError("")

        // Redirect to login page
        setTimeout(() => {
          navigate("/login")
        }, 1500)
      } catch (err) {
        console.error("Ошибка регистрации:", err)

        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          setError(err.response.data.message || "Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.")
        } else if (err.request) {
          // The request was made but no response was received
          setError("Сервер не отвечает. Пожалуйста, проверьте подключение к интернету и попробуйте снова.")
        } else {
          // Something happened in setting up the request that triggered an Error
          setError("Произошла ошибка при отправке запроса. Пожалуйста, попробуйте снова.")
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      handleNext()
    }
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
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
              <TextField
                fullWidth
                required
                label="Пароль"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
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
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="user-type-label">Тип пользователя</InputLabel>
                <Select
                  labelId="user-type-label"
                  name="userType"
                  value={formData.userType}
                  label="Тип пользователя"
                  onChange={handleChange}
                >
                  <MenuItem value="user">Пользователь</MenuItem>
                  <MenuItem value="company">Компания</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.userType === "company"
                    ? "Вы сможете создать компанию на следующем шаге"
                    : "Вы сможете присоединиться к существующей компании после регистрации"}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        )
      case 1:
        return formData.userType === "company" ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Название компании"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                error={!!errors.companyName}
                helperText={errors.companyName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Полное описание"
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleChange}
                error={!!errors.fullDescription}
                helperText={errors.fullDescription}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Адрес"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
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
                label="Телефон компании"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
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
                label="Корпоративный email"
                name="corporateEmail"
                type="email"
                value={formData.corporateEmail}
                onChange={handleChange}
                error={!!errors.corporateEmail}
                helperText={errors.corporateEmail}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Вы выбрали регистрацию как пользователь
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              После регистрации вы сможете присоединиться к существующей компании или создать новую.
            </Typography>
            <Button variant="contained" color="primary" onClick={handleNext}>
              Продолжить
            </Button>
          </Box>
        )
      case 2:
        return (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Проверьте введенные данные
            </Typography>
            <Typography variant="body1" paragraph>
              Имя: {formData.name} {formData.lastName}
            </Typography>
            <Typography variant="body1" paragraph>
              Email: {formData.email}
            </Typography>
            <Typography variant="body1" paragraph>
              Телефон: {formData.phone || "Не указан"}
            </Typography>
            <Typography variant="body1" paragraph>
              Город: {formData.city || "Не указан"}
            </Typography>
            <Typography variant="body1" paragraph>
              Тип пользователя: {formData.userType === "company" ? "Компания" : "Пользователь"}
            </Typography>
            {formData.userType === "company" && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Информация о компании
                </Typography>
                <Typography variant="body1" paragraph>
                  Название: {formData.companyName}
                </Typography>
                <Typography variant="body1" paragraph>
                  Краткое описание: {formData.shortDescription}
                </Typography>
                <Typography variant="body1" paragraph>
                  Адрес: {formData.address}
                </Typography>
                <Typography variant="body1" paragraph>
                  Местоположение: {formData.location}
                </Typography>
                <Typography variant="body1" paragraph>
                  Телефон компании: {formData.phoneNumber}
                </Typography>
                <Typography variant="body1" paragraph>
                  Корпоративный email: {formData.corporateEmail}
                </Typography>
              </>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )
      default:
        return "Неизвестный шаг"
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="md">
        <CssBaseline />
        <Paper
          elevation={3}
          sx={{
            mt: 8,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Регистрация
          </Typography>

          <Box sx={{ width: "100%", mt: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
              {getStepContent(activeStep)}

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button disabled={activeStep === 0 || isLoading} onClick={handleBack} startIcon={<ArrowBackIcon />}>
                  Назад
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={isLoading}
                  endIcon={activeStep === steps.length - 1 ? null : <ArrowForwardIcon />}
                >
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : activeStep === steps.length - 1 ? (
                    "Зарегистрироваться"
                  ) : (
                    "Далее"
                  )}
                </Button>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2">
              Уже есть аккаунт?{" "}
              <Link to="/login" style={{ textDecoration: "none", color: theme.palette.primary.main }}>
                Войти
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  )
}

export default RegistrationComponent
