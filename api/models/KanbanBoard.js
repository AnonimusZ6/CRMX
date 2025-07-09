const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const KanbanBoard = sequelize.define(
  "KanbanBoard",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        columns: ["todo", "in_progress", "done"],
        allowedStatuses: ["todo", "in_progress", "done"],
        autoAssign: false,
        notifications: true,
      },
    },
    // Foreign keys
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "kanban_boards",
    timestamps: true,
    indexes: [
      {
        fields: ["companyId"],
      },
      {
        fields: ["createdBy"],
      },
    ],
  },
)

module.exports = KanbanBoard
