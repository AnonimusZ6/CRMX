const { Task, KanbanBoard, TaskComment, User, Company, CompanyMember } = require("../models")
const { Op } = require("sequelize")

const kanbanController = {
  // Get all boards for a company
  getBoards: async (req, res) => {
    try {
      const { companyId } = req.query
      const userId = req.user.id

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      const boards = await KanbanBoard.findAll({
        where: { companyId, isActive: true },
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "lastName", "email"],
          },
          {
            model: Task,
            as: "tasks",
            attributes: ["id", "status"],
          },
        ],
        order: [["createdAt", "DESC"]],
      })

      // Add task counts to each board
      const boardsWithCounts = boards.map((board) => {
        const tasks = board.tasks || []
        return {
          ...board.toJSON(),
          taskCounts: {
            todo: tasks.filter((t) => t.status === "todo").length,
            in_progress: tasks.filter((t) => t.status === "in_progress").length,
            done: tasks.filter((t) => t.status === "done").length,
            total: tasks.length,
          },
        }
      })

      res.json({
        boards: boardsWithCounts,
        total: boards.length,
      })
    } catch (error) {
      console.error("Error fetching boards:", error)
      res.status(500).json({ error: "Failed to fetch boards" })
    }
  },

  // Create a new board
  createBoard: async (req, res) => {
    try {
      const { name, description, companyId, settings } = req.body
      const userId = req.user.id

      if (!name || !companyId) {
        return res.status(400).json({ error: "Name and company ID are required" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      const board = await KanbanBoard.create({
        name,
        description,
        companyId,
        createdBy: userId,
        settings: settings || undefined,
      })

      const boardWithCreator = await KanbanBoard.findByPk(board.id, {
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "lastName", "email"],
          },
        ],
      })

      res.status(201).json(boardWithCreator)
    } catch (error) {
      console.error("Error creating board:", error)
      res.status(500).json({ error: "Failed to create board" })
    }
  },

  // Get tasks for a board or company
  getTasks: async (req, res) => {
    try {
      const { companyId, boardId, status, assigneeId, authorId, priority, search } = req.query
      const userId = req.user.id

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      // Build where clause
      const whereClause = { companyId }

      if (boardId) whereClause.boardId = boardId
      if (status) whereClause.status = status
      if (assigneeId) whereClause.assigneeId = assigneeId
      if (authorId) whereClause.authorId = authorId
      if (priority) whereClause.priority = priority

      if (search) {
        whereClause[Op.or] = [{ title: { [Op.iLike]: `%${search}%` } }, { content: { [Op.iLike]: `%${search}%` } }]
      }

      const tasks = await Task.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "lastName", "email"],
          },
          {
            model: User,
            as: "assignee",
            attributes: ["id", "name", "lastName", "email"],
          },
          {
            model: TaskComment,
            as: "comments",
            include: [
              {
                model: User,
                as: "author",
                attributes: ["id", "name", "lastName", "email"],
              },
            ],
            order: [["createdAt", "ASC"]],
          },
        ],
        order: [
          ["position", "ASC"],
          ["createdAt", "DESC"],
        ],
      })

      // Group tasks by status
      const tasksByStatus = {
        todo: tasks.filter((task) => task.status === "todo"),
        in_progress: tasks.filter((task) => task.status === "in_progress"),
        done: tasks.filter((task) => task.status === "done"),
      }

      res.json({
        tasks: tasksByStatus,
        total: tasks.length,
        summary: {
          todo: tasksByStatus.todo.length,
          in_progress: tasksByStatus.in_progress.length,
          done: tasksByStatus.done.length,
        },
      })
    } catch (error) {
      console.error("Error fetching tasks:", error)
      res.status(500).json({ error: "Failed to fetch tasks" })
    }
  },

  // Create a new task
  createTask: async (req, res) => {
    try {
      const {
        title,
        content,
        status = "todo",
        priority = "medium",
        companyId,
        boardId,
        assigneeId,
        dueDate,
        tags,
        estimatedHours,
      } = req.body
      const userId = req.user.id

      if (!title || !content || !companyId) {
        return res.status(400).json({ error: "Title, content, and company ID are required" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      // If assigneeId is provided, check if they're a company member
      if (assigneeId) {
        const assigneeMembership = await CompanyMember.findOne({
          where: { userId: assigneeId, companyId },
        })

        if (!assigneeMembership) {
          return res.status(400).json({ error: "Assignee must be a company member" })
        }
      }

      // Get the next position for the status column
      const maxPosition = await Task.max("position", {
        where: { companyId, status, boardId: boardId || null },
      })

      const task = await Task.create({
        title,
        content,
        status,
        priority,
        companyId,
        boardId: boardId || null,
        authorId: userId,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        tags: tags || [],
        estimatedHours: estimatedHours || null,
        position: (maxPosition || 0) + 1,
      })

      const taskWithRelations = await Task.findByPk(task.id, {
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "lastName", "email"],
          },
          {
            model: User,
            as: "assignee",
            attributes: ["id", "name", "lastName", "email"],
          },
        ],
      })

      res.status(201).json(taskWithRelations)
    } catch (error) {
      console.error("Error creating task:", error)
      res.status(500).json({ error: "Failed to create task" })
    }
  },

  // Update a task
  updateTask: async (req, res) => {
    try {
      const { taskId } = req.params
      const { title, content, status, priority, assigneeId, dueDate, tags, estimatedHours, actualHours } = req.body
      const userId = req.user.id

      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "lastName", "email"],
          },
        ],
      })

      if (!task) {
        return res.status(404).json({ error: "Task not found" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId: task.companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      // Check if user can edit this task (author, assignee, or admin)
      const canEdit =
        task.authorId === userId ||
        task.assigneeId === userId ||
        membership.role === "admin" ||
        membership.role === "owner"

      if (!canEdit) {
        return res.status(403).json({ error: "You don't have permission to edit this task" })
      }

      // If assigneeId is provided, check if they're a company member
      if (assigneeId !== undefined && assigneeId !== null) {
        const assigneeMembership = await CompanyMember.findOne({
          where: { userId: assigneeId, companyId: task.companyId },
        })

        if (!assigneeMembership) {
          return res.status(400).json({ error: "Assignee must be a company member" })
        }
      }

      // Update fields
      const updateData = {}
      if (title !== undefined) updateData.title = title
      if (content !== undefined) updateData.content = content
      if (status !== undefined) updateData.status = status
      if (priority !== undefined) updateData.priority = priority
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId
      if (dueDate !== undefined) updateData.dueDate = dueDate
      if (tags !== undefined) updateData.tags = tags
      if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours
      if (actualHours !== undefined) updateData.actualHours = actualHours

      // If status is being changed to 'done', set completedAt
      if (status === "done" && task.status !== "done") {
        updateData.completedAt = new Date()
      } else if (status !== "done" && task.status === "done") {
        updateData.completedAt = null
      }

      await task.update(updateData)

      const updatedTask = await Task.findByPk(taskId, {
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "lastName", "email"],
          },
          {
            model: User,
            as: "assignee",
            attributes: ["id", "name", "lastName", "email"],
          },
        ],
      })

      res.json(updatedTask)
    } catch (error) {
      console.error("Error updating task:", error)
      res.status(500).json({ error: "Failed to update task" })
    }
  },

  // Update task positions (for drag and drop)
  updateTaskPositions: async (req, res) => {
    try {
      const { tasks } = req.body
      const userId = req.user.id

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "Tasks array is required" })
      }

      // Verify all tasks belong to companies the user has access to
      const taskIds = tasks.map((t) => t.id)
      const existingTasks = await Task.findAll({
        where: { id: taskIds },
        include: [
          {
            model: Company,
            as: "company",
            include: [
              {
                model: CompanyMember,
                as: "members",
                where: { userId },
                required: true,
              },
            ],
          },
        ],
      })

      if (existingTasks.length !== tasks.length) {
        return res.status(403).json({ error: "Access denied to some tasks" })
      }

      // Update positions and status
      const updatePromises = tasks.map(({ id, status, position }) =>
        Task.update({ status, position }, { where: { id } }),
      )

      await Promise.all(updatePromises)

      res.json({ message: "Task positions updated successfully" })
    } catch (error) {
      console.error("Error updating task positions:", error)
      res.status(500).json({ error: "Failed to update task positions" })
    }
  },

  // Delete a task
  deleteTask: async (req, res) => {
    try {
      const { taskId } = req.params
      const userId = req.user.id

      const task = await Task.findByPk(taskId)

      if (!task) {
        return res.status(404).json({ error: "Task not found" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId: task.companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      // Check if user can delete this task (author or admin)
      const canDelete = task.authorId === userId || membership.role === "admin" || membership.role === "owner"

      if (!canDelete) {
        return res.status(403).json({ error: "You don't have permission to delete this task" })
      }

      // Delete associated comments first
      await TaskComment.destroy({ where: { taskId } })

      // Delete the task
      await task.destroy()

      res.json({ message: "Task deleted successfully" })
    } catch (error) {
      console.error("Error deleting task:", error)
      res.status(500).json({ error: "Failed to delete task" })
    }
  },

  // Get task comments
  getTaskComments: async (req, res) => {
    try {
      const { taskId } = req.params
      const userId = req.user.id

      const task = await Task.findByPk(taskId)

      if (!task) {
        return res.status(404).json({ error: "Task not found" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId: task.companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      const comments = await TaskComment.findAll({
        where: { taskId },
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "lastName", "email"],
          },
        ],
        order: [["createdAt", "ASC"]],
      })

      res.json({ comments })
    } catch (error) {
      console.error("Error fetching task comments:", error)
      res.status(500).json({ error: "Failed to fetch task comments" })
    }
  },

  // Add a comment to a task
  addTaskComment: async (req, res) => {
    try {
      const { taskId } = req.params
      const { content } = req.body
      const userId = req.user.id

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Comment content is required" })
      }

      const task = await Task.findByPk(taskId)

      if (!task) {
        return res.status(404).json({ error: "Task not found" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId: task.companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      const comment = await TaskComment.create({
        taskId,
        authorId: userId,
        content: content.trim(),
      })

      const commentWithAuthor = await TaskComment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "lastName", "email"],
          },
        ],
      })

      res.status(201).json(commentWithAuthor)
    } catch (error) {
      console.error("Error adding task comment:", error)
      res.status(500).json({ error: "Failed to add task comment" })
    }
  },

  // Get task statistics
  getTaskStatistics: async (req, res) => {
    try {
      const { companyId, boardId, period = "month" } = req.query
      const userId = req.user.id

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" })
      }

      // Check if user is member of the company
      const membership = await CompanyMember.findOne({
        where: { userId, companyId },
      })

      if (!membership) {
        return res.status(403).json({ error: "Access denied to this company" })
      }

      // Calculate date range based on period
      const now = new Date()
      let startDate
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "quarter":
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          break
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const whereClause = { companyId, createdAt: { [Op.gte]: startDate } }
      if (boardId) whereClause.boardId = boardId

      const tasks = await Task.findAll({
        where: whereClause,
        attributes: ["status", "priority", "authorId", "assigneeId", "createdAt", "completedAt"],
      })

      const statistics = {
        total: tasks.length,
        byStatus: {
          todo: tasks.filter((t) => t.status === "todo").length,
          in_progress: tasks.filter((t) => t.status === "in_progress").length,
          done: tasks.filter((t) => t.status === "done").length,
        },
        byPriority: {
          low: tasks.filter((t) => t.priority === "low").length,
          medium: tasks.filter((t) => t.priority === "medium").length,
          high: tasks.filter((t) => t.priority === "high").length,
          urgent: tasks.filter((t) => t.priority === "urgent").length,
        },
        completionRate:
          tasks.length > 0 ? ((tasks.filter((t) => t.status === "done").length / tasks.length) * 100).toFixed(1) : 0,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      }

      res.json(statistics)
    } catch (error) {
      console.error("Error fetching task statistics:", error)
      res.status(500).json({ error: "Failed to fetch task statistics" })
    }
  },
}

module.exports = kanbanController
