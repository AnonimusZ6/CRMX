const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const TaskComment = sequelize.define(
  "TaskComment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000],
      },
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Foreign keys
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Tasks",
        key: "id",
      },
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    tableName: "task_comments",
    timestamps: true,
    indexes: [
      {
        fields: ["taskId"],
      },
      {
        fields: ["authorId"],
      },
    ],
  },
)

module.exports = TaskComment
