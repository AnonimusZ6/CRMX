"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import DashboardComponent from "./Components/DashboardComponent"
import LoginComponent from "./Components/LoginComponent"
import CompanyPage from "./Components/CompamyPage"
import CreateCompanyComponent from "./Components/CreateCompanyComponent"
import ProfileComponent from "./Components/ProfileComponent"
import MembersComponent from "./Components/MembersComponent"
import AddEmployeeComponent from "./Components/AddEmployeeComponent"
import RegistrationComponent from "./Components/RegistrationComponent"
import CompanyInfoComponent from "./Components/CompanyInfoComponent"
import { ThemeProvider } from "./context/ThemeContext"
import ChatComponent from "./Components/ChatComponent"
import KanbanBoardComponent from "./Components/KanbanBoardComponent"
import FinancialComponent from "./Components/FinancialComponent"
import ProductsComponent from "./Components/ProductsComponent"
import ClientsComponent from "./Components/ClientsComponent"

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Проверяем токен при загрузке приложения
    const token = localStorage.getItem("authToken")
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    setIsAuthenticated(false)
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <DashboardComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/company"
            element={isAuthenticated ? <CompanyPage onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/company/create"
            element={
              isAuthenticated ? <CreateCompanyComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/company/info"
            element={
              isAuthenticated ? <CompanyInfoComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <ProfileComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
          {/* Members management routes */}
          <Route
            path="/members"
            element={isAuthenticated ? <MembersComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/members/add"
            element={
              isAuthenticated ? <AddEmployeeComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/chat"
            element={isAuthenticated ? <ChatComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/kanban"
            element={
              isAuthenticated ? <KanbanBoardComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/financial"
            element={
              isAuthenticated ? <FinancialComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/products"
            element={isAuthenticated ? <ProductsComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/clients"
            element={isAuthenticated ? <ClientsComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/members/edit/:id"
            element={
              isAuthenticated ? <AddEmployeeComponent onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginComponent onLogin={handleLogin} />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegistrationComponent />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App