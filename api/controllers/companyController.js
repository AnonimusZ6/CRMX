const { Company, CompanyMember, User, Client, Product, ProductAnalysis, Transaction } = require("../models");
const sequelize = require("../config/database");

exports.createCompany = async (req, res) => {
  try {
    const { name, shortDescription, fullDescription, address, location, phoneNumber, corporateEmail } = req.body;
    const userId = req.user.id;

    if (!name || !address) {
      return res.status(400).json({ error: "Название и адрес компании обязательны" });
    }

    const company = await Company.create({
      name,
      shortDescription,
      fullDescription,
      address,
      location,
      phoneNumber,
      corporateEmail,
    });

    // Делаем пользователя владельцем компании
    await CompanyMember.create({
      userId,
      companyId: company.id,
      role: "owner",
    });

    res.status(201).json({
      id: company.id,
      name: company.name,
      shortDescription: company.shortDescription,
      fullDescription: company.fullDescription,
      address: company.address,
      location: company.location,
      phoneNumber: company.phoneNumber,
      corporateEmail: company.corporateEmail,
      createdAt: company.createdAt,
      role: "owner",
    });
  } catch (error) {
    console.error("Ошибка создания компании:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

exports.addCompanyMember = async (req, res) => {
  try {
    const { email, role, name, lastName, phone, city, position, department } = req.body;
    const { companyId } = req.params; // Получаем companyId из параметров пути
    const currentUserId = req.user.id;
    const tempPassword = Math.random().toString(36).slice(-8);

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Проверяем права текущего пользователя
    const currentMember = await CompanyMember.findOne({
      where: { userId: currentUserId, companyId: parsedCompanyId },
    });

    // Only owner, director, or admin can add members
    if (!currentMember || !["owner", "admin", "director"].includes(currentMember.role)) {
      return res.status(403).json({ error: "Недостаточно прав" });
    }

    // Only owner or director can add directors
    if (role === "director" && !["owner", "director"].includes(currentMember.role)) {
      return res.status(403).json({ error: "Только владелец или директор может добавлять директоров" });
    }

    // Находим или создаем пользователя
    let userToAdd = await User.findOne({ where: { email } });

    if (!userToAdd) {
      if (!name) {
        return res.status(400).json({ error: "Name is required when creating new user" });
      }

      // Создаем нового пользователя
      userToAdd = await User.create({
        email,
        name: name || "",
        lastName: lastName || "",
        phone: phone || "",
        city: city || "",
        position: position || "",
        department: department || "",
        password: tempPassword,
      });
    }

    // Проверяем, не является ли пользователь уже членом компании
    const existingMember = await CompanyMember.findOne({
      where: { userId: userToAdd.id, companyId: parsedCompanyId },
    });

    if (existingMember) {
      return res.status(409).json({ error: "Пользователь уже в компании" });
    }

    // Добавляем пользователя в компанию
    const companyMember = await CompanyMember.create({
      userId: userToAdd.id,
      companyId: parsedCompanyId,
      role: role || "member",
    });

    res.status(201).json({
      userId: userToAdd.id,
      companyId: parsedCompanyId,
      role: companyMember.role,
      user: {
        id: userToAdd.id,
        name: userToAdd.name,
        lastName: userToAdd.lastName,
        email: userToAdd.email,
        phone: userToAdd.phone,
        position: userToAdd.position,
        department: userToAdd.department,
        city: userToAdd.city,
        password: tempPassword,
      },
    });
  } catch (error) {
    console.error("Ошибка добавления участника:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

exports.getUserCompanies = async (req, res) => {
  try {
    const userId = req.user.id;

    const companies = await CompanyMember.findAll({
      where: { userId },
      include: [
        {
          model: Company,
          as: "company", // Исправлено: добавлен псевдоним as: "company"
          attributes: [
            "id",
            "name",
            "shortDescription",
            "fullDescription",
            "address",
            "location",
            "phoneNumber",
            "corporateEmail",
            "createdAt",
          ],
        },
      ],
      attributes: ["role"],
    });

    res.status(200).json(
      companies.map((c) => ({
        id: c.company.id, // Исправлено: c.company вместо c.Company
        name: c.company.name,
        shortDescription: c.company.shortDescription,
        fullDescription: c.company.fullDescription,
        address: c.company.address,
        location: c.company.location,
        phoneNumber: c.company.phoneNumber,
        corporateEmail: c.company.corporateEmail,
        role: c.role,
        createdAt: c.company.createdAt,
      })),
    );
  } catch (error) {
    console.error("Ошибка получения компаний:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

exports.getCompanyMembers = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    // Validate companyId
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Проверяем, что пользователь состоит в компании
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: Number.parseInt(companyId) },
    });

    if (!userMember) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const members = await CompanyMember.findAll({
      where: { companyId: Number.parseInt(companyId) },
      include: [
        {
          model: User,
          as: "user", // Исправлено: добавлен псевдоним as: "user"
          attributes: ["id", "name", "lastName", "email", "phone", "position", "department", "city"],
        },
      ],
      attributes: ["role", "createdAt"],
    });

    res.status(200).json(
      members.map((m) => ({
        id: m.user.id, // Исправлено: m.user вместо m.User
        name: m.user.name,
        lastName: m.user.lastName,
        email: m.user.email,
        phone: m.user.phone,
        position: m.user.position,
        department: m.user.department,
        city: m.user.city,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    );
  } catch (error) {
    console.error("Ошибка получения участников:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

exports.addCompanyClients = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { companyId } = req.params;
    const { clients } = req.body;
    const userId = req.user.id;

    // Validate companyId
    if (!companyId) {
      await transaction.rollback();
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: parsedCompanyId },
      transaction,
    });

    if (!userMember || !["owner", "director", "admin"].includes(userMember.role)) {
      await transaction.rollback();
      return res.status(403).json({ error: "Недостаточно прав для добавления клиентов" });
    }

    // Verify company exists
    const company = await Company.findByPk(parsedCompanyId, { transaction });
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Process clients if provided
    const createdClients = [];
    if (clients && Array.isArray(clients) && clients.length > 0) {
      for (const clientData of clients) {
        // Validate required fields
        if (!clientData.name || !clientData.email) {
          await transaction.rollback();
          return res.status(400).json({ error: "Имя и email клиента обязательны" });
        }

        // Create client
        const client = await Client.create(
          {
            ...clientData,
            companyId: parsedCompanyId,
            totalSpent: clientData.totalSpent || 0,
            lastPurchaseDate: clientData.lastPurchaseDate || null,
          },
          { transaction },
        );

        createdClients.push(client);
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({ error: "Необходимо предоставить массив клиентов" });
    }

    // Commit transaction
    await transaction.commit();

    // Return success response with created data
    res.status(201).json({
      message: "Клиенты успешно добавлены",
      data: {
        clients: createdClients,
      },
    });
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error("Ошибка добавления клиентов:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

exports.getCompanyClients = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    // Validate companyId
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: parsedCompanyId },
    });

    if (!userMember) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Verify company exists
    const company = await Company.findByPk(parsedCompanyId);
    if (!company) {
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Get all clients for the company
    const clients = await Client.findAll({
      where: { companyId: parsedCompanyId },
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "address",
        "totalSpent",
        "lastPurchaseDate",
        "createdAt",
        "updatedAt",
      ],
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      companyId: parsedCompanyId,
      companyName: company.name,
      totalClients: clients.length,
      clients: clients,
    });
  } catch (error) {
    console.error("Ошибка получения клиентов компании:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

exports.addCompanyProducts = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { companyId } = req.params;
    const { products } = req.body;
    const userId = req.user.id;

    // Validate companyId
    if (!companyId) {
      await transaction.rollback();
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: parsedCompanyId },
      transaction,
    });

    if (!userMember || !["owner", "director", "admin"].includes(userMember.role)) {
      await transaction.rollback();
      return res.status(403).json({ error: "Недостаточно прав для добавления продуктов" });
    }

    // Verify company exists
    const company = await Company.findByPk(parsedCompanyId, { transaction });
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Process products if provided
    const createdProducts = [];
    if (products && Array.isArray(products) && products.length > 0) {
      for (const productData of products) {
        // Validate required fields
        if (!productData.name || !productData.description) {
          await transaction.rollback();
          return res.status(400).json({ error: "Название и описание продукта обязательны" });
        }

        // Create product
        const product = await Product.create(
          {
            name: productData.name,
            description: productData.description,
            companyId: parsedCompanyId,
          },
          { transaction },
        );

        // Create product analysis if provided
        if (productData.analysis) {
          await ProductAnalysis.create(
            {
              ...productData.analysis,
              productId: product.id,
            },
            { transaction },
          );
        }

        createdProducts.push(product);
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({ error: "Необходимо предоставить массив продуктов" });
    }

    // Commit transaction
    await transaction.commit();

    // Return success response with created data
    res.status(201).json({
      message: "Продукты успешно добавлены",
      data: {
        products: createdProducts,
      },
    });
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error("Ошибка добавления продуктов:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

exports.getCompanyProducts = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    // Validate companyId
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: parsedCompanyId },
    });

    if (!userMember) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Verify company exists
    const company = await Company.findByPk(parsedCompanyId);
    if (!company) {
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Get all products for the company with their analysis
    const products = await Product.findAll({
      where: { companyId: parsedCompanyId },
      include: [
        {
          model: ProductAnalysis,
          attributes: ["totalCost", "salesLastQuarter", "technicalImplementation", "scalability", "mainFeatures"],
        },
      ],
      attributes: ["id", "name", "description", "createdAt", "updatedAt"],
      order: [["name", "ASC"]],
    });

    // Format products to include analysis data
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      analysis: product.ProductAnalysis
        ? {
            totalCost: product.ProductAnalysis.totalCost,
            salesLastQuarter: product.ProductAnalysis.salesLastQuarter,
            technicalImplementation: product.ProductAnalysis.technicalImplementation,
            scalability: product.ProductAnalysis.scalability,
            mainFeatures: product.ProductAnalysis.mainFeatures,
          }
        : null,
    }));

    res.status(200).json({
      companyId: parsedCompanyId,
      companyName: company.name,
      totalProducts: products.length,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Ошибка получения продуктов компании:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

exports.addCompanyTransactions = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { companyId } = req.params;
    const { transactions } = req.body;
    const userId = req.user.id;

    // Validate companyId
    if (!companyId) {
      await transaction.rollback();
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: parsedCompanyId },
      transaction,
    });

    if (!userMember || !["owner", "director", "admin"].includes(userMember.role)) {
      await transaction.rollback();
      return res.status(403).json({ error: "Недостаточно прав для добавления транзакций" });
    }

    // Verify company exists
    const company = await Company.findByPk(parsedCompanyId, { transaction });
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Process transactions if provided
    const createdTransactions = [];
    if (transactions && Array.isArray(transactions) && transactions.length > 0) {
      for (const transactionData of transactions) {
        // Validate required fields
        if (transactionData.amount === undefined || !transactionData.type) {
          await transaction.rollback();
          return res.status(400).json({ error: "Сумма и тип транзакции обязательны" });
        }

        // Validate transaction type
        if (!["income", "expense"].includes(transactionData.type)) {
          await transaction.rollback();
          return res.status(400).json({ error: "Тип транзакции должен быть 'income' или 'expense'" });
        }

        // Set clientId to null by default or use the provided value without validation
        const clientId = transactionData.clientId || null;

        // Create transaction
        const newTransaction = await Transaction.create(
          {
            companyId: parsedCompanyId,
            clientId,
            amount: transactionData.amount,
            type: transactionData.type,
            description: transactionData.description || null,
            date: transactionData.date || new Date(),
          },
          { transaction },
        );

        createdTransactions.push(newTransaction);
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({ error: "Необходимо предоставить массив транзакций" });
    }

    // Commit transaction
    await transaction.commit();

    // Return success response with created data
    res.status(201).json({
      message: "Транзакции успешно добавлены",
      data: {
        transactions: createdTransactions,
      },
    });
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error("Ошибка добавления транзакций:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

exports.getCompanyTransactions = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    const { startDate, endDate, type, clientId } = req.query;

    // Validate companyId
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: parsedCompanyId },
    });

    if (!userMember) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Verify company exists
    const company = await Company.findByPk(parsedCompanyId);
    if (!company) {
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Build filter for transactions
    const filter = { companyId: parsedCompanyId };

    // Add date filters if provided
    if (startDate) {
      filter.date = { ...filter.date, [sequelize.Op.gte]: new Date(startDate) };
    }

    if (endDate) {
      filter.date = { ...filter.date, [sequelize.Op.lte]: new Date(endDate) };
    }

    // Add type filter if provided
    if (type && ["income", "expense"].includes(type)) {
      filter.type = type;
    }

    // Add clientId filter if provided
    if (clientId) {
      filter.clientId = Number.parseInt(clientId);
    }

    // Get all transactions for the company with optional client information
    const transactions = await Transaction.findAll({
      where: filter,
      include: [
        {
          model: Client,
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      attributes: ["id", "amount", "type", "description", "date", "clientId", "createdAt", "updatedAt"],
      order: [["date", "DESC"]],
    });

    // Calculate summary
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    // Format transactions to include client data
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      date: t.date,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      client: t.Client
        ? {
            id: t.Client.id,
            name: t.Client.name,
            email: t.Client.email,
          }
        : null,
    }));

    res.status(200).json({
      companyId: parsedCompanyId,
      companyName: company.name,
      totalTransactions: transactions.length,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        type: type || null,
        clientId: clientId ? Number.parseInt(clientId) : null,
      },
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Ошибка получения транзакций компании:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

// New method to add comprehensive company information
exports.addCompanyInformation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { companyId } = req.params;
    const { clients, products, transactions } = req.body;
    const userId = req.user.id;

    // Validate companyId
    if (!companyId) {
      await transaction.rollback();
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Convert companyId to number to ensure consistent comparison
    const parsedCompanyId = Number.parseInt(companyId);

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId: parsedCompanyId },
      transaction,
    });

    if (!userMember || !["owner", "director", "admin"].includes(userMember.role)) {
      await transaction.rollback();
      return res.status(403).json({ error: "Недостаточно прав для добавления информации о компании" });
    }

    // Verify company exists
    const company = await Company.findByPk(parsedCompanyId, { transaction });
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Process clients first to ensure they exist before transactions reference them
    const createdClients = [];
    const clientIdMap = {}; // Map to store client IDs from request to database IDs
    const requestClientIds = []; // Store all client IDs from the request for validation

    if (clients && Array.isArray(clients) && clients.length > 0) {
      for (let i = 0; i < clients.length; i++) {
        const clientData = clients[i];

        // Validate required fields
        if (!clientData.name || !clientData.email) {
          await transaction.rollback();
          return res.status(400).json({ error: "Имя и email клиента обязательны" });
        }

        // Create client
        const client = await Client.create(
          {
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone || "",
            address: clientData.address || "",
            companyId: parsedCompanyId,
            totalSpent: clientData.totalSpent || 0,
            lastPurchaseDate: clientData.lastPurchaseDate || null,
          },
          { transaction },
        );

        // Store the mapping between the client ID in the request and the new database ID
        // Handle both string and numeric IDs
        if (clientData.id !== undefined) {
          clientIdMap[String(clientData.id)] = client.id;
          requestClientIds.push(String(clientData.id));
        }

        // Also map the array index to the client ID
        clientIdMap[String(i)] = client.id;
        requestClientIds.push(String(i));

        createdClients.push(client);
      }
    }

    // Process products
    const createdProducts = [];
    if (products && Array.isArray(products) && products.length > 0) {
      for (const productData of products) {
        // Validate required fields
        if (!productData.name || !productData.description) {
          await transaction.rollback();
          return res.status(400).json({ error: "Название и описание продукта обязательны" });
        }

        // Create product
        const product = await Product.create(
          {
            name: productData.name,
            description: productData.description,
            companyId: parsedCompanyId,
          },
          { transaction },
        );

        // Create product analysis if provided
        if (productData.analysis) {
          await ProductAnalysis.create(
            {
              ...productData.analysis,
              productId: product.id,
            },
            { transaction },
          );
        }

        createdProducts.push(product);
      }
    }

    // Process transactions after clients have been created
    const createdTransactions = [];
    if (transactions && Array.isArray(transactions) && transactions.length > 0) {
      for (const transactionData of transactions) {
        // Validate required fields
        if (transactionData.amount === undefined || !transactionData.type) {
          await transaction.rollback();
          return res.status(400).json({ error: "Сумма и тип транзакции обязательны" });
        }

        // Validate transaction type
        if (!["income", "expense"].includes(transactionData.type)) {
          await transaction.rollback();
          return res.status(400).json({ error: "Тип транзакции должен быть 'income' или 'expense'" });
        }

        // Handle clientId mapping or set to null if not provided
        let clientId = null;
        if (transactionData.clientId !== undefined && transactionData.clientId !== null) {
          const clientIdStr = String(transactionData.clientId);

          // Check if the clientId is in our mapping (from newly created clients)
          if (clientIdMap[clientIdStr] !== undefined) {
            clientId = clientIdMap[clientIdStr];
          } else {
            // If not in our mapping, check if it's an existing client in the database
            const clientExists = await Client.findOne({
              where: {
                id: transactionData.clientId,
                companyId: parsedCompanyId,
              },
              transaction,
            });

            if (!clientExists) {
              // Provide detailed error message with debugging info
              await transaction.rollback();
              return res.status(400).json({
                error: `Клиент с ID ${transactionData.clientId} не найден. Транзакции должны ссылаться на существующих клиентов.`,
                debug: {
                  requestedClientId: transactionData.clientId,
                  clientIdType: typeof transactionData.clientId,
                  availableClientIds: requestClientIds,
                  clientIdMap: clientIdMap,
                  createdClientIds: createdClients.map((c) => c.id),
                },
              });
            }
            clientId = transactionData.clientId;
          }
        }

        // Create transaction
        const newTransaction = await Transaction.create(
          {
            companyId: parsedCompanyId,
            clientId,
            amount: transactionData.amount,
            type: transactionData.type,
            description: transactionData.description || null,
            date: transactionData.date || new Date(),
          },
          { transaction },
        );

        createdTransactions.push(newTransaction);
      }
    }

    // Commit transaction
    await transaction.commit();

    // Return success response with created data
    res.status(201).json({
      message: "Информация о компании успешно добавлена",
      data: {
        clients: createdClients,
        products: createdProducts,
        transactions: createdTransactions,
        // Include the clientIdMap to help the client understand the mapping
        clientIdMap: clientIdMap,
        requestClientIds: requestClientIds,
      },
    });
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error("Ошибка добавления информации о компании:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};

// Get company information
exports.getCompanyInformation = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    // Check user permissions
    const userMember = await CompanyMember.findOne({
      where: { userId, companyId },
    });

    if (!userMember) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Get company with related data
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: "Компания не найдена" });
    }

    // Get clients with all fields that match the POST /clients endpoint
    const clients = await Client.findAll({
      where: { companyId },
      attributes: ["id", "name", "email", "phone", "address", "totalSpent", "lastPurchaseDate"],
    });

    // Get products with analysis with all fields that match the POST /products endpoint
    const products = await Product.findAll({
      where: { companyId },
      include: [
        {
          model: ProductAnalysis,
          attributes: ["totalCost", "salesLastQuarter", "technicalImplementation", "scalability", "mainFeatures"],
        },
      ],
      attributes: ["id", "name", "description"],
    });

    // Format products to match the structure of the POST /products endpoint
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      analysis: product.ProductAnalysis
        ? {
            totalCost: product.ProductAnalysis.totalCost,
            salesLastQuarter: product.ProductAnalysis.salesLastQuarter,
            technicalImplementation: product.ProductAnalysis.technicalImplementation,
            scalability: product.ProductAnalysis.scalability,
            mainFeatures: product.ProductAnalysis.mainFeatures,
          }
        : null,
    }));

    // Get transactions with all fields that match the POST /transactions endpoint
    const transactions = await Transaction.findAll({
      where: { companyId },
      attributes: ["id", "amount", "type", "description", "date", "clientId"],
      order: [["date", "DESC"]],
    });

    // Get company members
    const members = await CompanyMember.findAll({
      where: { companyId },
      include: [
        {
          model: User,
          as: "user", // Исправлено: добавлен псевдоним as: "user"
          attributes: ["id", "name", "lastName", "email"],
        },
      ],
      attributes: ["role"],
    });

    // Calculate financial summary
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      company: {
        id: company.id,
        name: company.name,
        shortDescription: company.shortDescription,
        fullDescription: company.fullDescription,
        address: company.address,
        location: company.location,
        phoneNumber: company.phoneNumber,
        corporateEmail: company.corporateEmail,
      },
      clients: clients,
      products: formattedProducts,
      transactions: transactions,
      financials: {
        summary: {
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          transactionCount: transactions.length,
        },
      },
      members: members.map((m) => ({
        id: m.user.id, // Исправлено: m.user вместо m.User
        name: m.user.name,
        lastName: m.user.lastName,
        email: m.user.email,
        role: m.role,
      })),
    });
  } catch (error) {
    console.error("Ошибка получения информации о компании:", error);
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
};