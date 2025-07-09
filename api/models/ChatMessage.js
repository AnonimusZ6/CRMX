const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    chatRoomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ChatRooms",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM("text", "file", "image"),
      defaultValue: "text",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "ChatMessages",
    timestamps: true,
  },
)

module.exports = ChatMessage