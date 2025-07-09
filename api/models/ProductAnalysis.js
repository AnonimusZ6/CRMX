const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const ProductAnalysis = sequelize.define("ProductAnalysis", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  totalCost: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  salesLastQuarter: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  technicalImplementation: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  scalability: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mainFeatures: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
})

module.exports = ProductAnalysis
