"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material"
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
} from "@mui/icons-material"
import Header from "./Header"
import Sidebar from "./Sidebar"

const MembersComponent = ({ onLogout }) => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }


        const response = await axios.get(`http://localhost:5000/api/companies/${localStorage.getItem("companyId")}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Process the response data
        if (response.data && Array.isArray(response.data)) {
          const formattedMembers = response.data.map((member) => ({
            id: member.id,
            name: member.name,
            lastName: member.lastName,
            email: member.email,
            phone: member.phone,
            position: member.position || "",
            department: member.department || "",
            city: member.city,
            role: member.role,
            joinedAt: member.joinedAt,
            // Adding a status field (not in the API response, but needed for UI)
            status: "active",
          }))

          setMembers(formattedMembers)
          setFilteredMembers(formattedMembers)

          // Extract unique departments for filter
          const uniqueDepartments = [
            ...new Set(formattedMembers.map((member) => member.department).filter((department) => department !== "")),
          ]
          setDepartments(uniqueDepartments)
        } else {
          throw new Error("Invalid data format received from API")
        }
      } catch (error) {
        console.error("Error fetching members:", error)

        // Fallback to mock data in case of error
        const mockMembers = [
          {
            id: 1,
            name: "Mikhail",
            lastName: "Sakharov",
            email: "sakxar.mix@gmail.com",
            phone: "0412401204",
            position: "",
            department: "",
            city: "Ikutks",
            role: "owner",
            joinedAt: "2025-05-02T07:50:45.000Z",
            status: "active",
          },
          {
            id: 2,
            name: "Ivan",
            lastName: "Fucker",
            email: "user@example.com",
            phone: "94329423",
            position: "randomposition",
            department: "zyvfyv",
            city: "Irkutsk",
            role: "member",
            joinedAt: "2025-05-02T07:51:41.000Z",
            status: "active",
          },
          {
            id: 3,
            name: "string",
            lastName: "string",
            email: "user@examples.com",
            phone: "string",
            position: "string",
            department: "string",
            city: "string",
            role: "member",
            joinedAt: "2025-05-02T07:53:35.000Z",
            status: "active",
          },
        ]

        setMembers(mockMembers)
        setFilteredMembers(mockMembers)

        // Extract unique departments for filter
        const uniqueDepartments = [
          ...new Set(mockMembers.map((member) => member.department).filter((department) => department !== "")),
        ]
        setDepartments(uniqueDepartments)

        if (error.response && error.response.status === 401) {
          navigate("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [navigate])

  useEffect(() => {
    // Filter members based on search term and department filter
    let filtered = members

    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          `${member.name} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (member.position && member.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((member) => member.department === departmentFilter)
    }

    setFilteredMembers(filtered)
    setPage(0) // Reset to first page when filtering
  }, [searchTerm, departmentFilter, members])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleDepartmentFilterChange = (event) => {
    setDepartmentFilter(event.target.value)
  }

  const handleAddMember = () => {
    navigate("/members/add")
  }

  const handleEditMember = (id) => {
    navigate(`/members/edit/${id}`)
  }

  const handleDeleteClick = (member) => {
    setMemberToDelete(member)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsLoading(true)
      const companyId = 1 // Fixed company ID as requested

      // This would be replaced with your actual API endpoint
      await axios.delete(`http://localhost:5000/api/companies/${companyId}/members/${memberToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      // Remove from local state
      setMembers(members.filter((member) => member.id !== memberToDelete.id))
      setSnackbar({
        open: true,
        message: "Сотрудник успешно удален",
        severity: "success",
      })
    } catch (error) {
      console.error("Error deleting member:", error)
      setSnackbar({
        open: true,
        message: "Ошибка при удалении сотрудника",
        severity: "error",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
      setIsLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setMemberToDelete(null)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success"
      case "vacation":
        return "warning"
      case "leave":
        return "error"
      default:
        return "default"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Активен"
      case "vacation":
        return "Отпуск"
      case "leave":
        return "Отсутствует"
      default:
        return status
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case "owner":
        return "Владелец"
      case "admin":
        return "Администратор"
      case "member":
        return "Участник"
      default:
        return role
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "secondary"
      case "admin":
        return "primary"
      case "member":
        return "default"
      default:
        return "default"
    }
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("ru-RU", options)
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Header handleDrawerToggle={handleDrawerToggle} onLogout={onLogout} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить сотрудника {memberToDelete?.name} {memberToDelete?.lastName}? Это действие
            нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

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
          {/* Page Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ display: "flex", alignItems: "center" }}>
              <GroupIcon sx={{ mr: 1 }} /> Сотрудники компании
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddMember}
              sx={{ borderRadius: 2 }}
            >
              Добавить сотрудника
            </Button>
          </Box>

          {/* Filters and Search */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
              <TextField
                placeholder="Поиск сотрудников..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ flexGrow: 1, minWidth: "200px" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {departments.length > 0 && (
                <FormControl size="small" sx={{ minWidth: "200px" }}>
                  <InputLabel id="department-filter-label">Отдел</InputLabel>
                  <Select
                    labelId="department-filter-label"
                    id="department-filter"
                    value={departmentFilter}
                    label="Отдел"
                    onChange={handleDepartmentFilterChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterListIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">Все отделы</MenuItem>
                    {departments.map((department) => (
                      <MenuItem key={department} value={department}>
                        {department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Paper>

          {/* Members Table */}
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Сотрудник</TableCell>
                    <TableCell>Должность</TableCell>
                    <TableCell>Отдел</TableCell>
                    <TableCell>Контакты</TableCell>
                    <TableCell>Роль</TableCell>
                    <TableCell>Дата присоединения</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((member) => (
                      <TableRow hover key={member.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                              {member.name.charAt(0)}
                              {member.lastName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {member.name} {member.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {member.city}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{member.position || "—"}</TableCell>
                        <TableCell>{member.department || "—"}</TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                              <EmailIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: 16 }} />
                              <Typography variant="body2">{member.email}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: 16 }} />
                              <Typography variant="body2">{member.phone}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleLabel(member.role)}
                            size="small"
                            color={getRoleColor(member.role)}
                            variant={member.role === "member" ? "outlined" : "filled"}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(member.joinedAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(member.status)}
                            size="small"
                            color={getStatusColor(member.status)}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Редак��ировать">
                            <IconButton size="small" onClick={() => handleEditMember(member.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {member.role !== "owner" && (
                            <Tooltip title="Удалить">
                              <IconButton size="small" color="error" onClick={() => handleDeleteClick(member)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          {isLoading ? "Загрузка данных..." : "Сотрудники не найдены"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredMembers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Строк на странице:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export default MembersComponent
