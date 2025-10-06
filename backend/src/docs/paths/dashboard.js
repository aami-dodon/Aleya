const { bearerSecurity, jsonResponse, errorResponse } = require("./helpers");

module.exports = {
  "/api/dashboard/journaler": {
    get: {
      tags: ["Dashboard"],
      summary: "Journaler dashboard insights",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Dashboard metrics", {
          type: "object",
          properties: {
            streak: { type: "integer" },
            averageMood: { type: "number", nullable: true },
            moodDescriptor: { type: "string", nullable: true },
            trend: { type: "array", items: { type: "object" } },
            sleepTrend: { type: "array", items: { type: "object" } },
            energyTrend: { type: "array", items: { type: "object" } },
            highlights: { type: "array", items: { type: "object" } },
            lastEntry: { type: "object", nullable: true },
            stats: { type: "object" },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
  },
  "/api/dashboard/mentor": {
    get: {
      tags: ["Dashboard"],
      summary: "Mentor dashboard overview",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Dashboard metrics", {
          type: "object",
          properties: {
            overview: {
              type: "object",
              properties: {
                menteeCount: { type: "integer" },
                pendingRequests: { type: "integer" },
              },
            },
            mentees: { type: "array", items: { type: "object" } },
            recentEntries: { type: "array", items: { type: "object" } },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
  },
};
