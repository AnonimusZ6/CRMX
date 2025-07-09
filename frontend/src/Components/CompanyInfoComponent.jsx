"use client"

import { AlertTitle } from "@mui/material"

import { useState, useEffect } from "react"
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Badge,
} from "@mui/material"
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  CalendarToday as CalendarTodayIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material"
import Header from "./Header"
import Sidebar from "./Sidebar"

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

// Добавить функцию для форматирования даты в формат datetime-local
const formatDateForInput = (date) => {
  const d = new Date(date)
  // Формат YYYY-MM-DDThh:mm
  return d.toISOString().slice(0, 16)
}

const CompanyInfoComponent = ({ onLogout }) => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState("")

  // Client state
  const [clients, setClients] = useState([])
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    totalSpent: 0,
    lastPurchaseDate: new Date(),
  })
  const [clientErrors, setClientErrors] = useState({})
  const [clientsSaved, setClientsSaved] = useState(false)

  // Product state
  const [products, setProducts] = useState([])
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState({
    name: "",
    description: "",
    analysis: {
      totalCost: 0,
      salesLastQuarter: 0,
      technicalImplementation: "",
      scalability: "",
      mainFeatures: "",
    },
  })
  const [productErrors, setProductErrors] = useState({})
  const [productsSaved, setProductsSaved] = useState(false)

  // Transaction state
  const [transactions, setTransactions] = useState([])
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState({
    amount: 0,
    type: "income",
    description: "",
    date: new Date(),
    clientId: "",
    productId: "",
  })
  const [transactionErrors, setTransactionErrors] = useState({})

  // Workflow state
  const [activeStep, setActiveStep] = useState(0)
  const steps = ["Clients", "Products", "Transactions"]

  // Effect to update active step based on saved state
  useEffect(() => {
    if (clientsSaved && productsSaved) {
      setActiveStep(2)
    } else if (clientsSaved) {
      setActiveStep(1)
    } else {
      setActiveStep(0)
    }
  }, [clientsSaved, productsSaved])

  // Add these useEffect hooks after the existing useEffect for activeStep

  // Fetch clients, products, and transactions when component mounts
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true)
      setError("")

      try {
        const companyId = localStorage.getItem("companyId") || "1"
        const token = localStorage.getItem("authToken")

        // Fetch clients
        try {
          const clientsResponse = await axios.get(`http://localhost:5000/api/companies/${companyId}/clients`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (clientsResponse.data && Array.isArray(clientsResponse.data)) {
            // Transform API data to match our component's data structure
            const formattedClients = clientsResponse.data.map((client) => ({
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone || "",
              address: client.address || "",
              totalSpent: client.totalSpent || 0,
              lastPurchaseDate: new Date(client.lastPurchaseDate || new Date()),
            }))

            setClients(formattedClients)
            if (formattedClients.length > 0) {
              setClientsSaved(true)
            }
          }
        } catch (clientError) {
          console.error("Error fetching clients:", clientError)
          // Don't set the main error here, just log it
        }

        // Fetch products
        try {
          const productsResponse = await axios.get(`http://localhost:5000/api/companies/${companyId}/products`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (productsResponse.data && Array.isArray(productsResponse.data)) {
            // Transform API data to match our component's data structure
            const formattedProducts = productsResponse.data.map((product) => ({
              id: product.id,
              name: product.name,
              description: product.description || "",
              analysis: {
                totalCost: product.analysis?.totalCost || 0,
                salesLastQuarter: product.analysis?.salesLastQuarter || 0,
                technicalImplementation: product.analysis?.technicalImplementation || "",
                scalability: product.analysis?.scalability || "",
                mainFeatures: product.analysis?.mainFeatures || "",
              },
            }))

            setProducts(formattedProducts)
            if (formattedProducts.length > 0) {
              setProductsSaved(true)
            }
          }
        } catch (productError) {
          console.error("Error fetching products:", productError)
          // Don't set the main error here, just log it
        }

        // Fetch transactions
        try {
          const transactionsResponse = await axios.get(`http://localhost:5000/api/companies/${companyId}/transaction`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
            // Transform API data to match our component's data structure
            const formattedTransactions = transactionsResponse.data.map((transaction) => ({
              id: transaction.id,
              amount: transaction.amount || 0,
              type: transaction.type || "income",
              description: transaction.description || "",
              date: new Date(transaction.date || new Date()),
              clientId: transaction.clientId,
              productId: transaction.productId,
            }))

            setTransactions(formattedTransactions)
          }
        } catch (transactionError) {
          console.error("Error fetching transactions:", transactionError)
          // Don't set the main error here, just log it
        }
      } catch (error) {
        console.error("Error fetching company data:", error)
        setError("Не удалось загрузить данные компании. Пожалуйста, попробуйте позже.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanyData()
  }, [])

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    // Only allow changing to tabs that are enabled
    if (newValue === 2 && !clientsSaved) {
      setError("Please save clients first before adding transactions")
      setShowSuccess(true)
      return
    }

    if (newValue === 1 && !clientsSaved) {
      setError("Please save clients first before adding products")
      setShowSuccess(true)
      return
    }

    setActiveTab(newValue)
  }

  // Client handlers
  const handleClientDialogOpen = () => {
    setCurrentClient({
      name: "",
      email: "",
      phone: "",
      address: "",
      totalSpent: 0,
      lastPurchaseDate: new Date(),
    })
    setClientErrors({})
    setClientDialogOpen(true)
  }

  const handleClientDialogClose = () => {
    setClientDialogOpen(false)
  }

  const handleClientChange = (e) => {
    const { name, value } = e.target
    setCurrentClient({
      ...currentClient,
      [name]: value,
    })

    // Clear error when user types
    if (clientErrors[name]) {
      setClientErrors({
        ...clientErrors,
        [name]: "",
      })
    }
  }

  // Заменить функцию handleClientDateChange
  const handleClientDateChange = (e) => {
    setCurrentClient({
      ...currentClient,
      lastPurchaseDate: new Date(e.target.value),
    })
  }

  const validateClient = () => {
    const errors = {}
    let isValid = true

    if (!currentClient.name.trim()) {
      errors.name = "Название клиента обязательно"
      isValid = false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!currentClient.email.trim()) {
      errors.email = "Email обязателен"
      isValid = false
    } else if (!emailRegex.test(currentClient.email)) {
      errors.email = "Введите корректный email"
      isValid = false
    }

    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/
    if (currentClient.phone && !phoneRegex.test(currentClient.phone)) {
      errors.phone = "Введите корректный номер телефона"
      isValid = false
    }

    if (!currentClient.address.trim()) {
      errors.address = "Адрес обязателен"
      isValid = false
    }

    if (isNaN(currentClient.totalSpent) || currentClient.totalSpent < 0) {
      errors.totalSpent = "Введите корректную сумму"
      isValid = false
    }

    setClientErrors(errors)
    return isValid
  }

  // Replace the handleAddClient function with the original version that only updates local state
  const handleAddClient = () => {
    if (!validateClient()) {
      return
    }

    // Add client to the list
    const newClient = {
      ...currentClient,
      id: Date.now(), // Temporary ID for frontend
    }

    setClients([...clients, newClient])
    setClientDialogOpen(false)
    setSuccessMessage("Клиент успешно добавлен")
    setShowSuccess(true)
  }

  const handleDeleteClient = (id) => {
    // Don't allow deleting clients if they're already saved
    if (clientsSaved) {
      setError("Clients have already been saved and cannot be deleted")
      setShowSuccess(true)
      return
    }

    setClients(clients.filter((client) => client.id !== id))
    setSuccessMessage("Клиент удален")
    setShowSuccess(true)
  }

  // Product handlers
  const handleProductDialogOpen = () => {
    // Don't allow adding products if clients aren't saved
    if (!clientsSaved) {
      setError("Please save clients first before adding products")
      setShowSuccess(true)
      return
    }

    setCurrentProduct({
      name: "",
      description: "",
      analysis: {
        totalCost: 0,
        salesLastQuarter: 0,
        technicalImplementation: "",
        scalability: "",
        mainFeatures: "",
      },
    })
    setProductErrors({})
    setProductDialogOpen(true)
  }

  const handleProductDialogClose = () => {
    setProductDialogOpen(false)
  }

  const handleProductChange = (e) => {
    const { name, value } = e.target
    setCurrentProduct({
      ...currentProduct,
      [name]: value,
    })

    // Clear error when user types
    if (productErrors[name]) {
      setProductErrors({
        ...productErrors,
        [name]: "",
      })
    }
  }

  const handleProductAnalysisChange = (e) => {
    const { name, value } = e.target
    setCurrentProduct({
      ...currentProduct,
      analysis: {
        ...currentProduct.analysis,
        [name]: value,
      },
    })

    // Clear error when user types
    if (productErrors[`analysis.${name}`]) {
      setProductErrors({
        ...productErrors,
        [`analysis.${name}`]: "",
      })
    }
  }

  const validateProduct = () => {
    const errors = {}
    let isValid = true

    if (!currentProduct.name.trim()) {
      errors.name = "Название продукта обязательно"
      isValid = false
    }

    if (!currentProduct.description.trim()) {
      errors.description = "Описание продукта обязательно"
      isValid = false
    }

    if (isNaN(currentProduct.analysis.totalCost) || currentProduct.analysis.totalCost < 0) {
      errors["analysis.totalCost"] = "Введите корректную стоимость"
      isValid = false
    }

    if (isNaN(currentProduct.analysis.salesLastQuarter) || currentProduct.analysis.salesLastQuarter < 0) {
      errors["analysis.salesLastQuarter"] = "Введите корректное значение продаж"
      isValid = false
    }

    if (!currentProduct.analysis.technicalImplementation.trim()) {
      errors["analysis.technicalImplementation"] = "Поле обязательно"
      isValid = false
    }

    if (!currentProduct.analysis.scalability.trim()) {
      errors["analysis.scalability"] = "Поле обязательно"
      isValid = false
    }

    if (!currentProduct.analysis.mainFeatures.trim()) {
      errors["analysis.mainFeatures"] = "Поле обязательно"
      isValid = false
    }

    setProductErrors(errors)
    return isValid
  }

  // Replace the handleAddProduct function with the original version that only updates local state
  const handleAddProduct = () => {
    if (!validateProduct()) {
      return
    }

    // Add product to the list
    const newProduct = {
      ...currentProduct,
      id: Date.now(), // Temporary ID for frontend
    }

    setProducts([...products, newProduct])
    setProductDialogOpen(false)
    setSuccessMessage("Продукт успешно добавлен")
    setShowSuccess(true)
  }

  const handleDeleteProduct = (id) => {
    // Don't allow deleting products if they're already saved
    if (productsSaved) {
      setError("Products have already been saved and cannot be deleted")
      setShowSuccess(true)
      return
    }

    setProducts(products.filter((product) => product.id !== id))
    setSuccessMessage("Продукт удален")
    setShowSuccess(true)
  }

  // Transaction handlers
  const handleTransactionDialogOpen = () => {
    // Don't allow adding transactions if clients and products aren't saved
    if (!clientsSaved || !productsSaved) {
      setError("Please save clients and products first before adding transactions")
      setShowSuccess(true)
      return
    }

    setCurrentTransaction({
      amount: 0,
      type: "income",
      description: "",
      date: new Date(),
      clientId: clients.length > 0 ? clients[0].id : "",
      productId: products.length > 0 ? products[0].id : "",
    })
    setTransactionErrors({})
    setTransactionDialogOpen(true)
  }

  const handleTransactionDialogClose = () => {
    setTransactionDialogOpen(false)
  }

  const handleTransactionChange = (e) => {
    const { name, value } = e.target
    setCurrentTransaction({
      ...currentTransaction,
      [name]: value,
    })

    // Clear error when user types
    if (transactionErrors[name]) {
      setTransactionErrors({
        ...transactionErrors,
        [name]: "",
      })
    }
  }

  // Заменить функцию handleTransactionDateChange
  const handleTransactionDateChange = (e) => {
    setCurrentTransaction({
      ...currentTransaction,
      date: new Date(e.target.value),
    })
  }

  const validateTransaction = () => {
    const errors = {}
    let isValid = true

    if (isNaN(currentTransaction.amount) || currentTransaction.amount <= 0) {
      errors.amount = "Введите корректную сумму"
      isValid = false
    }

    if (!currentTransaction.description.trim()) {
      errors.description = "Описание транзакции обязательно"
      isValid = false
    }

    if (!currentTransaction.clientId) {
      errors.clientId = "Выберите клиента"
      isValid = false
    }

    if (!currentTransaction.productId) {
      errors.productId = "Выберите продукт"
      isValid = false
    }

    setTransactionErrors(errors)
    return isValid
  }

  // Replace the handleAddTransaction function with the original version that only updates local state
  const handleAddTransaction = () => {
    if (!validateTransaction()) {
      return
    }

    // Add transaction to the list
    const newTransaction = {
      ...currentTransaction,
      id: Date.now(), // Temporary ID for frontend
    }

    setTransactions([...transactions, newTransaction])
    setTransactionDialogOpen(false)
    setSuccessMessage("Транзакция успешно добавлена")
    setShowSuccess(true)
  }

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter((transaction) => transaction.id !== id))
    setSuccessMessage("Транзакция удалена")
    setShowSuccess(true)
  }

  // Modify the handleSaveClients function to avoid saving existing clients
  const handleSaveClients = async () => {
    if (clients.length === 0) {
      setError("Please add at least one client before saving")
      setShowSuccess(true)
      return
    }

    // Filter out clients that already have an ID from the server (not temporary IDs)
    const newClients = clients.filter((client) => !client.id || client.id.toString().length < 10)

    if (newClients.length === 0) {
      setClientsSaved(true)
      setActiveTab(1) // Move to products tab
      setSuccessMessage("Клиенты уже сохранены. Теперь вы можете добавить продукты.")
      setShowSuccess(true)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Get company ID from localStorage
      const companyId = localStorage.getItem("companyId") || "1" // Default to 1 if not found

      // Format data according to the specified structure
      const formattedClients = newClients.map((client) => ({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        totalSpent: client.totalSpent,
        lastPurchaseDate: client.lastPurchaseDate.toISOString(),
      }))

      const clientData = {
        clients: formattedClients,
      }

      // Make the API request to the specific clients endpoint
      const response = await axios.post(`http://localhost:5000/api/companies/${companyId}/clients`, clientData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Клиенты сохранены:", response.data)

      setClientsSaved(true)
      setActiveTab(1) // Move to products tab
      setSuccessMessage("Клиенты успешно сохранены. Теперь вы можете добавить продукты.")
      setShowSuccess(true)
    } catch (error) {
      console.error("Ошибка при сохранении клиентов:", error)

      if (error.response) {
        setError(
          error.response.data.message || "Произошла ошибка при сохранении клиентов. Пожалуйста, попробуйте снова.",
        )
      } else if (error.request) {
        setError("Сервер не отвечает. Пожалуйста, проверьте подключение к интернету и попробуйте снова.")
      } else {
        setError("Произошла ошибка при отправке запроса. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Modify the handleSaveProducts function to avoid saving existing products
  const handleSaveProducts = async () => {
    if (!clientsSaved) {
      setError("Please save clients first before saving products")
      setShowSuccess(true)
      return
    }

    if (products.length === 0) {
      setError("Please add at least one product before saving")
      setShowSuccess(true)
      return
    }

    // Filter out products that already have an ID from the server (not temporary IDs)
    const newProducts = products.filter((product) => !product.id || product.id.toString().length < 10)

    if (newProducts.length === 0) {
      setProductsSaved(true)
      setActiveTab(2) // Move to transactions tab
      setSuccessMessage("Продукты уже сохранены. Теперь вы можете добавить транзакции.")
      setShowSuccess(true)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Get company ID from localStorage
      const companyId = localStorage.getItem("companyId") || "1" // Default to 1 if not found

      // Format data according to the specified structure
      const formattedProducts = newProducts.map((product) => ({
        name: product.name,
        description: product.description,
        analysis: {
          totalCost: product.analysis.totalCost,
          salesLastQuarter: product.analysis.salesLastQuarter,
          technicalImplementation: product.analysis.technicalImplementation,
          scalability: product.analysis.scalability,
          mainFeatures: product.analysis.mainFeatures,
        },
      }))

      const productData = {
        products: formattedProducts,
      }

      // Make the API request to the specific products endpoint
      const response = await axios.post(`http://localhost:5000/api/companies/${companyId}/products`, productData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Продукты сохранены:", response.data)

      setProductsSaved(true)
      setActiveTab(2) // Move to transactions tab
      setSuccessMessage("Продукты успешно сохранены. Теперь вы можете добавить транзакции.")
      setShowSuccess(true)
    } catch (error) {
      console.error("Ошибка при сохранении продуктов:", error)

      if (error.response) {
        setError(
          error.response.data.message || "Произошла ошибка при сохранении продуктов. Пожалуйста, попробуйте снова.",
        )
      } else if (error.request) {
        setError("Сервер не отвечает. Пожалуйста, проверьте подключение к интернету и попробуйте снова.")
      } else {
        setError("Произошла ошибка при отправке запроса. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Modify the handleSaveTransactions function to avoid saving existing transactions
  const handleSaveTransactions = async () => {
    if (!clientsSaved || !productsSaved) {
      setError("Please save clients and products first before saving transactions")
      setShowSuccess(true)
      return
    }

    if (transactions.length === 0) {
      setError("Please add at least one transaction before saving")
      setShowSuccess(true)
      return
    }

    // Filter out transactions that already have an ID from the server (not temporary IDs)
    const newTransactions = transactions.filter(
      (transaction) => !transaction.id || transaction.id.toString().length < 10,
    )

    if (newTransactions.length === 0) {
      setSuccessMessage("Транзакции уже сохранены.")
      setShowSuccess(true)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Get company ID from localStorage
      const companyId = localStorage.getItem("companyId") || "1" // Default to 1 if not found

      // Format data according to the specified structure
      const formattedTransactions = newTransactions.map((transaction) => ({
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date.toISOString(),
        clientId: transaction.clientId,
      }))

      const transactionData = {
        transactions: formattedTransactions,
      }

      // Make the API request to the specific transactions endpoint
      const response = await axios.post(
        `http://localhost:5000/api/companies/${companyId}/transactions`,
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("Транзакции сохранены:", response.data)

      setSuccessMessage("Транзакции успешно сохранены.")
      setShowSuccess(true)
    } catch (error) {
      console.error("Ошибка при сохранении транзакций:", error)

      if (error.response) {
        setError(
          error.response.data.message || "Произошла ошибка при сохранении транзакций. Пожалуйста, попробуйте снова.",
        )
      } else if (error.request) {
        setError("Сервер не отвечает. Пожалуйста, проверьте подключение к интернету и попробуйте снова.")
      } else {
        setError("Произошла ошибка при отправке запроса. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate("/company")
  }

  const handleCloseSnackbar = () => {
    setShowSuccess(false)
  }

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  // Get client name by ID
  const getClientNameById = (id) => {
    const client = clients.find((client) => client.id === id)
    return client ? client.name : "Неизвестный клиент"
  }

  // Get product name by ID
  const getProductNameById = (id) => {
    const product = products.find((product) => product.id === id)
    return product ? product.name : "Неизвестный продукт"
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Header handleDrawerToggle={handleDrawerToggle} onLogout={onLogout} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Client Dialog */}
      <Dialog open={clientDialogOpen} onClose={handleClientDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Добавить нового клиента</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Название клиента"
                name="name"
                value={currentClient.name}
                onChange={handleClientChange}
                error={!!clientErrors.name}
                helperText={clientErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={currentClient.email}
                onChange={handleClientChange}
                error={!!clientErrors.email}
                helperText={clientErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
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
                value={currentClient.phone}
                onChange={handleClientChange}
                error={!!clientErrors.phone}
                helperText={clientErrors.phone}
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
                required
                label="Адрес"
                name="address"
                value={currentClient.address}
                onChange={handleClientChange}
                error={!!clientErrors.address}
                helperText={clientErrors.address}
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
                label="Общая сумма покупок"
                name="totalSpent"
                type="number"
                value={currentClient.totalSpent}
                onChange={handleClientChange}
                error={!!clientErrors.totalSpent}
                helperText={clientErrors.totalSpent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Дата последней покупки"
                name="lastPurchaseDate"
                type="datetime-local"
                value={formatDateForInput(currentClient.lastPurchaseDate)}
                onChange={handleClientDateChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClientDialogClose} color="secondary">
            Отмена
          </Button>
          <Button onClick={handleAddClient} color="primary" variant="contained">
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={handleProductDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Добавить новый продукт</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Название продукта"
                name="name"
                value={currentProduct.name}
                onChange={handleProductChange}
                error={!!productErrors.name}
                helperText={productErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InventoryIcon color="action" />
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
                rows={3}
                label="Описание продукта"
                name="description"
                value={currentProduct.description}
                onChange={handleProductChange}
                error={!!productErrors.description}
                helperText={productErrors.description}
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
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Анализ продукта
              </Typography>
              <Divider />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Общая стоимость"
                name="totalCost"
                type="number"
                value={currentProduct.analysis.totalCost}
                onChange={handleProductAnalysisChange}
                error={!!productErrors["analysis.totalCost"]}
                helperText={productErrors["analysis.totalCost"]}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Продажи за последний квартал"
                name="salesLastQuarter"
                type="number"
                value={currentProduct.analysis.salesLastQuarter}
                onChange={handleProductAnalysisChange}
                error={!!productErrors["analysis.salesLastQuarter"]}
                helperText={productErrors["analysis.salesLastQuarter"]}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShoppingCartIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Техническая реализация"
                name="technicalImplementation"
                value={currentProduct.analysis.technicalImplementation}
                onChange={handleProductAnalysisChange}
                error={!!productErrors["analysis.technicalImplementation"]}
                helperText={productErrors["analysis.technicalImplementation"]}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Масштабируемость"
                name="scalability"
                value={currentProduct.analysis.scalability}
                onChange={handleProductAnalysisChange}
                error={!!productErrors["analysis.scalability"]}
                helperText={productErrors["analysis.scalability"]}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Основные функции"
                name="mainFeatures"
                value={currentProduct.analysis.mainFeatures}
                onChange={handleProductAnalysisChange}
                error={!!productErrors["analysis.mainFeatures"]}
                helperText={productErrors["analysis.mainFeatures"]}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProductDialogClose} color="secondary">
            Отмена
          </Button>
          <Button onClick={handleAddProduct} color="primary" variant="contained">
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onClose={handleTransactionDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Добавить новую транзакцию</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Сумма"
                name="amount"
                type="number"
                value={currentTransaction.amount}
                onChange={handleTransactionChange}
                error={!!transactionErrors.amount}
                helperText={transactionErrors.amount}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="transaction-type-label">Тип транзакции</InputLabel>
                <Select
                  labelId="transaction-type-label"
                  name="type"
                  value={currentTransaction.type}
                  label="Тип транзакции"
                  onChange={handleTransactionChange}
                >
                  <MenuItem value="income">Доход</MenuItem>
                  <MenuItem value="expense">Расход</MenuItem>
                  <MenuItem value="investment">Инвестиция</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                label="Описание транзакции"
                name="description"
                value={currentTransaction.description}
                onChange={handleTransactionChange}
                error={!!transactionErrors.description}
                helperText={transactionErrors.description}
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
                label="Дата транзакции"
                name="date"
                type="datetime-local"
                value={formatDateForInput(currentTransaction.date)}
                onChange={handleTransactionDateChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!transactionErrors.clientId}>
                <InputLabel id="client-select-label">Клиент</InputLabel>
                <Select
                  labelId="client-select-label"
                  name="clientId"
                  value={currentTransaction.clientId}
                  label="Клиент"
                  onChange={handleTransactionChange}
                  disabled={clients.length === 0}
                >
                  {clients.length === 0 ? (
                    <MenuItem value="">Нет доступных клиентов</MenuItem>
                  ) : (
                    clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {transactionErrors.clientId && <FormHelperText>{transactionErrors.clientId}</FormHelperText>}
                {clients.length === 0 && (
                  <FormHelperText>Сначала добавьте клиентов во вкладке "Клиенты"</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!transactionErrors.productId}>
                <InputLabel id="product-select-label">Продукт</InputLabel>
                <Select
                  labelId="product-select-label"
                  name="productId"
                  value={currentTransaction.productId}
                  label="Продукт"
                  onChange={handleTransactionChange}
                  disabled={products.length === 0}
                >
                  {products.length === 0 ? (
                    <MenuItem value="">Нет доступных продуктов</MenuItem>
                  ) : (
                    products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {transactionErrors.productId && <FormHelperText>{transactionErrors.productId}</FormHelperText>}
                {products.length === 0 && (
                  <FormHelperText>Сначала добавьте продукты во вкладке "Продукты"</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTransactionDialogClose} color="secondary">
            Отмена
          </Button>
          <Button
            onClick={handleAddTransaction}
            color="primary"
            variant="contained"
            disabled={clients.length === 0 || products.length === 0}
          >
            Добавить
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
            maxWidth: "1400px",
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
              Информация о компании
            </Typography>
          </Box>

          {/* Workflow Stepper */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Процесс добавления данных
            </Typography>
            <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {activeStep === 0 && "Сначала добавьте и сохраните клиентов."}
                {activeStep === 1 && "Теперь добавьте и сохраните продукты."}
                {activeStep === 2 && "Теперь вы можете добавлять транзакции для клиентов и продуктов."}
              </Typography>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="company info tabs">
                <Tab
                  label={
                    <Badge color="success" badgeContent={clientsSaved ? <CheckCircleIcon fontSize="small" /> : 0}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <PersonIcon sx={{ mr: 1 }} /> Клиенты
                      </Box>
                    </Badge>
                  }
                  id="company-tab-0"
                  aria-controls="company-tabpanel-0"
                />
                <Tab
                  label={
                    <Badge color="success" badgeContent={productsSaved ? <CheckCircleIcon fontSize="small" /> : 0}>
                      <Box sx={{ display: "flex", alignItems: "center", opacity: clientsSaved ? 1 : 0.5 }}>
                        <InventoryIcon sx={{ mr: 1 }} /> Продукты
                      </Box>
                    </Badge>
                  }
                  id="company-tab-1"
                  aria-controls="company-tabpanel-1"
                  disabled={!clientsSaved}
                />
                <Tab
                  label={
                    <Box
                      sx={{ display: "flex", alignItems: "center", opacity: clientsSaved && productsSaved ? 1 : 0.5 }}
                    >
                      <ReceiptIcon sx={{ mr: 1 }} /> Транзакции
                    </Box>
                  }
                  id="company-tab-2"
                  aria-controls="company-tabpanel-2"
                  disabled={!clientsSaved || !productsSaved}
                />
              </Tabs>
            </Box>

            {/* Clients Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Список клиентов
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleClientDialogOpen}
                  disabled={clientsSaved}
                >
                  Добавить клиента
                </Button>
              </Box>

              {clientsSaved && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <AlertTitle>Клиенты сохранены</AlertTitle>
                  Клиенты успешно сохранены. Теперь вы можете перейти к добавлению продуктов.
                </Alert>
              )}

              {clients.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    У вас пока нет добавленных клиентов
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleClientDialogOpen}
                    sx={{ mt: 2 }}
                    disabled={clientsSaved}
                  >
                    Добавить первого клиента
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table sx={{ minWidth: 650 }} aria-label="clients table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Телефон</TableCell>
                        <TableCell>Адрес</TableCell>
                        <TableCell align="right">Общая сумма покупок</TableCell>
                        <TableCell>Дата последней покупки</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id} hover>
                          <TableCell component="th" scope="row">
                            {client.name}
                          </TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone || "—"}</TableCell>
                          <TableCell>{client.address}</TableCell>
                          <TableCell align="right">{client.totalSpent.toLocaleString()} ₽</TableCell>
                          <TableCell>{formatDate(client.lastPurchaseDate)}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClient(client.id)}
                              disabled={clientsSaved}
                              title={clientsSaved ? "Клиенты уже сохранены и не могут быть удалены" : "Удалить клиента"}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveClients}
                  disabled={clients.length === 0 || clientsSaved || isLoading}
                >
                  {isLoading ? "Сохранение..." : "Сохранить клиентов"}
                </Button>
              </Box>
            </TabPanel>

            {/* Products Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Список продуктов
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleProductDialogOpen}
                  disabled={!clientsSaved || productsSaved}
                >
                  Добавить продукт
                </Button>
              </Box>

              {productsSaved && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <AlertTitle>Продукты сохранены</AlertTitle>
                  Продукты успешно сохранены. Теперь вы можете перейти к добавлению транзакций.
                </Alert>
              )}

              {!clientsSaved && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <AlertTitle>Сначала сохраните клиентов</AlertTitle>
                  Перед добавлением продуктов необходимо сохранить клиентов.
                </Alert>
              )}

              {products.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    У вас пока нет добавленных продуктов
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleProductDialogOpen}
                    sx={{ mt: 2 }}
                    disabled={!clientsSaved || productsSaved}
                  >
                    Добавить первый продукт
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {products.map((product) => (
                    <Grid item xs={12} md={6} key={product.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Typography variant="h6" component="h3" gutterBottom>
                              {product.name}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={productsSaved}
                              title={
                                productsSaved ? "Продукты уже сохранены и не могут быть удалены" : "Удалить продукт"
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {product.description}
                          </Typography>

                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography sx={{ display: "flex", alignItems: "center" }}>
                                <AnalyticsIcon sx={{ mr: 1 }} /> Анализ продукта
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Общая стоимость:
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {product.analysis.totalCost.toLocaleString()} ₽
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Продажи за последний квартал:
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {product.analysis.salesLastQuarter.toLocaleString()} ₽
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Техническая реализация:
                                  </Typography>
                                  <Typography variant="body1">{product.analysis.technicalImplementation}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Масштабируемость:
                                  </Typography>
                                  <Typography variant="body1">{product.analysis.scalability}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Основные функции:
                                  </Typography>
                                  <Typography variant="body1">{product.analysis.mainFeatures}</Typography>
                                </Grid>
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveProducts}
                  disabled={products.length === 0 || !clientsSaved || productsSaved || isLoading}
                >
                  {isLoading ? "Сохранение..." : "Сохранить продукты"}
                </Button>
              </Box>
            </TabPanel>

            {/* Transactions Tab */}
            <TabPanel value={activeTab} index={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Список транзакций
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleTransactionDialogOpen}
                  disabled={!clientsSaved || !productsSaved}
                >
                  Добавить транзакцию
                </Button>
              </Box>

              {(!clientsSaved || !productsSaved) && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <AlertTitle>Сначала сохраните клиентов и продукты</AlertTitle>
                  Перед добавлением транзакций необходимо сохранить клиентов и продукты.
                </Alert>
              )}

              {transactions.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    У вас пока нет добавленных транзакций
                  </Typography>
                  {clientsSaved && productsSaved && (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleTransactionDialogOpen}
                      sx={{ mt: 2 }}
                    >
                      Добавить первую транзакцию
                    </Button>
                  )}
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table sx={{ minWidth: 650 }} aria-label="transactions table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Дата</TableCell>
                        <TableCell>Клиент</TableCell>
                        <TableCell>Продукт</TableCell>
                        <TableCell>Описание</TableCell>
                        <TableCell>Тип</TableCell>
                        <TableCell align="right">Сумма</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{getClientNameById(transaction.clientId)}</TableCell>
                          <TableCell>{getProductNameById(transaction.productId)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                transaction.type === "income"
                                  ? "Доход"
                                  : transaction.type === "expense"
                                    ? "Расход"
                                    : "Инвестиция"
                              }
                              color={
                                transaction.type === "income"
                                  ? "success"
                                  : transaction.type === "expense"
                                    ? "error"
                                    : "primary"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{transaction.amount.toLocaleString()} ₽</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveTransactions}
                  disabled={transactions.length === 0 || !clientsSaved || !productsSaved || isLoading}
                >
                  {isLoading ? "Сохранение..." : "Сохранить транзакции"}
                </Button>
              </Box>
            </TabPanel>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button variant="outlined" color="secondary" startIcon={<CancelIcon />} onClick={handleCancel}>
              Отмена
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"} sx={{ width: "100%" }}>
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CompanyInfoComponent
