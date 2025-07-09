const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express")

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM API",
      version: "1.0.0",
      description: "A comprehensive CRM system API with chat functionality",
      contact: {
        name: "API Support",
        email: "support@crm.com",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // Path to the API docs
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

const setupSwagger = (app) => {
  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "CRM API Documentation",
    }),
  )

  // JSON endpoint for the swagger spec
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.send(swaggerSpec)
  })
}

module.exports = setupSwagger