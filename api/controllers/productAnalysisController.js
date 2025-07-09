const { ProductAnalysis } = require("../models")

// Создать анализ продукта
exports.createProductAnalysis = async (req, res) => {
  try {
    const productAnalysis = await ProductAnalysis.create(req.body)
    res.status(201).json(productAnalysis)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Получить все анализы продуктов
exports.getProductAnalyses = async (req, res) => {
  try {
    const productAnalyses = await ProductAnalysis.findAll()
    res.status(200).json(productAnalyses)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Получить анализ продукта по ID
exports.getProductAnalysisById = async (req, res) => {
  try {
    const productAnalysis = await ProductAnalysis.findByPk(req.params.id)
    if (productAnalysis) {
      res.status(200).json(productAnalysis)
    } else {
      res.status(404).json({ error: "Product analysis not found" })
    }
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Обновить анализ продукта по ID
exports.updateProductAnalysis = async (req, res) => {
  try {
    const [updated] = await ProductAnalysis.update(req.body, {
      where: { id: req.params.id },
    })
    if (updated) {
      const updatedProductAnalysis = await ProductAnalysis.findByPk(req.params.id)
      res.status(200).json(updatedProductAnalysis)
    } else {
      res.status(404).json({ error: "Product analysis not found" })
    }
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Удалить анализ продукта по ID
exports.deleteProductAnalysis = async (req, res) => {
  try {
    const deleted = await ProductAnalysis.destroy({
      where: { id: req.params.id },
    })
    if (deleted) {
      res.status(204).json()
    } else {
      res.status(404).json({ error: "Product analysis not found" })
    }
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
