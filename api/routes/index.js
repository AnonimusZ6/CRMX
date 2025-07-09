const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const companyController = require("../controllers/companyController")
const dashboardController = require("../controllers/dashboardController")
const chatController = require("../controllers/chatController")
const kanbanController = require("../controllers/kanbanController")
const authMiddleware = require("../middleware/authMiddleware")

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         position:
 *           type: string
 *         department:
 *           type: string
 *         city:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AuthLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *     AuthRegister:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *         phone:
 *           type: string
 *         city:
 *           type: string
 *         userType:
 *           type: string
 *           enum: [user, director]
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             shortDescription:
 *               type: string
 *             fullDescription:
 *               type: string
 *             address:
 *               type: string
 *             location:
 *               type: string
 *             phoneNumber:
 *               type: string
 *             corporateEmail:
 *               type: string
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         shortDescription:
 *           type: string
 *         fullDescription:
 *           type: string
 *         address:
 *           type: string
 *         location:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         corporateEmail:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CompanyCreate:
 *       type: object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         name:
 *           type: string
 *         shortDescription:
 *           type: string
 *         fullDescription:
 *           type: string
 *         address:
 *           type: string
 *         location:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         corporateEmail:
 *           type: string
 *     CompanyMember:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *         companyId:
 *           type: integer
 *         role:
 *           type: string
 *           enum: [owner, admin, member, director]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AddMemberRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [admin, member, director]
 *           default: member
 *     Client:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         totalSpent:
 *           type: number
 *         lastPurchaseDate:
 *           type: string
 *           format: date-time
 *     ClientResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         totalSpent:
 *           type: number
 *         lastPurchaseDate:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ClientsListResponse:
 *       type: object
 *       properties:
 *         companyId:
 *           type: integer
 *         companyName:
 *           type: string
 *         totalClients:
 *           type: integer
 *         clients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ClientResponse'
 *     ProductAnalysis:
 *       type: object
 *       properties:
 *         totalCost:
 *           type: number
 *         salesLastQuarter:
 *           type: number
 *         technicalImplementation:
 *           type: string
 *         scalability:
 *           type: string
 *         mainFeatures:
 *           type: string
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         analysis:
 *           $ref: '#/components/schemas/ProductAnalysis'
 *     ProductResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         analysis:
 *           $ref: '#/components/schemas/ProductAnalysis'
 *     ProductsListResponse:
 *       type: object
 *       properties:
 *         companyId:
 *           type: integer
 *         companyName:
 *           type: string
 *         totalProducts:
 *           type: integer
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductResponse'
 *     Transaction:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *       properties:
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [income, expense]
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *     TransactionCreate:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *       properties:
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [income, expense]
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [income, expense]
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         client:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *     TransactionsListResponse:
 *       type: object
 *       properties:
 *         companyId:
 *           type: integer
 *         companyName:
 *           type: string
 *         totalTransactions:
 *           type: integer
 *         summary:
 *           type: object
 *           properties:
 *             totalIncome:
 *               type: number
 *             totalExpenses:
 *               type: number
 *             netProfit:
 *               type: number
 *         filters:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *             endDate:
 *               type: string
 *               format: date
 *             type:
 *               type: string
 *               enum: [income, expense]
 *             clientId:
 *               type: integer
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TransactionResponse'
 *     CompanyInformation:
 *       type: object
 *       properties:
 *         clients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Client'
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *     Dashboard:
 *       type: object
 *       properties:
 *         company:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             address:
 *               type: string
 *         financials:
 *           type: object
 *           properties:
 *             totalIncome:
 *               type: number
 *             totalExpenses:
 *               type: number
 *             netProfit:
 *               type: number
 *             period:
 *               type: string
 *         clients:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             totalSpent:
 *               type: number
 *             list:
 *               type: array
 *               items:
 *                 type: object
 *         products:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             list:
 *               type: array
 *               items:
 *                 type: object
 *         members:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             list:
 *               type: array
 *               items:
 *                 type: object
 *         productionSchedules:
 *           type: array
 *           items:
 *             type: object
 *     ChatRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         companyId:
 *           type: integer
 *         createdBy:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         isPrivate:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChatRoomCreate:
 *       type: object
 *       required:
 *         - name
 *         - companyId
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         companyId:
 *           type: integer
 *         isPrivate:
 *           type: boolean
 *           default: false
 *         participantIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: User IDs to add as participants (for private chats)
 *     PrivateChatCreate:
 *       type: object
 *       required:
 *         - participantId
 *         - companyId
 *       properties:
 *         participantId:
 *           type: integer
 *           description: ID of the user to start private chat with
 *         companyId:
 *           type: integer
 *           description: Company ID where both users are members
 *     ChatRoomResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         companyId:
 *           type: integer
 *         createdBy:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         isPrivate:
 *           type: boolean
 *         participantCount:
 *           type: integer
 *         lastMessage:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             content:
 *               type: string
 *             senderName:
 *               type: string
 *             createdAt:
 *               type: string
 *               format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         roomId:
 *           type: integer
 *         senderId:
 *           type: integer
 *         messageType:
 *           type: string
 *           enum: [text, image, file, system]
 *         isEdited:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChatMessageCreate:
 *       type: object
 *       required:
 *         - content
 *         - roomId
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *         roomId:
 *           type: integer
 *         messageType:
 *           type: string
 *           enum: [text, image, file, system]
 *           default: text
 *     ChatMessageResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         roomId:
 *           type: integer
 *         senderId:
 *           type: integer
 *         messageType:
 *           type: string
 *           enum: [text, image, file, system]
 *         isEdited:
 *           type: boolean
 *         sender:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChatParticipant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         roomId:
 *           type: integer
 *         userId:
 *           type: integer
 *         role:
 *           type: string
 *           enum: [admin, member]
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         lastReadAt:
 *           type: string
 *           format: date-time
 *     ChatParticipantAdd:
 *       type: object
 *       required:
 *         - userIds
 *       properties:
 *         userIds:
 *           type: array
 *           items:
 *             type: integer
 *           minItems: 1
 *         role:
 *           type: string
 *           enum: [admin, member]
 *           default: member
 *     ChatParticipantResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         roomId:
 *           type: integer
 *         userId:
 *           type: integer
 *         role:
 *           type: string
 *           enum: [admin, member]
 *         isOnline:
 *           type: boolean
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             position:
 *               type: string
 *             department:
 *               type: string
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         lastReadAt:
 *           type: string
 *           format: date-time
 *     CompanyMemberResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         companyId:
 *           type: integer
 *         role:
 *           type: string
 *         isOnline:
 *           type: boolean
 *         lastSeen:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             name:
 *               type: string
 *             lastName:
 *               type: string
 *             position:
 *               type: string
 *             department:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     SocketEvent:
 *       type: object
 *       properties:
 *         event:
 *           type: string
 *           enum: [message_sent, user_joined, user_left, typing_start, typing_stop, room_created, room_updated]
 *         data:
 *           type: object
 *         roomId:
 *           type: integer
 *         userId:
 *           type: integer
 *         timestamp:
 *           type: string
 *           format: date-time
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         status:
 *           type: string
 *           enum: [todo, inProgress, done]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         dueDate:
 *           type: string
 *           format: date-time
 *         estimatedHours:
 *           type: number
 *         actualHours:
 *           type: number
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         position:
 *           type: integer
 *         completedAt:
 *           type: string
 *           format: date-time
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *         assignee:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TaskCreate:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         content:
 *           type: string
 *         status:
 *           type: string
 *           enum: [todo, inProgress, done]
 *           default: todo
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         dueDate:
 *           type: string
 *           format: date-time
 *         estimatedHours:
 *           type: number
 *         assigneeId:
 *           type: integer
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         boardId:
 *           type: integer
 *     TaskUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         content:
 *           type: string
 *         status:
 *           type: string
 *           enum: [todo, inProgress, done]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         dueDate:
 *           type: string
 *           format: date-time
 *         estimatedHours:
 *           type: number
 *         actualHours:
 *           type: number
 *         assigneeId:
 *           type: integer
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         position:
 *           type: integer
 *     KanbanBoard:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         settings:
 *           type: object
 *         isActive:
 *           type: boolean
 *         companyId:
 *           type: integer
 *         createdBy:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     KanbanBoardCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         settings:
 *           type: object
 *           properties:
 *             columns:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   status:
 *                     type: string
 *     TaskComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         taskId:
 *           type: integer
 *         authorId:
 *           type: integer
 *         isEdited:
 *           type: boolean
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TaskCommentCreate:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegister'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.post("/auth/register", authController.register)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLogin'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/auth/login", authController.login)

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/auth/profile", authMiddleware.authenticate, authController.getProfile)

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management endpoints
 */

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyCreate'
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/companies", authMiddleware.authenticate, companyController.createCompany)

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get user's companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   role:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/companies", authMiddleware.authenticate, companyController.getUserCompanies)

