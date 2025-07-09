const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const ProductionSchedule = sequelize.define("ProductionSchedule", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("planned", "in_progress", "completed", "delayed"),
    allowNull: false,
    defaultValue: "planned",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
})

module.exports = ProductionSchedule
