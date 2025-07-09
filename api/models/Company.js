const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const Company = sequelize.define(
  "Company",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fullDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    corporateEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    tableName: "companies",
    timestamps: true,
  },
)

module.exports = Company