/**
 * @swagger
 * /api/companies/{companyId}/members:
 *   post:
 *     summary: Add member to company (creates user if not exists)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email (required)
 *               role:
 *                 type: string
 *                 enum: [owner, director, admin, member]
 *                 default: member
 *                 description: Role in company
 *               name:
 *                 type: string
 *                 description: User's first name (required if creating new user)
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               city:
 *                 type: string
 *                 description: User's city
 *               position:
 *                 type: string
 *                 description: User's position
 *               department:
 *                 type: string
 *                 description: User's department
 *     responses:
 *       201:
 *         description: Member added successfully (user created if didn't exist)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                   description: ID of the user
 *                 companyId:
 *                   type: integer
 *                   description: ID of the company
 *                 role:
 *                   type: string
 *                   description: Role in company
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     position:
 *                       type: string
 *                     department:
 *                       type: string
 *                     city:
 *                       type: string
 *       400:
 *         description: Invalid input data (missing required fields)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions or trying to add director without rights)
 *       404:
 *         description: User not found (only if trying to add existing user)
 *       409:
 *         description: User already in company
 *       500:
 *         description: Server error
 */
router.post("/companies/:companyId/members", authMiddleware.authenticate, companyController.addCompanyMember)

/**
 * @swagger
 * /api/companies/{companyId}/members:
 *   get:
 *     summary: Get company members
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of company members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   joinedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       500:
 *         description: Server error
 */
