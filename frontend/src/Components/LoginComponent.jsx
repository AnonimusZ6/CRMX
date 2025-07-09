"use client"

import React from "react"

import { useState } from "react"
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CssBaseline,
  Avatar,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material"
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

const LoginPage = ({ onLogin }) => {
  const redirect = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { mode, toggleTheme } = useTheme()

  // Create theme based on current mode
  const theme = React.useMemo(
    () =>
      createTheme({
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
      }),
    [mode],
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      })

      console.log("Успешный вход:", response.data)

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token)
        localStorage.setItem("companyId", response.data.company.id)
      }
      onLogin()
      await redirect("/dashboard")
    } catch (err) {
      console.error("Ошибка входа:", err)

      if (err.code === "ERR_NETWORK") {
        setError("Не удалось подключиться к серверу. Проверьте его работу и CORS настройки.")
      } else {
        setError(err.response?.data?.message || "Неверный email или пароль")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MuiThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <IconButton onClick={toggleTheme} aria-label="toggle theme" sx={{ position: "absolute", right: 0, top: 0 }}>
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>

          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Вход в систему
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  color="primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label="Запомнить меня"
            />
            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2 }}>
              {loading ? <CircularProgress size={24} /> : "Войти"}
            </Button>
            <Box textAlign="center">
              <Link href="/register" variant="body2">
                Нет аккаунта? Зарегистрируйтесь
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </MuiThemeProvider>
  )
}

export default LoginPage
