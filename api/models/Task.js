const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 5000],
      },
    },
    status: {
      type: DataTypes.ENUM("todo", "in_progress", "done"),
      allowNull: false,
      defaultValue: "todo",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium",
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    actualHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Foreign keys
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Companies",
        key: "id",
      },
    },
    boardId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "kanban_boards",
        key: "id",
      },
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
    indexes: [
      {
        fields: ["companyId", "status"],
      },
      {
        fields: ["authorId"],
      },
      {
        fields: ["assigneeId"],
      },
      {
        fields: ["boardId", "position"],
      },
      {
        fields: ["dueDate"],
      },
    ],
  },
)

module.exports = Task
