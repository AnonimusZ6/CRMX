"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Stack,
  Pagination,
  ButtonGroup,
  Tooltip,
  Paper,
} from "@mui/material"
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Создание axios instance с конфигурацией
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Interceptor для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken")
      localStorage.removeItem("companyId")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Константы для сортировки и фильтрации
const SORT_OPTIONS = {
  DATE_DESC: "date_desc",
  DATE_ASC: "date_asc",
  AMOUNT_DESC: "amount_desc",
  AMOUNT_ASC: "amount_asc",
}

const ITEMS_PER_PAGE = 10

const FinancialComponent = () => {
  // Основные состояния
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0,
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Состояния для фильтрации и сортировки
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DATE_DESC)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    period: "month",
    type: "",
    startDate: "",
    endDate: "",
  })

  // Состояние формы (без поля clientId)
  const [formData, setFormData] = useState({
    amount: "",
    type: "income",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  // Мемоизированная сортировка и фильтрация транзакций
  const sortedAndFilteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Применяем фильтры
    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type)
    }

    if (filters.startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= new Date(filters.endDate))
    }

    // Применяем сортировку
    filtered.sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.DATE_DESC:
          return new Date(b.date) - new Date(a.date)
        case SORT_OPTIONS.DATE_ASC:
          return new Date(a.date) - new Date(b.date)
        case SORT_OPTIONS.AMOUNT_DESC:
          return Math.abs(b.amount) - Math.abs(a.amount)
        case SORT_OPTIONS.AMOUNT_ASC:
          return Math.abs(a.amount) - Math.abs(b.amount)
        default:
          return 0
      }
    })

    return filtered
  }, [transactions, filters, sortBy])

  // Мемоизированная пагинация
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedAndFilteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedAndFilteredTransactions, currentPage])

  const totalPages = Math.ceil(sortedAndFilteredTransactions.length / ITEMS_PER_PAGE)

  // Загрузка финансовых данных
  const fetchFinancialData = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Необходимо войти в систему")
      }

      // Параметры запроса
      const params = { ...filterParams }
      if (filters.type && !params.type) params.type = filters.type
      if (filters.startDate && !params.startDate) params.startDate = filters.startDate
      if (filters.endDate && !params.endDate) params.endDate = filters.endDate

      // Запрос транзакций
      const transactionsResponse = await api.get("/api/financial/transactions", {
        params,
        validateStatus: (status) => status < 500, // Принимаем статусы до 500
      })

      if (transactionsResponse.status === 200) {
        const data = transactionsResponse.data
        setTransactions(data.transactions || [])
        setSummary(
          data.summary || {
            totalIncome: 0,
            totalExpenses: 0,
            netProfit: 0,
            transactionCount: 0,
          },
        )
      } else {
        console.warn("Unexpected response status:", transactionsResponse.status)
        setTransactions([])
      }

      // Запрос данных для графиков
      try {
        const summaryParams = { period: filters.period, ...params }
        const summaryResponse = await api.get("/api/financial/summary", {
          params: summaryParams,
          validateStatus: (status) => status < 500,
        })

        if (summaryResponse.status === 200) {
          setChartData(summaryResponse.data.chartData || [])
        } else {
          setChartData([])
        }
      } catch (summaryError) {
        console.warn("Could not fetch chart data:", summaryError.message)
        setChartData([])
      }
    } catch (err) {
      console.error("Error fetching financial data:", err)

      if (err.response?.status === 401) {
        setError("Сессия истекла. Пожалуйста, войдите в систему заново.")
      } else if (err.response?.status >= 500) {
        setError("Ошибка сервера. Попробуйте позже.")
      } else if (err.message === "Необходимо войти в систему") {
        setError(err.message)
      } else {
        setError("Ошибка при загрузке финансовых данных. Проверьте подключение к серверу.")
      }

      // Устанавливаем пустые данные при ошибке
      setTransactions([])
      setSummary({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactionCount: 0,
      })
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, []) // Remove filters dependency

  // Эффект для первоначальной загрузки данных
  useEffect(() => {
    fetchFinancialData()
  }, [fetchFinancialData])

  // Эффект для обновления данных при изменении фильтров
  useEffect(() => {
    if (!loading) {
      // Avoid refetching during initial load
      fetchFinancialData()
    }
  }, [filters.type, filters.startDate, filters.endDate, filters.period])

  // Обработчик отправки формы
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          setError("Необходимо войти в систему")
          return
        }

        const transactionData = {
          ...formData,
          amount: Number.parseFloat(formData.amount),
        }

        await api.post("/api/financial/transactions", transactionData)

        // Сброс формы и обновление данных
        setFormData({
          amount: "",
          type: "income",
          description: "",
          date: new Date().toISOString().split("T")[0],
        })
        setShowForm(false)
        setError("")
        setCurrentPage(1) // Сброс на первую страницу

        // Refresh data immediately after creating transaction
        await fetchFinancialData()
      } catch (err) {
        console.error("Error creating transaction:", err)
        if (err.response?.status === 401) {
          setError("Сессия истекла. Пожалуйста, войдите в систему заново.")
        } else {
          setError(err.response?.data?.message || err.response?.data?.error || "Ошибка при создании транзакции")
        }
      }
    },
    [formData, fetchFinancialData],
  )

  // Обработчики изменений
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setCurrentPage(1) // Сброс на первую страницу при изменении фильтров
  }, [])

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy)
    setCurrentPage(1) // Сброс на первую страницу при изменении сортировки
  }, [])

  const handlePageChange = useCallback((event, page) => {
    setCurrentPage(page)
  }, [])

  // Утилиты форматирования
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(amount)
  }, [])

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("ru-RU")
  }, [])

  // Данные для круговой диаграммы
  const pieData = useMemo(
    () => [
      { name: "Доходы", value: summary.totalIncome, color: "#4caf50" },
      { name: "Расходы", value: Math.abs(summary.totalExpenses), color: "#f44336" },
    ],
    [summary],
  )

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Загрузка финансовых данных...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Заголовок */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Финансовое управление
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
            Фильтры
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
            Добавить транзакцию
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Фильтры */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Фильтры и сортировка
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Период</InputLabel>
                  <Select name="period" value={filters.period} onChange={handleFilterChange} label="Период">
                    <MenuItem value="week">Неделя</MenuItem>
                    <MenuItem value="month">Месяц</MenuItem>
                    <MenuItem value="quarter">Квартал</MenuItem>
                    <MenuItem value="year">Год</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Тип</InputLabel>
                  <Select name="type" value={filters.type} onChange={handleFilterChange} label="Тип">
                    <MenuItem value="">Все</MenuItem>
                    <MenuItem value="income">Доходы</MenuItem>
                    <MenuItem value="expense">Расходы</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  name="startDate"
                  label="От"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  name="endDate"
                  label="До"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Карточки сводки */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Общий доход
                  </Typography>
                  <Typography variant="h5" component="div" color="success.main">
                    {formatCurrency(summary.totalIncome)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
                  <TrendingDownIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Общие расходы
                  </Typography>
                  <Typography variant="h5" component="div" color="error.main">
                    {formatCurrency(Math.abs(summary.totalExpenses))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: summary.netProfit >= 0 ? "primary.main" : "warning.main", mr: 2 }}>
                  <AccountBalanceIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Чистая прибыль
                  </Typography>
                  <Typography
                    variant="h5"
                    component="div"
                    color={summary.netProfit >= 0 ? "primary.main" : "warning.main"}
                  >
                    {formatCurrency(summary.netProfit)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
                  <ReceiptIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Транзакций
                  </Typography>
                  <Typography variant="h5" component="div" color="info.main">
                    {summary.transactionCount}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Графики */}
      {chartData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Динамика доходов и расходов
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#4caf50" strokeWidth={2} name="Доходы" />
                    <Line type="monotone" dataKey="expenses" stroke="#f44336" strokeWidth={2} name="Расходы" />
                    <Line type="monotone" dataKey="profit" stroke="#2196f3" strokeWidth={2} name="Прибыль" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            {summary.totalIncome > 0 && summary.totalExpenses > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Распределение
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Сравнение доходов и расходов
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#4caf50" name="Доходы" />
                    <Bar dataKey="expenses" fill="#f44336" name="Расходы" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Таблица транзакций */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Транзакции ({sortedAndFilteredTransactions.length})</Typography>

            {/* Кнопки сортировки */}
            <Stack direction="row" spacing={1}>
              <ButtonGroup variant="outlined" size="small">
                <Tooltip title="Сортировка по дате (новые сначала)">
                  <Button
                    onClick={() => handleSortChange(SORT_OPTIONS.DATE_DESC)}
                    variant={sortBy === SORT_OPTIONS.DATE_DESC ? "contained" : "outlined"}
                    startIcon={<DateRangeIcon />}
                  >
                    Дата ↓
                  </Button>
                </Tooltip>
                <Tooltip title="Сортировка по дате (старые сначала)">
                  <Button
                    onClick={() => handleSortChange(SORT_OPTIONS.DATE_ASC)}
                    variant={sortBy === SORT_OPTIONS.DATE_ASC ? "contained" : "outlined"}
                    startIcon={<DateRangeIcon />}
                  >
                    Дата ↑
                  </Button>
                </Tooltip>
              </ButtonGroup>

              <ButtonGroup variant="outlined" size="small">
                <Tooltip title="Сортировка по сумме (большие сначала)">
                  <Button
                    onClick={() => handleSortChange(SORT_OPTIONS.AMOUNT_DESC)}
                    variant={sortBy === SORT_OPTIONS.AMOUNT_DESC ? "contained" : "outlined"}
                    startIcon={<AttachMoneyIcon />}
                  >
                    Сумма ↓
                  </Button>
                </Tooltip>
                <Tooltip title="Сортировка по сумме (меньшие сначала)">
                  <Button
                    onClick={() => handleSortChange(SORT_OPTIONS.AMOUNT_ASC)}
                    variant={sortBy === SORT_OPTIONS.AMOUNT_ASC ? "contained" : "outlined"}
                    startIcon={<AttachMoneyIcon />}
                  >
                    Сумма ↑
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Stack>
          </Box>

          {paginatedTransactions.length > 0 ? (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Дата</TableCell>
                      <TableCell>Тип</TableCell>
                      <TableCell align="right">Сумма</TableCell>
                      <TableCell>Описание</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type === "income" ? "Доход" : "Расход"}
                            color={transaction.type === "income" ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={transaction.type === "income" ? "success.main" : "error.main"}
                            fontWeight="medium"
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </Typography>
                        </TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Пагинация */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Транзакции не найдены
              </Typography>
              <Typography color="textSecondary">
                {filters.type || filters.startDate || filters.endDate
                  ? "Попробуйте изменить фильтры"
                  : "Добавьте первую транзакцию"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Диалог формы транзакции */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              Добавить транзакцию
              <IconButton onClick={() => setShowForm(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="amount"
                  label="Сумма"
                  value={formData.amount}
                  onChange={handleFormChange}
                  inputProps={{ step: "0.01", min: "0" }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Тип</InputLabel>
                  <Select name="type" value={formData.type} onChange={handleFormChange} label="Тип">
                    <MenuItem value="income">Доход</MenuItem>
                    <MenuItem value="expense">Расход</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  name="date"
                  label="Дата"
                  value={formData.date}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="description"
                  label="Описание"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Описание транзакции..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowForm(false)}>Отменить</Button>
            <Button type="submit" variant="contained">
              Сохранить
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}

// PropTypes для валидации (если компонент будет принимать пропсы)
FinancialComponent.propTypes = {
  // Добавьте пропсы при необходимости
}

export default React.memo(FinancialComponent)
