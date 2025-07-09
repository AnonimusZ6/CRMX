const { User, Company, CompanyMember } = require("../models");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const sequelize = require("../config/database");

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// Функция для удаления null/undefined значений и замены их на пустые строки
const sanitizeResponse = (data) => {
  if (data === null || data === undefined) {
    return "";
  }

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeResponse);
  }

  const result = {};
  for (const key in data) {
    const value = data[key];
    result[key] = value === null || value === undefined ? "" : sanitizeResponse(value);
  }
  return result;
};

exports.register = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, lastName, email, password, phone, city, userType, company } = req.body;

    if (!name || !email || !password) {
      await transaction.rollback();
      return res.status(400).json({ error: "Имя, email и пароль обязательны" });
    }

    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }

    // Create user
    const user = await User.create(
      {
        name,
        lastName: lastName || "",
        email,
        password,
        phone: phone || "",
        city: city || "",
      },
      { transaction }
    );

    let companyData = null;

    if (company) {
      const {
        name: companyName,
        shortDescription = "",
        fullDescription = "",
        address,
        location = "",
        phoneNumber = "",
        corporateEmail = "",
      } = company;

      if (!companyName || !address) {
        await transaction.rollback();
        return res.status(400).json({ error: "Название и адрес компании обязательны" });
      }

      const newCompany = await Company.create(
        {
          name: companyName,
          shortDescription,
          fullDescription,
          address,
          location,
          phoneNumber,
          corporateEmail,
        },
        { transaction }
      );

      const role = userType === "director" ? "director" : userType === "owner" ? "owner" : "member";

      await CompanyMember.create(
        {
          userId: user.id,
          companyId: newCompany.id,
          role: role,
        },
        { transaction }
      );

      companyData = {
        id: newCompany.id,
        name: newCompany.name,
        shortDescription: newCompany.shortDescription,
        fullDescription: newCompany.fullDescription,
        address: newCompany.address,
        location: newCompany.location,
        phoneNumber: newCompany.phoneNumber,
        corporateEmail: newCompany.corporateEmail,
        role: role,
      };
    }

    await transaction.commit();

    const token = generateToken(user);

    // Add a comment in the response to indicate that companyId should be stored in localStorage
    const responseData = sanitizeResponse({
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        createdAt: user.createdAt,
      },
      company: companyData,
      token,
      message: companyData ? "Store companyId in localStorage for future use" : null,
    });

    res.status(201).json(responseData);
  } catch (error) {
    await transaction.rollback();
    console.error("Ошибка регистрации:", error);
    res.status(500).json({
      error: "Ошибка сервера при регистрации",
      details: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.comparePassword(password)) {
      return res.status(401).json({ error: "Неверные учетные данные" });
    }

    const companyMember = await CompanyMember.findOne({
      where: { userId: user.id },
      include: [
        {
          model: Company,
          as: "company", // Исправлен псевдоним на "company" (с маленькой буквы)
          attributes: [
            "id",
            "name",
            "shortDescription",
            "fullDescription",
            "address",
            "location",
            "phoneNumber",
            "corporateEmail",
          ],
        },
      ],
    });

    const token = generateToken(user);

    const responseData = sanitizeResponse({
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        createdAt: user.createdAt,
      },
      company: companyMember
        ? {
            id: companyMember.company.id, // Исправлено: company вместо Company
            name: companyMember.company.name,
            shortDescription: companyMember.company.shortDescription,
            fullDescription: companyMember.company.fullDescription,
            address: companyMember.company.address,
            location: companyMember.company.location,
            phoneNumber: companyMember.company.phoneNumber,
            corporateEmail: companyMember.company.corporateEmail,
            role: companyMember.role,
          }
        : null,
      token,
      message: companyMember ? "Store companyId in localStorage for future use" : null,
    });

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Ошибка входа:", error);
    res.status(500).json({
      error: "Ошибка сервера при входе",
      details: error.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const companyMember = await CompanyMember.findOne({
      where: { userId: user.id },
      include: [
        {
          model: Company,
          as: "company", // Исправлен псевдоним на "company" (с маленькой буквы)
          attributes: [
            "id",
            "name",
            "shortDescription",
            "fullDescription",
            "address",
            "location",
            "phoneNumber",
            "corporateEmail",
          ],
        },
      ],
    });

    const response = sanitizeResponse({
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        position: user.position,
        department: user.department,
        city: user.city,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      company: companyMember
        ? {
            id: companyMember.company.id, // Исправлено: company вместо Company
            name: companyMember.company.name,
            shortDescription: companyMember.company.shortDescription,
            fullDescription: companyMember.company.fullDescription,
            address: companyMember.company.address,
            location: companyMember.company.location,
            phoneNumber: companyMember.company.phoneNumber,
            corporateEmail: companyMember.company.corporateEmail,
            role: companyMember.role,
          }
        : null,
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    res.status(500).json({
      error: "Ошибка сервера при получении профиля",
      details: error.message,
    });
  }
};