router.get("/companies/:companyId/members", authMiddleware.authenticate, companyController.getCompanyMembers)

/**
 * @swagger
 * /api/companies/{companyId}/clients:
 *   post:
 *     summary: Add clients to a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clients:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Clients added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.post("/companies/:companyId/clients", authMiddleware.authenticate, companyController.addCompanyClients)

/**
 * @swagger
 * /api/companies/{companyId}/clients:
 *   get:
 *     summary: Get all clients of a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *     responses:
 *       200:
 *         description: List of company clients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientsListResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get("/companies/:companyId/clients", authMiddleware.authenticate, companyController.getCompanyClients)

/**
 * @swagger
 * /api/companies/{companyId}/products:
 *   post:
 *     summary: Add products to a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Products added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.post("/companies/:companyId/products", authMiddleware.authenticate, companyController.addCompanyProducts)

/**
 * @swagger
 * /api/companies/{companyId}/products:
 *   get:
 *     summary: Get all products of a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *     responses:
 *       200:
 *         description: List of company products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsListResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get("/companies/:companyId/products", authMiddleware.authenticate, companyController.getCompanyProducts)

/**
 * @swagger
 * /api/companies/{companyId}/transactions:
 *   post:
 *     summary: Add transactions to a company (no client ID required)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TransactionCreate'
 *     responses:
 *       201:
 *         description: Transactions added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.post("/companies/:companyId/transactions", authMiddleware.authenticate, companyController.addCompanyTransactions)

/**
 * @swagger
 * /api/companies/{companyId}/transactions:
 *   get:
 *     summary: Get all transactions of a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *         description: Filter by client ID
 *     responses:
 *       200:
 *         description: List of company transactions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionsListResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get("/companies/:companyId/transactions", authMiddleware.authenticate, companyController.getCompanyTransactions)

/**
 * @swagger
 * /api/companies/{companyId}/information:
 *   post:
 *     summary: Add comprehensive information to a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInformation'
 *     responses:
 *       201:
 *         description: Company information added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.post("/companies/:companyId/information", authMiddleware.authenticate, companyController.addCompanyInformation)

/**
 * @swagger
 * /api/companies/{companyId}/information:
 *   get:
 *     summary: Get comprehensive information about a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Company information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 financials:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalIncome:
 *                           type: number
 *                         totalExpenses:
 *                           type: number
 *                         netProfit:
 *                           type: number
 *                         transactionCount:
 *                           type: integer
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get("/companies/:companyId/information", authMiddleware.authenticate, companyController.getCompanyInformation)

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard data endpoints
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: detailed
 *         schema:
 *           type: boolean
 *         description: Whether to include detailed information
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Time period for financial data
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dashboard'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get("/dashboard", authMiddleware.authenticate, dashboardController.getDashboard)

/**
 * @swagger
 * /api/dashboard/clients/{clientId}:
 *   get:
 *     summary: Get detailed client information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Client details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.get("/dashboard/clients/:clientId", authMiddleware.authenticate, dashboardController.getClientDetails)

/**
 * @swagger
 * /api/dashboard/products/{productId}:
 *   get:
 *     summary: Get detailed product information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get("/dashboard/products/:productId", authMiddleware.authenticate, dashboardController.getProductDetails)

/**
 * @swagger
 * /api/dashboard/financials:
 *   get:
 *     summary: Get financial data with filtering options
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *     responses:
 *       200:
 *         description: Financial data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get("/dashboard/financials", authMiddleware.authenticate, dashboardController.getFinancialData)

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time chat system endpoints
 */

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: Create a new chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRoomCreate'
 *     responses:
 *       201:
 *         description: Chat room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoomResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.post("/chat/rooms", authMiddleware.authenticate, chatController.createRoom)

