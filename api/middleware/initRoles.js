const { Role } = require("../models")

const roles = [
  {
    name: "creator",
    permissions: {
      company: ["create", "read", "update", "delete"],
      users: ["create", "read", "update", "delete"],
      products: ["create", "read", "update", "delete"],
    },
  },
  {
    name: "admin",
    permissions: {
      company: ["read", "update"],
      users: ["create", "read", "update"],
      products: ["create", "read", "update", "delete"],
    },
  },
  {
    name: "manager",
    permissions: {
      company: ["read"],
      users: ["read"],
      products: ["create", "read", "update"],
    },
  },
  {
    name: "employee",
    permissions: {
      company: ["read"],
      users: ["read"],
      products: ["read"],
    },
  },
]

module.exports = async () => {
  try {
    for (const role of roles) {
      await Role.findOrCreate({
        where: { name: role.name },
        defaults: role,
      })
    }
    console.log("Roles initialized successfully")
  } catch (error) {
    console.error("Error initializing roles:", error)
  }
}
