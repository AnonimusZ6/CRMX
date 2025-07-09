"use client"

import { createContext, useState, useContext, useEffect } from "react"

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  // Check if theme preference exists in localStorage, default to 'light'
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem("themeMode")
    return savedMode || "light"
  })

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem("themeMode", mode)
  }, [mode])

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"))
  }

  return <ThemeContext.Provider value={{ mode, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