/**
 * @swagger
 * /api/chat/private:
 *   post:
 *     summary: Create or get existing private chat with a company member
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivateChatCreate'
 *     responses:
 *       200:
 *         description: Private chat retrieved (already exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoomResponse'
 *       201:
 *         description: Private chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoomResponse'
 *       400:
 *         description: Invalid input data (cannot chat with yourself)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (both users must be company members)
 *       500:
 *         description: Server error
 */
router.post("/chat/private", authMiddleware.authenticate, chatController.createPrivateChat)

/**
 * @swagger
 * /api/chat/members/{companyId}:
 *   get:
 *     summary: Get company members available for chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *     responses:
 *       200:
 *         description: List of company members with online status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CompanyMemberResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       500:
 *         description: Server error
 */
router.get("/chat/members/:companyId", authMiddleware.authenticate, chatController.getCompanyMembers)

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: Get all chat rooms for user's companies
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filter by specific company ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of rooms to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of rooms to skip
 *       - in: query
 *         name: includePrivate
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include private chats in results
 *     responses:
 *       200:
 *         description: List of chat rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatRoomResponse'
 *                 total:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/chat/rooms", authMiddleware.authenticate, chatController.getRooms)

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   get:
 *     summary: Get specific chat room details
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     responses:
 *       200:
 *         description: Chat room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoomResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in room)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get("/chat/rooms/:roomId", authMiddleware.authenticate, chatController.getRoom)

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   put:
 *     summary: Update chat room details
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoomResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.put("/chat/rooms/:roomId", authMiddleware.authenticate, chatController.updateRoom)

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   delete:
 *     summary: Delete chat room (admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.delete("/chat/rooms/:roomId", authMiddleware.authenticate, chatController.deleteRoom)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   post:
 *     summary: Send a message to chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessageCreate'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessageResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in room)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.post("/chat/rooms/:roomId/messages", authMiddleware.authenticate, chatController.sendMessage)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: Get messages from chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this timestamp
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages after this timestamp
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessageResponse'
 *                 total:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *                 roomInfo:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     participantCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in room)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get("/chat/rooms/:roomId/messages", authMiddleware.authenticate, chatController.getMessages)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages/{messageId}:
 *   put:
 *     summary: Edit a message (sender only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessageResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not message sender or message too old)
 *       404:
 *         description: Message or room not found
 *       500:
 *         description: Server error
 */
