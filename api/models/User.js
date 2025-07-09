const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    lastName: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        const hash = bcrypt.hashSync(value, 10);
        this.setDataValue("password", hash);
      },
    },
    phone: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    city: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    position: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    department: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

User.prototype.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = User;