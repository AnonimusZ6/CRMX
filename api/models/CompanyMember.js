const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const CompanyMember = sequelize.define(
  "CompanyMember",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("owner", "admin", "member", "director"),
      allowNull: false,
      defaultValue: "member",
    },
  },
  {
    tableName: "company_members",
    timestamps: true,
  },
)

module.exports = CompanyMember
