const {
  User,
  Company,
  Product,
  ProductAnalysis,
  CompanyMember,
  Client,
  ProductionSchedule,
  Transaction,
} = require("../models")
const { Op } = require("sequelize")

const dashboardController = {
  getMyCompanyData: async (req, res) => {
    try {
      const userId = req.user.id

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      const userWithCompany = await User.findByPk(userId, {
        include: {
          model: Company,
          as: "companies",
          include: [
            {
              model: Product,
              as: "products",
              include: [
                {
                  model: ProductAnalysis,
                  as: "analysis",
                },
              ],
            },
            {
              model: User,
              as: "users",
              attributes: ["id", "name", "email", "role"],
            },
          ],
        },
      })

      if (!userWithCompany || !userWithCompany.companies || userWithCompany.companies.length === 0) {
        return res.status(404).json({ message: "Company not found for this user" })
      }

      const company = userWithCompany.companies[0] // Берем первую компанию

      const companyData = {
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        company: {
          id: company.id,
          name: company.name,
          address: company.address,
        },
        employees: company.users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        })),
        products: company.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          analysis: product.analysis
            ? {
                totalCost: product.analysis.totalCost,
                salesLastQuarter: product.analysis.salesLastQuarter,
                scalability: product.analysis.scalability,
              }
            : null,
        })),
      }

      res.status(200).json(companyData)
    } catch (error) {
      console.error("Error fetching company data:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },

  getMyProductsAnalytics: async (req, res) => {
    try {
      const userId = req.user.id

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" })
      }

      // Получаем компанию пользователя
      const userMember = await CompanyMember.findOne({
        where: { userId },
        attributes: ["companyId"],
      })

      if (!userMember) {
        return res.status(404).json({ message: "No company association found" })
      }

      const products = await Product.findAll({
        where: { companyId: userMember.companyId },
        include: [
          {
            model: ProductAnalysis,
            as: "analysis",
            attributes: ["totalCost", "salesLastQuarter", "scalability"],
          },
        ],
        attributes: ["id", "name", "description"],
        order: [["id", "DESC"]],
      })

      res.status(200).json({
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        products,
      })
    } catch (error) {
      console.error("Error fetching products analytics:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },

  getMyCompanyEmployees: async (req, res) => {
    try {
      const userId = req.user.id

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" })
      }

      // Получаем компанию пользователя
      const userMember = await CompanyMember.findOne({
        where: { userId },
        attributes: ["companyId"],
      })

      if (!userMember) {
        return res.status(404).json({ message: "No company association found" })
      }

      const employees = await CompanyMember.findAll({
        where: { companyId: userMember.companyId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "role", "createdAt"],
          },
        ],
        order: [["createdAt", "DESC"]],
      })

      res.status(200).json({
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        employees: employees.map((member) => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
          createdAt: member.user.createdAt,
        })),
      })
    } catch (error) {
      console.error("Error fetching company employees:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },

  updateCompany: async (req, res) => {
    try {
      const userId = req.user.id

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      // Получаем роль пользователя в компании
      const userMember = await CompanyMember.findOne({
        where: { userId },
        attributes: ["companyId", "role"],
      })

      if (!userMember) {
        return res.status(404).json({ message: "No company association found" })
      }

      if (!["creator", "admin"].includes(userMember.role)) {
        return res.status(403).json({ message: "Forbidden" })
      }

      const { name, address } = req.body

      const company = await Company.findByPk(userMember.companyId)
      if (!company) {
        return res.status(404).json({ message: "Company not found" })
      }

      company.name = name || company.name
      company.address = address || company.address
      await company.save()

      res.status(200).json({
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        message: "Company updated successfully",
        company: {
          id: company.id,
          name: company.name,
          address: company.address,
        },
      })
    } catch (error) {
      console.error("Error updating company:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },

  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id
      const { detailed, period } = req.query

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      // Find user's company
      const userMember = await CompanyMember.findOne({
        where: { userId },
        attributes: ["companyId", "role"],
      })

      if (!userMember) {
        return res.status(404).json({ message: "No company association found for this user" })
      }

      const companyId = userMember.companyId

      // Get company basic info
      const company = await Company.findByPk(companyId)
      if (!company) {
        return res.status(404).json({ message: "Company not found" })
      }

      // Set date range for filtering
      let dateFilter = {}
      const now = new Date()

      if (period === "week") {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { date: { [Op.gte]: lastWeek } }
      } else if (period === "month") {
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = { date: { [Op.gte]: lastMonth } }
      } else if (period === "quarter") {
        const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFilter = { date: { [Op.gte]: lastQuarter } }
      } else if (period === "year") {
        const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        dateFilter = { date: { [Op.gte]: lastYear } }
      }

      // Get financial data
      const transactions = await Transaction.findAll({
        where: {
          companyId,
          ...dateFilter,
        },
      })

      const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      // Get clients data
      const clients = await Client.findAll({
        where: { companyId },
        attributes:
          detailed === "true"
            ? ["id", "name", "email", "phone", "address", "totalSpent", "lastPurchaseDate"]
            : ["id", "name", "totalSpent"],
      })

      // Get products data
      const products = await Product.findAll({
        where: { companyId },
        include: [
          {
            model: ProductAnalysis,
            as: "analysis",
            attributes: ["totalCost", "salesLastQuarter", "scalability"],
          },
          detailed === "true"
            ? {
                model: ProductionSchedule,
                as: "schedules",
                where: {
                  endDate: { [Op.gte]: new Date() },
                },
                required: false,
              }
            : null,
        ].filter(Boolean),
        attributes: ["id", "name", "description"],
      })

      // Get company members
      const members = await CompanyMember.findAll({
        where: { companyId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
        attributes: ["role"],
      })

      // Get production schedules
      const productionSchedules =
        detailed !== "true"
          ? await ProductionSchedule.findAll({
              include: [
                {
                  model: Product,
                  as: "product",
                  where: { companyId },
                  attributes: ["id", "name"],
                },
              ],
              where: {
                endDate: { [Op.gte]: new Date() },
              },
              attributes: ["id", "startDate", "endDate", "quantity", "status"],
            })
          : []

      // Construct response
      const dashboardData = {
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        company: {
          id: company.id,
          name: company.name,
          address: company.address,
        },
        financials: {
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          period: period || "all",
        },
        clients: {
          total: clients.length,
          totalSpent: clients.reduce((sum, client) => sum + client.totalSpent, 0),
          list: detailed === "true" ? clients : clients.slice(0, 5),
        },
        products: {
          total: products.length,
          list: products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            analysis: product.analysis
              ? {
                  totalCost: product.analysis.totalCost,
                  salesLastQuarter: product.analysis.salesLastQuarter,
                  scalability: product.analysis.scalability,
                }
              : null,
            productionSchedules:
              detailed === "true" && product.schedules
                ? product.schedules.map((schedule) => ({
                    id: schedule.id,
                    startDate: schedule.startDate,
                    endDate: schedule.endDate,
                    quantity: schedule.quantity,
                    status: schedule.status,
                    notes: schedule.notes,
                  }))
                : [],
          })),
        },
        members: {
          total: members.length,
          list: members.map((member) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
          })),
        },
        productionSchedules:
          detailed !== "true"
            ? productionSchedules.map((schedule) => ({
                id: schedule.id,
                productId: schedule.product.id,
                productName: schedule.product.name,
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                quantity: schedule.quantity,
                status: schedule.status,
              }))
            : [],
      }

      res.status(200).json(dashboardData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      res.status(500).json({ message: "Internal server error", error: error.message })
    }
  },

  getClientDetails: async (req, res) => {
    try {
      const { clientId } = req.params
      const userId = req.user.id

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      // Find user's company
      const userMember = await CompanyMember.findOne({
        where: { userId },
        attributes: ["companyId"],
      })

      if (!userMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Get client with transactions
      const client = await Client.findOne({
        where: {
          id: clientId,
          companyId: userMember.companyId,
        },
        include: [
          {
            model: Transaction,
            as: "transactions",
            attributes: ["id", "amount", "type", "description", "date"],
            order: [["date", "DESC"]],
          },
        ],
      })

      if (!client) {
        return res.status(404).json({ message: "Client not found or access denied" })
      }

      res.status(200).json({
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          totalSpent: client.totalSpent,
          lastPurchaseDate: client.lastPurchaseDate,
          transactions: client.transactions,
        },
      })
    } catch (error) {
      console.error("Error fetching client details:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },

  getProductDetails: async (req, res) => {
    try {
      const { productId } = req.params
      const userId = req.user.id

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      // Find user's company
      const userMember = await CompanyMember.findOne({
        where: { userId },
        attributes: ["companyId"],
      })

      if (!userMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Get product with analysis and schedules
      const product = await Product.findOne({
        where: {
          id: productId,
          companyId: userMember.companyId,
        },
        include: [
          {
            model: ProductAnalysis,
            as: "analysis",
            attributes: ["totalCost", "salesLastQuarter", "technicalImplementation", "scalability", "mainFeatures"],
          },
          {
            model: ProductionSchedule,
            as: "schedules",
            attributes: ["id", "startDate", "endDate", "quantity", "status", "notes"],
          },
        ],
      })

      if (!product) {
        return res.status(404).json({ message: "Product not found or access denied" })
      }

      res.status(200).json({
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          analysis: product.analysis,
          productionSchedules: product.schedules,
        },
      })
    } catch (error) {
      console.error("Error fetching product details:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },

  getFinancialData: async (req, res) => {
    try {
      const userId = req.user.id
      const { startDate, endDate, type } = req.query

      // Получаем текущего пользователя
      const currentUser = await User.findByPk(userId, {
        attributes: ["id", "name"],
      })

      // Find user's company
      const userMember = await CompanyMember.findOne({
        where: { userId },
        attributes: ["companyId", "role"],
      })

      if (!userMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Check if user has permission to view financial data
      if (!["owner", "admin"].includes(userMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions to view financial data" })
      }

      // Build filter
      const filter = { companyId: userMember.companyId }

      if (startDate) {
        filter.date = { ...filter.date, [Op.gte]: new Date(startDate) }
      }

      if (endDate) {
        filter.date = { ...filter.date, [Op.lte]: new Date(endDate) }
      }

      if (type && ["income", "expense"].includes(type)) {
        filter.type = type
      }

      // Get transactions
      const transactions = await Transaction.findAll({
        where: filter,
        include: [
          {
            model: Client,
            as: "client",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        order: [["date", "DESC"]],
      })

      // Calculate totals
      const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      res.status(200).json({
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
        transactions: transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.description,
          date: t.date,
          client: t.client
            ? {
                id: t.client.id,
                name: t.client.name,
              }
            : null,
        })),
        summary: {
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          transactionCount: transactions.length,
        },
      })
    } catch (error) {
      console.error("Error fetching financial data:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
}

module.exports = dashboardController
