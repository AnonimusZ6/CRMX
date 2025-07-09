const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const Client = sequelize.define("Client", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalSpent: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  lastPurchaseDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
})

module.exports = Client
