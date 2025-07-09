const { Sequelize } = require("sequelize")
const sequelize = require("../config/database")

const User = require("./User")
const Company = require("./Company")
const CompanyMember = require("./CompanyMember")
const Product = require("./Product")
const ProductAnalysis = require("./ProductAnalysis")
const Client = require("./Client")
const ProductionSchedule = require("./ProductionSchedule")
const Transaction = require("./Transacion")
const ChatRoom = require("./ChatRoom")
const ChatMessage = require("./ChatMessage")
const ChatParticipant = require("./ChatParticipant")
const KanbanBoard = require("./KanbanBoard")
const Task = require("./Task")
const TaskComment = require("./TaskComment")

// Основные связи User-Company через CompanyMember
User.belongsToMany(Company, {
  through: CompanyMember,
  foreignKey: "userId",
  as: "companies",
})
Company.belongsToMany(User, {
  through: CompanyMember,
  foreignKey: "companyId",
  as: "users",
})

// Прямые связи для CompanyMember
User.hasMany(CompanyMember, {
  foreignKey: "userId",
  as: "companyMemberships",
})
CompanyMember.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
})

Company.hasMany(CompanyMember, {
  foreignKey: "companyId",
  as: "members",
})
CompanyMember.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
})

// Product связи
Company.hasMany(Product, {
  foreignKey: "companyId",
  as: "products",
})
Product.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
})

Product.hasOne(ProductAnalysis, {
  foreignKey: "productId",
  as: "analysis",
})
ProductAnalysis.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
})

// Client связи
Company.hasMany(Client, {
  foreignKey: "companyId",
  as: "clients",
})
Client.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
})

// ProductionSchedule связи
Product.hasMany(ProductionSchedule, {
  foreignKey: "productId",
  as: "schedules",
})
ProductionSchedule.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
})

// Transaction связи
Company.hasMany(Transaction, {
  foreignKey: "companyId",
  as: "transactions",
})
Transaction.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
})

Transaction.belongsTo(Client, {
  foreignKey: "clientId",
  as: "client",
})
Client.hasMany(Transaction, {
  foreignKey: "clientId",
  as: "transactions",
})

// Chat связи
ChatRoom.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
})
ChatRoom.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
})
ChatRoom.hasMany(ChatMessage, {
  foreignKey: "chatRoomId",
  as: "messages",
})
ChatRoom.hasMany(ChatParticipant, {
  foreignKey: "chatRoomId",
  as: "participants",
})

ChatMessage.belongsTo(ChatRoom, {
  foreignKey: "chatRoomId",
  as: "chatRoom",
})
ChatMessage.belongsTo(User, {
  foreignKey: "userId",
  as: "sender",
})

ChatParticipant.belongsTo(ChatRoom, {
  foreignKey: "chatRoomId",
  as: "chatRoom",
})
ChatParticipant.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
})

User.hasMany(ChatMessage, {
  foreignKey: "userId",
  as: "messages",
})
User.hasMany(ChatParticipant, {
  foreignKey: "userId",
  as: "chatParticipations",
})

// Kanban связи
Company.hasMany(KanbanBoard, {
  foreignKey: "companyId",
  as: "kanbanBoards",
})
KanbanBoard.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
})

User.hasMany(KanbanBoard, {
  foreignKey: "createdBy",
  as: "createdBoards",
})
KanbanBoard.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
})

KanbanBoard.hasMany(Task, {
  foreignKey: "boardId",
  as: "tasks",
})
Task.belongsTo(KanbanBoard, {
  foreignKey: "boardId",
  as: "board",
})

// Task связи
Company.hasMany(Task, {
  foreignKey: "companyId",
  as: "tasks",
})
Task.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
})

User.hasMany(Task, {
  foreignKey: "authorId",
  as: "authoredTasks",
})
Task.belongsTo(User, {
  foreignKey: "authorId",
  as: "author",
})

User.hasMany(Task, {
  foreignKey: "assigneeId",
  as: "assignedTasks",
})
Task.belongsTo(User, {
  foreignKey: "assigneeId",
  as: "assignee",
})

Task.hasMany(TaskComment, {
  foreignKey: "taskId",
  as: "comments",
})
TaskComment.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
})

User.hasMany(TaskComment, {
  foreignKey: "authorId",
  as: "taskComments",
})
TaskComment.belongsTo(User, {
  foreignKey: "authorId",
  as: "author",
})

module.exports = {
  sequelize,
  User,
  Company,
  CompanyMember,
  Product,
  ProductAnalysis,
  Client,
  ProductionSchedule,
  Transaction,
  ChatRoom,
  ChatMessage,
  ChatParticipant,
  KanbanBoard,
  Task,
  TaskComment,
}