router.put("/chat/rooms/:roomId/messages/:messageId", authMiddleware.authenticate, chatController.editMessage)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages/{messageId}:
 *   delete:
 *     summary: Delete a message (sender or admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the message
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Message or room not found
 *       500:
 *         description: Server error
 */
router.delete("/chat/rooms/:roomId/messages/:messageId", authMiddleware.authenticate, chatController.deleteMessage)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants:
 *   post:
 *     summary: Add participants to chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatParticipantAdd'
 *     responses:
 *       201:
 *         description: Participants added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 added:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatParticipantResponse'
 *                 skipped:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       reason:
 *                         type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Room not found or some users not found
 *       500:
 *         description: Server error
 */
router.post("/chat/rooms/:roomId/participants", authMiddleware.authenticate, chatController.addParticipants)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants:
 *   get:
 *     summary: Get all participants in chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *       - in: query
 *         name: includeOffline
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include offline participants
 *     responses:
 *       200:
 *         description: List of participants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 participants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatParticipantResponse'
 *                 onlineCount:
 *                   type: integer
 *                 totalCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in room)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get("/chat/rooms/:roomId/participants", authMiddleware.authenticate, chatController.getParticipants)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants/{userId}:
 *   put:
 *     summary: Update participant role (admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       200:
 *         description: Participant role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatParticipantResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Room or participant not found
 *       500:
 *         description: Server error
 */
router.put("/chat/rooms/:roomId/participants/:userId", authMiddleware.authenticate, chatController.updateParticipant)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants/{userId}:
 *   delete:
 *     summary: Remove participant from chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to remove
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions or trying to remove self)
 *       404:
 *         description: Room or participant not found
 *       500:
 *         description: Server error
 */
router.delete("/chat/rooms/:roomId/participants/:userId", authMiddleware.authenticate, chatController.removeParticipant)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/join:
 *   post:
 *     summary: Join a chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     responses:
 *       200:
 *         description: Successfully joined room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatParticipantResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in same company as room)
 *       404:
 *         description: Room not found
 *       409:
 *         description: Already a participant
 *       500:
 *         description: Server error
 */
router.post("/chat/rooms/:roomId/join", authMiddleware.authenticate, chatController.joinRoom)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/leave:
 *   post:
 *     summary: Leave a chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     responses:
 *       200:
 *         description: Successfully left room
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (cannot leave if you're the only admin)
 *       404:
 *         description: Room not found or not a participant
 *       500:
 *         description: Server error
 */
router.post("/chat/rooms/:roomId/leave", authMiddleware.authenticate, chatController.leaveRoom)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/typing:
 *   post:
 *     summary: Send typing indicator
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isTyping
 *             properties:
 *               isTyping:
 *                 type: boolean
 *                 description: Whether user is currently typing
 *     responses:
 *       200:
 *         description: Typing indicator sent successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in room)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.post("/chat/rooms/:roomId/typing", authMiddleware.authenticate, chatController.sendTypingIndicator)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: integer
 *                 description: ID of the last read message (optional, defaults to latest)
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in room)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.post("/chat/rooms/:roomId/read", authMiddleware.authenticate, chatController.markAsRead)

/**
 * @swagger
 * /api/chat/search:
 *   get:
 *     summary: Search messages across all accessible rooms
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: integer
 *         description: Limit search to specific room
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         $ref: '#/components/schemas/ChatMessageResponse'
 *                       room:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                       relevanceScore:
 *                         type: number
 *                 total:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *       400:
 *         description: Invalid search query
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/chat/search", authMiddleware.authenticate, chatController.searchMessages)

/**
 * @swagger
 * tags:
 *   name: Kanban
 *   description: Kanban board and task management endpoints
 */

