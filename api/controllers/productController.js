const { Product, ProductAnalysis, Company, CompanyMember } = require("../models")
const { Op } = require("sequelize")

const productController = {
  // Get all products for user's company
  async getProducts(req, res) {
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
        whereClause[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }]
      }

      const offset = (page - 1) * limit
      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ProductAnalysis,
            as: "analysis",
            required: false,
          },
        ],
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
        order: [["createdAt", "DESC"]],
      })

      const totalPages = Math.ceil(count / limit)

      res.json({
        products,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Error fetching products:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Create a new product
  async createProduct(req, res) {
    try {
      const userId = req.user.id
      const { name, description, analysis } = req.body

      if (!name || !description) {
        return res.status(400).json({ message: "Name and description are required" })
      }

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      // Check if product with this name already exists in the company
      const existingProduct = await Product.findOne({
        where: {
          name,
          companyId: companyMember.companyId,
        },
      })

      if (existingProduct) {
        return res.status(409).json({ message: "Product with this name already exists" })
      }

      // Create product
      const product = await Product.create({
        name,
        description,
        companyId: companyMember.companyId,
      })

      // Create analysis if provided
      if (analysis) {
        await ProductAnalysis.create({
          productId: product.id,
          totalCost: analysis.totalCost || 0,
          salesLastQuarter: analysis.salesLastQuarter || 0,
          technicalImplementation: analysis.technicalImplementation || "",
          scalability: analysis.scalability || "",
          mainFeatures: analysis.mainFeatures || "",
        })
      }

      // Fetch created product with analysis
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: ProductAnalysis,
            as: "analysis",
            required: false,
          },
        ],
      })

      res.status(201).json({
        message: "Product created successfully",
        product: createdProduct,
      })
    } catch (error) {
      console.error("Error creating product:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Get a single product
  async getProduct(req, res) {
    try {
      const userId = req.user.id
      const { productId } = req.params

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      const product = await Product.findOne({
        where: {
          id: productId,
          companyId: companyMember.companyId,
        },
        include: [
          {
            model: ProductAnalysis,
            as: "analysis",
            required: false,
          },
        ],
      })

      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }

      res.json({ product })
    } catch (error) {
      console.error("Error fetching product:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Update a product
  async updateProduct(req, res) {
    try {
      const userId = req.user.id
      const { productId } = req.params
      const { name, description, analysis } = req.body

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      const product = await Product.findOne({
        where: {
          id: productId,
          companyId: companyMember.companyId,
        },
      })

      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }

      // Check if name is being changed and if it conflicts with another product
      if (name && name !== product.name) {
        const existingProduct = await Product.findOne({
          where: {
            name,
            companyId: companyMember.companyId,
            id: { [Op.ne]: productId },
          },
        })

        if (existingProduct) {
          return res.status(409).json({ message: "Product with this name already exists" })
        }
      }

      // Update product
      await product.update({
        name: name || product.name,
        description: description || product.description,
      })

      // Update or create analysis
      if (analysis) {
        const existingAnalysis = await ProductAnalysis.findOne({
          where: { productId: product.id },
        })

        if (existingAnalysis) {
          await existingAnalysis.update({
            totalCost: analysis.totalCost !== undefined ? analysis.totalCost : existingAnalysis.totalCost,
            salesLastQuarter:
              analysis.salesLastQuarter !== undefined ? analysis.salesLastQuarter : existingAnalysis.salesLastQuarter,
            technicalImplementation:
              analysis.technicalImplementation !== undefined
                ? analysis.technicalImplementation
                : existingAnalysis.technicalImplementation,
            scalability: analysis.scalability !== undefined ? analysis.scalability : existingAnalysis.scalability,
            mainFeatures: analysis.mainFeatures !== undefined ? analysis.mainFeatures : existingAnalysis.mainFeatures,
          })
        } else {
          await ProductAnalysis.create({
            productId: product.id,
            totalCost: analysis.totalCost || 0,
            salesLastQuarter: analysis.salesLastQuarter || 0,
            technicalImplementation: analysis.technicalImplementation || "",
            scalability: analysis.scalability || "",
            mainFeatures: analysis.mainFeatures || "",
          })
        }
      }

      // Fetch updated product with analysis
      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: ProductAnalysis,
            as: "analysis",
            required: false,
          },
        ],
      })

      res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      })
    } catch (error) {
      console.error("Error updating product:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },

  // Delete a product
  async deleteProduct(req, res) {
    try {
      const userId = req.user.id
      const { productId } = req.params

      // Find user's company
      const companyMember = await CompanyMember.findOne({
        where: { userId },
      })

      if (!companyMember) {
        return res.status(403).json({ message: "User not in any company" })
      }

      const product = await Product.findOne({
        where: {
          id: productId,
          companyId: companyMember.companyId,
        },
      })

      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }

      // Delete associated analysis first
      await ProductAnalysis.destroy({
        where: { productId: product.id },
      })

      // Delete product
      await product.destroy()

      res.json({ message: "Product deleted successfully" })
    } catch (error) {
      console.error("Error deleting product:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
}

module.exports = productController
