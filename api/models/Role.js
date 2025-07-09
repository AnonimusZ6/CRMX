const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const Role = sequelize.define(
  "Role",
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
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "roles",
    timestamps: false,
  },
)

module.exports = Role