/**
 * @swagger
 * /api/kanban/boards:
 *   get:
 *     summary: Get all Kanban boards for a company
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *     responses:
 *       200:
 *         description: List of Kanban boards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/KanbanBoard'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       500:
 *         description: Server error
 */
router.get("/kanban/boards", authMiddleware.authenticate, kanbanController.getBoards)

/**
 * @swagger
 * /api/kanban/boards:
 *   post:
 *     summary: Create a new Kanban board
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/KanbanBoardCreate'
 *               - type: object
 *                 required:
 *                   - companyId
 *                 properties:
 *                   companyId:
 *                     type: integer
 *     responses:
 *       201:
 *         description: Kanban board created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KanbanBoard'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       500:
 *         description: Server error
 */
router.post("/kanban/boards", authMiddleware.authenticate, kanbanController.createBoard)

/**
 * @swagger
 * /api/kanban/tasks:
 *   get:
 *     summary: Get tasks for a company with filtering options
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, inProgress, done]
 *         description: Filter by task status
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: integer
 *         description: Filter by assignee ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *       - in: query
 *         name: boardId
 *         schema:
 *           type: integer
 *         description: Filter by board ID
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 total:
 *                   type: integer
 *                 filters:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       500:
 *         description: Server error
 */
router.get("/kanban/tasks", authMiddleware.authenticate, kanbanController.getTasks)

/**
 * @swagger
 * /api/kanban/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/TaskCreate'
 *               - type: object
 *                 required:
 *                   - companyId
 *                 properties:
 *                   companyId:
 *                     type: integer
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       500:
 *         description: Server error
 */
router.post("/kanban/tasks", authMiddleware.authenticate, kanbanController.createTask)

/**
 * @swagger
 * /api/kanban/tasks/{taskId}:
 *   put:
 *     summary: Update a task
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdate'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put("/kanban/tasks/:taskId", authMiddleware.authenticate, kanbanController.updateTask)

/**
 * @swagger
 * /api/kanban/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the task
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete("/kanban/tasks/:taskId", authMiddleware.authenticate, kanbanController.deleteTask)

/**
 * @swagger
 * /api/kanban/tasks/positions:
 *   put:
 *     summary: Update task positions (for drag and drop)
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - taskId
 *                     - status
 *                     - position
 *                   properties:
 *                     taskId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [todo, inProgress, done]
 *                     position:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Task positions updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 */
router.put("/kanban/tasks/positions", authMiddleware.authenticate, kanbanController.updateTaskPositions)

/**
 * @swagger
 * /api/kanban/tasks/{taskId}/comments:
 *   get:
 *     summary: Get comments for a task
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the task
 *     responses:
 *       200:
 *         description: List of task comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaskComment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/kanban/tasks/:taskId/comments", authMiddleware.authenticate, kanbanController.getTaskComments)

/**
 * @swagger
 * /api/kanban/tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCommentCreate'
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskComment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post("/kanban/tasks/:taskId/comments", authMiddleware.authenticate, kanbanController.addTaskComment)

/**
 * @swagger
 * /api/kanban/statistics:
 *   get:
 *     summary: Get task statistics for a company
 *     tags: [Kanban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Task statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTasks:
 *                   type: integer
 *                 completedTasks:
 *                   type: integer
 *                 inProgressTasks:
 *                   type: integer
 *                 todoTasks:
 *                   type: integer
 *                 completionRate:
 *                   type: number
 *                 averageCompletionTime:
 *                   type: number
 *                 tasksByPriority:
 *                   type: object
 *                 tasksByAssignee:
 *                   type: array
 *                 tasksCreatedOverTime:
 *                   type: array
 *                 tasksCompletedOverTime:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       500:
 *         description: Server error
 */
router.get("/kanban/statistics", authMiddleware.authenticate, kanbanController.getTaskStatistics)

