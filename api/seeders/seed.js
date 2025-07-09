const {
    User,
    Company,
    CompanyMember,
    Product,
    ProductAnalysis,
    Client,
    ProductionSchedule,
    Transaction,
  } = require("../models")
  const bcrypt = require("bcryptjs")
  const sequelize = require("../config/database")
  
  async function seed() {
    try {
      // Clear existing data
      await sequelize.sync({ force: true })
      console.log("Database cleared")
  
      // Create companies
      const companies = await Company.bulkCreate([
        { name: "Tech Innovations", address: "123 Tech Blvd, San Francisco, CA" },
        { name: "Digital Solutions", address: "456 Digital Ave, New York, NY" },
        { name: "Future Systems", address: "789 Future St, Austin, TX" },
      ])
      console.log("Companies created")
  
      // Create users
      const users = await User.bulkCreate([
        {
          name: "Admin User",
          email: "admin@example.com",
          password: "password123",
        },
        {
          name: "Manager User",
          email: "manager@example.com",
          password: "password123",
        },
        {
          name: "Employee User",
          email: "employee@example.com",
          password: "password123",
        },
        {
          name: "John Smith",
          email: "john@example.com",
          password: "password123",
        },
        {
          name: "Jane Doe",
          email: "jane@example.com",
          password: "password123",
        },
      ])
      console.log("Users created")
  
      // Create company members
      await CompanyMember.bulkCreate([
        { userId: 1, companyId: 1, role: "owner" },
        { userId: 2, companyId: 1, role: "admin" },
        { userId: 3, companyId: 1, role: "member" },
        { userId: 4, companyId: 2, role: "owner" },
        { userId: 5, companyId: 3, role: "owner" },
      ])
      console.log("Company members created")
  
      // Create products
      const products = await Product.bulkCreate([
        {
          name: "Enterprise CRM",
          description: "Customer relationship management system for large enterprises",
          companyId: 1,
        },
        { name: "Mobile App Suite", description: "Suite of mobile applications for business productivity", companyId: 1 },
        { name: "Cloud Storage Solution", description: "Secure cloud storage for business data", companyId: 1 },
        { name: "AI Analytics Platform", description: "Advanced analytics using artificial intelligence", companyId: 1 },
        { name: "E-commerce Platform", description: "Complete e-commerce solution for online businesses", companyId: 2 },
        { name: "Security Suite", description: "Comprehensive security solution for businesses", companyId: 3 },
      ])
      console.log("Products created")
  
      // Create product analyses
      await ProductAnalysis.bulkCreate([
        {
          totalCost: 150000,
          salesLastQuarter: 250000,
          technicalImplementation: "Java backend with React frontend, deployed on AWS",
          scalability: "Highly scalable with microservices architecture",
          mainFeatures: "Contact management, sales pipeline, reporting, integration with email and calendar",
          productId: 1,
        },
        {
          totalCost: 80000,
          salesLastQuarter: 120000,
          technicalImplementation: "React Native for cross-platform compatibility",
          scalability: "Moderate scalability with cloud backend",
          mainFeatures: "Task management, document editing, team collaboration, offline mode",
          productId: 2,
        },
        {
          totalCost: 100000,
          salesLastQuarter: 180000,
          technicalImplementation: "Distributed storage system with encryption",
          scalability: "Highly scalable with distributed architecture",
          mainFeatures: "Secure storage, file sharing, version control, access management",
          productId: 3,
        },
        {
          totalCost: 200000,
          salesLastQuarter: 150000,
          technicalImplementation: "Python backend with TensorFlow for AI models",
          scalability: "Scalable with containerized deployment",
          mainFeatures: "Predictive analytics, data visualization, automated reporting, custom dashboards",
          productId: 4,
        },
        {
          totalCost: 120000,
          salesLastQuarter: 220000,
          technicalImplementation: "Node.js backend with Vue.js frontend",
          scalability: "Highly scalable with microservices",
          mainFeatures: "Product catalog, shopping cart, payment processing, order management",
          productId: 5,
        },
        {
          totalCost: 90000,
          salesLastQuarter: 130000,
          technicalImplementation: "C++ core with web interface",
          scalability: "Moderate scalability",
          mainFeatures: "Threat detection, firewall, encryption, access control",
          productId: 6,
        },
      ])
      console.log("Product analyses created")
  
      // Create clients
      const clients = await Client.bulkCreate([
        {
          name: "Acme Corporation",
          email: "contact@acme.com",
          phone: "555-123-4567",
          address: "123 Business St, Chicago, IL",
          companyId: 1,
          totalSpent: 75000,
          lastPurchaseDate: new Date(2023, 5, 15),
        },
        {
          name: "Global Enterprises",
          email: "info@globalent.com",
          phone: "555-987-6543",
          address: "456 Enterprise Ave, Boston, MA",
          companyId: 1,
          totalSpent: 120000,
          lastPurchaseDate: new Date(2023, 7, 22),
        },
        {
          name: "Tech Innovators",
          email: "contact@techinnovators.com",
          phone: "555-456-7890",
          address: "789 Innovation Blvd, Seattle, WA",
          companyId: 1,
          totalSpent: 95000,
          lastPurchaseDate: new Date(2023, 8, 10),
        },
        {
          name: "Digital Solutions Inc",
          email: "info@digitalsolutions.com",
          phone: "555-789-0123",
          address: "321 Digital Dr, Austin, TX",
          companyId: 1,
          totalSpent: 150000,
          lastPurchaseDate: new Date(2023, 9, 5),
        },
        {
          name: "Future Systems",
          email: "contact@futuresystems.com",
          phone: "555-234-5678",
          address: "654 Future Ave, Denver, CO",
          companyId: 2,
          totalSpent: 85000,
          lastPurchaseDate: new Date(2023, 6, 18),
        },
        {
          name: "Innovative Tech",
          email: "info@innovativetech.com",
          phone: "555-345-6789",
          address: "987 Tech St, Portland, OR",
          companyId: 3,
          totalSpent: 110000,
          lastPurchaseDate: new Date(2023, 8, 30),
        },
      ])
      console.log("Clients created")
  
      // Create production schedules
      const now = new Date()
      await ProductionSchedule.bulkCreate([
        {
          productId: 1,
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60),
          quantity: 100,
          status: "in_progress",
          notes: "On schedule, no issues reported",
        },
        {
          productId: 2,
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 45),
          quantity: 200,
          status: "in_progress",
          notes: "Minor delays due to component shortages",
        },
        {
          productId: 3,
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 75),
          quantity: 150,
          status: "planned",
          notes: "Awaiting final approval",
        },
        {
          productId: 4,
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
          quantity: 50,
          status: "completed",
          notes: "Completed ahead of schedule",
        },
        {
          productId: 5,
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 45),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
          quantity: 75,
          status: "in_progress",
          notes: "On schedule",
        },
        {
          productId: 6,
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 50),
          quantity: 120,
          status: "in_progress",
          notes: "Proceeding as planned",
        },
      ])
      console.log("Production schedules created")
  
      // Create transactions
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      const transactions = []
  
      // Generate income transactions for the past year (one per month per client)
      for (let i = 0; i < 12; i++) {
        for (const client of clients) {
          if (client.companyId === 1) {
            // Only for company 1
            const transactionDate = new Date(
              lastYear.getFullYear(),
              lastYear.getMonth() + i,
              Math.floor(Math.random() * 28) + 1,
            )
            const amount = Math.floor(Math.random() * 20000) + 5000
  
            transactions.push({
              companyId: 1,
              clientId: client.id,
              amount: amount,
              type: "income",
              description: `Service payment from ${client.name}`,
              date: transactionDate,
            })
          }
        }
      }
  
      // Generate expense transactions for the past year (operational expenses)
      const expenseCategories = ["Salaries", "Office Rent", "Equipment", "Marketing", "Utilities", "Software Licenses"]
      for (let i = 0; i < 12; i++) {
        for (const category of expenseCategories) {
          const transactionDate = new Date(
            lastYear.getFullYear(),
            lastYear.getMonth() + i,
            Math.floor(Math.random() * 28) + 1,
          )
          const amount = Math.floor(Math.random() * 10000) + 2000
  
          transactions.push({
            companyId: 1,
            amount: amount,
            type: "expense",
            description: `${category} expense`,
            date: transactionDate,
          })
        }
      }
  
      await Transaction.bulkCreate(transactions)
      console.log("Transactions created")
  
      console.log("Seed completed successfully")
    } catch (error) {
      console.error("Seed failed:", error)
    } finally {
      process.exit()
    }
  }
  
  seed()
  