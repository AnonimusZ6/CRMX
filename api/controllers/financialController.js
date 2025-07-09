const { Transaction, Client, Company, CompanyMember } = require("../models");
const { Op } = require("sequelize");
// Импортируем sequelize из models/index.js где он правильно инициализирован
const { sequelize } = require("../models");

const financialController = {
  // Get all transactions for user's company
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, type, clientId, page = 1, limit = 50 } = req.query;

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
        include: [{ model: Company, as: "company" }], // Исправлено: добавлен псевдоним as: "company"
      });

      if (!companyMember || !companyMember.company) {
        return res.status(403).json({ message: "User not in any company" });
      }

      const whereClause = {
        companyId: companyMember.company.id, // Исправлено: companyMember.company.id вместо companyMember.companyId
      };

      // Apply filters
      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      if (type) {
        whereClause.type = type;
      }

      if (clientId) {
        whereClause.clientId = clientId;
      }

      const offset = (page - 1) * limit;
      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Client,
            as: "client",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
        order: [["date", "DESC"]],
      });

      // Calculate summary using Sequelize aggregation
      const summaryData = await Transaction.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn("SUM", sequelize.literal("CASE WHEN type = 'income' THEN amount ELSE 0 END")), "totalIncome"],
          [
            sequelize.fn("SUM", sequelize.literal("CASE WHEN type = 'expense' THEN amount ELSE 0 END")),
            "totalExpenses",
          ],
          [sequelize.fn("COUNT", sequelize.col("id")), "transactionCount"],
        ],
        raw: true,
      });

      const summary = summaryData[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };
      const totalIncome = Number.parseFloat(summary.totalIncome) || 0;
      const totalExpenses = Number.parseFloat(summary.totalExpenses) || 0;
      const netProfit = totalIncome - totalExpenses;

      const totalPages = Math.ceil(count / limit);

      res.json({
        transactions,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: Number.parseInt(limit),
        },
        summary: {
          totalIncome,
          totalExpenses,
          netProfit,
          transactionCount: Number.parseInt(summary.transactionCount) || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  // Create a new transaction
  async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { amount, type, description, date, clientId } = req.body;

      if (!amount || !type) {
        return res.status(400).json({ message: "Amount and type are required" });
      }

      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({ message: "Type must be either income or expense" });
      }

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      });

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" });
      }

      // Verify client belongs to company if clientId provided
      if (clientId) {
        const client = await Client.findOne({
          where: {
            id: clientId,
            companyId: companyMember.companyId,
          },
        });

        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }
      }

      // Create transaction
      const transaction = await Transaction.create({
        amount: Number.parseFloat(amount),
        type,
        description,
        date: date ? new Date(date) : new Date(),
        clientId: clientId || null,
        companyId: companyMember.companyId,
      });

      // Fetch created transaction with client info
      const createdTransaction = await Transaction.findByPk(transaction.id, {
        include: [
          {
            model: Client,
            as: "client",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      res.status(201).json({
        message: "Transaction created successfully",
        transaction: createdTransaction,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  // Update a transaction
  async updateTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { transactionId } = req.params;
      const { amount, type, description, date, clientId } = req.body;

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      });

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" });
      }

      const transaction = await Transaction.findOne({
        where: {
          id: transactionId,
          companyId: companyMember.companyId,
        },
      });

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Verify client belongs to company if clientId provided
      if (clientId) {
        const client = await Client.findOne({
          where: {
            id: clientId,
            companyId: companyMember.companyId,
          },
        });

        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }
      }

      // Update transaction
      await transaction.update({
        amount: amount !== undefined ? Number.parseFloat(amount) : transaction.amount,
        type: type || transaction.type,
        description: description !== undefined ? description : transaction.description,
        date: date ? new Date(date) : transaction.date,
        clientId: clientId !== undefined ? clientId : transaction.clientId,
      });

      // Fetch updated transaction
      const updatedTransaction = await Transaction.findByPk(transaction.id, {
        include: [
          {
            model: Client,
            as: "client",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      res.json({
        message: "Transaction updated successfully",
        transaction: updatedTransaction,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  // Delete a transaction
  async deleteTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { transactionId } = req.params;

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      });

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" });
      }

      const transaction = await Transaction.findOne({
        where: {
          id: transactionId,
          companyId: companyMember.companyId,
        },
      });

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      await transaction.destroy();

      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  // Get financial summary and reports
  async getFinancialSummary(req, res) {
    try {
      const userId = req.user.id;
      const { period = "month", startDate, endDate } = req.query;

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
        include: [{ model: Company, as: "company" }], // Исправлено: добавлен псевдоним as: "company"
      });

      if (!companyMember || !companyMember.company) {
        return res.status(403).json({ message: "User not in any company" });
      }

      let dateRange = {};
      const now = new Date();

      // Calculate date range based on period
      if (startDate && endDate) {
        dateRange = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      } else {
        switch (period) {
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateRange = { [Op.gte]: weekAgo };
            break;
          case "month":
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            dateRange = { [Op.gte]: monthAgo };
            break;
          case "quarter":
            const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            dateRange = { [Op.gte]: quarterAgo };
            break;
          case "year":
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            dateRange = { [Op.gte]: yearAgo };
            break;
          default:
            const defaultMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            dateRange = { [Op.gte]: defaultMonthAgo };
        }
      }

      const whereClause = {
        companyId: companyMember.company.id, // Исправлено: companyMember.company.id вместо companyMember.companyId
        date: dateRange,
      };

      // Get summary
      const summaryData = await Transaction.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn("SUM", sequelize.literal("CASE WHEN type = 'income' THEN amount ELSE 0 END")), "totalIncome"],
          [
            sequelize.fn("SUM", sequelize.literal("CASE WHEN type = 'expense' THEN amount ELSE 0 END")),
            "totalExpenses",
          ],
          [sequelize.fn("COUNT", sequelize.col("id")), "transactionCount"],
        ],
        raw: true,
      });

      const summary = summaryData[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };
      const totalIncome = Number.parseFloat(summary.totalIncome) || 0;
      const totalExpenses = Number.parseFloat(summary.totalExpenses) || 0;
      const netProfit = totalIncome - totalExpenses;

      // Get chart data (monthly breakdown)
      const chartData = await Transaction.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn("DATE_FORMAT", sequelize.col("date"), "%Y-%m"), "month"],
          [sequelize.fn("SUM", sequelize.literal("CASE WHEN type = 'income' THEN amount ELSE 0 END")), "income"],
          [sequelize.fn("SUM", sequelize.literal("CASE WHEN type = 'expense' THEN amount ELSE 0 END")), "expenses"],
        ],
        group: [sequelize.fn("DATE_FORMAT", sequelize.col("date"), "%Y-%m")],
        order: [[sequelize.fn("DATE_FORMAT", sequelize.col("date"), "%Y-%m"), "ASC"]],
        raw: true,
      });

      const formattedChartData = chartData.map((item) => ({
        month: new Date(item.month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "short" }),
        income: Number.parseFloat(item.income) || 0,
        expenses: Number.parseFloat(item.expenses) || 0,
        profit: (Number.parseFloat(item.income) || 0) - (Number.parseFloat(item.expenses) || 0),
      }));

      // Get recent transactions
      const recentTransactions = await Transaction.findAll({
        where: { companyId: companyMember.company.id }, // Исправлено: companyMember.company.id
        include: [
          {
            model: Client,
            as: "client",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
        limit: 10,
        order: [["createdAt", "DESC"]],
      });

      res.json({
        summary: {
          totalIncome,
          totalExpenses,
          netProfit,
          transactionCount: Number.parseInt(summary.transactionCount) || 0,
          period,
        },
        chartData: formattedChartData,
        recentTransactions,
      });
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
};

module.exports = financialController;