// Import additional controllers
const clientController = require("../controllers/clientController")
const productController = require("../controllers/productController")
const financialController = require("../controllers/financialController")

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client management endpoints
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients for user's company
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search clients by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of clients with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClientResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in any company)
 *       500:
 *         description: Server error
 */
router.get("/clients", authMiddleware.authenticate, clientController.getClients)

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 client:
 *                   $ref: '#/components/schemas/ClientResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in any company)
 *       409:
 *         description: Client with this email already exists
 *       500:
 *         description: Server error
 */
router.post("/clients", authMiddleware.authenticate, clientController.createClient)

/**
 * @swagger
 * /api/clients/{clientId}:
 *   get:
 *     summary: Get a single client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the client
 *     responses:
 *       200:
 *         description: Client details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/ClientResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.get("/clients/:clientId", authMiddleware.authenticate, clientController.getClient)

/**
 * @swagger
 * /api/clients/{clientId}:
 *   put:
 *     summary: Update a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 client:
 *                   $ref: '#/components/schemas/ClientResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Client not found
 *       409:
 *         description: Client with this email already exists
 *       500:
 *         description: Server error
 */
router.put("/clients/:clientId", authMiddleware.authenticate, clientController.updateClient)

/**
 * @swagger
 * /api/clients/{clientId}:
 *   delete:
 *     summary: Delete a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the client
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.delete("/clients/:clientId", authMiddleware.authenticate, clientController.deleteClient)

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products for user's company
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of products with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in any company)
 *       500:
 *         description: Server error
 */
router.get("/products", authMiddleware.authenticate, productController.getProducts)

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/ProductResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in any company)
 *       409:
 *         description: Product with this name already exists
 *       500:
 *         description: Server error
 */
router.post("/products", authMiddleware.authenticate, productController.createProduct)

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     summary: Get a single product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/ProductResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get("/products/:productId", authMiddleware.authenticate, productController.getProduct)

/**
 * @swagger
 * /api/products/{productId}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/ProductResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put("/products/:productId", authMiddleware.authenticate, productController.updateProduct)

/**
 * @swagger
 * /api/products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete("/products/:productId", authMiddleware.authenticate, productController.deleteProduct)

/**
 * @swagger
 * tags:
 *   name: Financial
 *   description: Financial transaction management endpoints
 */

/**
 * @swagger
 * /api/financial/transactions:
 *   get:
 *     summary: Get all transactions for user's company
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *         description: Filter by client ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of transactions with summary and pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TransactionResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     netProfit:
 *                       type: number
 *                     transactionCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in any company)
 *       500:
 *         description: Server error
 */
router.get("/financial/transactions", authMiddleware.authenticate, financialController.getTransactions)

/**
 * @swagger
 * /api/financial/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               clientId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in any company)
 *       404:
 *         description: Client not found (if clientId provided)
 *       500:
 *         description: Server error
 */
router.post("/financial/transactions", authMiddleware.authenticate, financialController.createTransaction)

/**
 * @swagger
 * /api/financial/transactions/{transactionId}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               clientId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Transaction or client not found
 *       500:
 *         description: Server error
 */
router.put("/financial/transactions/:transactionId", authMiddleware.authenticate, financialController.updateTransaction)

/**
 * @swagger
 * /api/financial/transactions/{transactionId}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the transaction
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in company)
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/financial/transactions/:transactionId",
  authMiddleware.authenticate,
  financialController.deleteTransaction,
)

/**
 * @swagger
 * /api/financial/summary:
 *   get:
 *     summary: Get financial summary and reports
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for summary
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (overrides period)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (overrides period)
 *     responses:
 *       200:
 *         description: Financial summary with chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     netProfit:
 *                       type: number
 *                     transactionCount:
 *                       type: integer
 *                     period:
 *                       type: string
 *                 chartData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       income:
 *                         type: number
 *                       expenses:
 *                         type: number
 *                       profit:
 *                         type: number
 *                 recentTransactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TransactionResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user not in any company)
 *       500:
 *         description: Server error
 */
router.get("/financial/summary", authMiddleware.authenticate, financialController.getFinancialSummary)

module.exports = router
