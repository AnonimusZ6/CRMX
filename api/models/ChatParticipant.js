const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const ChatParticipant = sequelize.define(
  "ChatParticipant",
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
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "ChatParticipants",
    timestamps: true,
  },
)

module.exports = ChatParticipant