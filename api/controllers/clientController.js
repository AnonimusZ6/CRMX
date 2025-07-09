const { Client, Company, CompanyMember } = require("../models")
const { Op } = require("sequelize")

const clientController = {
  // Get all clients for user's company
  async getClients(req, res) {
    try {
      const userId = req.user.id
      const { search, page = 1, limit = 20 } = req.query

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      const whereClause = {
        companyId: companyMember.companyId,
      }

      // Apply search filter
      if (search) {
        whereClause[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }]
      }

      const offset = (page - 1) * limit
      const { count, rows: clients } = await Client.findAndCountAll({
        where: whereClause,
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
        order: [["createdAt", "DESC"]],
      })

      const totalPages = Math.ceil(count / limit)

      res.json({
        clients,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Error fetching clients:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Create a new client
  async createClient(req, res) {
    try {
      const userId = req.user.id
      const { name, email, phone, address } = req.body

      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" })
      }

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      // Check if client with this email already exists in the company
      const existingClient = await Client.findOne({
        where: {
          email,
          companyId: companyMember.companyId,
        },
      })

      if (existingClient) {
        return res.status(409).json({ message: "Client with this email already exists" })
      }

      // Create client
      const client = await Client.create({
        name,
        email,
        phone,
        address,
        companyId: companyMember.companyId,
      })

      res.status(201).json({
        message: "Client created successfully",
        client,
      })
    } catch (error) {
      console.error("Error creating client:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Get a single client
  async getClient(req, res) {
    try {
      const userId = req.user.id
      const { clientId } = req.params

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      const client = await Client.findOne({
        where: {
          id: clientId,
          companyId: companyMember.companyId,
        },
      })

      if (!client) {
        return res.status(404).json({ message: "Client not found" })
      }

      res.json({ client })
    } catch (error) {
      console.error("Error fetching client:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Update a client
  async updateClient(req, res) {
    try {
      const userId = req.user.id
      const { clientId } = req.params
      const { name, email, phone, address } = req.body

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      const client = await Client.findOne({
        where: {
          id: clientId,
          companyId: companyMember.companyId,
        },
      })

      if (!client) {
        return res.status(404).json({ message: "Client not found" })
      }

      // Check if email is being changed and if it conflicts with another client
      if (email && email !== client.email) {
        const existingClient = await Client.findOne({
          where: {
            email,
            companyId: companyMember.companyId,
            id: { [Op.ne]: clientId },
          },
        })

        if (existingClient) {
          return res.status(409).json({ message: "Client with this email already exists" })
        }
      }

      // Update client
      await client.update({
        name: name || client.name,
        email: email || client.email,
        phone: phone !== undefined ? phone : client.phone,
        address: address !== undefined ? address : client.address,
      })

      res.json({
        message: "Client updated successfully",
        client,
      })
    } catch (error) {
      console.error("Error updating client:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Delete a client
  async deleteClient(req, res) {
    try {
      const userId = req.user.id
      const { clientId } = req.params

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      const client = await Client.findOne({
        where: {
          id: clientId,
          companyId: companyMember.companyId,
        },
      })

      if (!client) {
        return res.status(404).json({ message: "Client not found" })
      }

      await client.destroy()

      res.json({ message: "Client deleted successfully" })
    } catch (error) {
      console.error("Error deleting client:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
}

module.exports = clientController
