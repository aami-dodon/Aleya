const { jsonResponse, errorResponse } = require("./helpers");

module.exports = {
  "/api/health": {
    get: {
      tags: ["Health"],
      summary: "Check API health",
      description: "Returns a simple object confirming database connectivity.",
      responses: {
        200: jsonResponse("Service is healthy", {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            time: { type: "string", format: "date-time" },
          },
        }),
        500: errorResponse("Database connection failed"),
      },
    },
  },
};
