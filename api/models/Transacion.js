const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("income", "expense"),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
})

module.exports = Transaction
