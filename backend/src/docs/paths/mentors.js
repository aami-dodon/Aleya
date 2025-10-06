const {
  bearerSecurity,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} = require("./helpers");

module.exports = {
  "/api/mentors": {
    get: {
      tags: ["Mentors"],
      summary: "List mentors",
      security: bearerSecurity,
      parameters: [
        {
          name: "q",
          in: "query",
          schema: { type: "string" },
          description: "Search mentors by name, email, or expertise.",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100 },
          description: "Maximum mentors to return (default 25).",
        },
      ],
      responses: {
        200: jsonResponse("Mentor list", {
          type: "object",
          properties: {
            mentors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  expertise: { type: "string", nullable: true },
                  availability: { type: "string", nullable: true },
                  bio: { type: "string", nullable: true },
                },
              },
            },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
  },
  "/api/mentors/requests": {
    get: {
      tags: ["Mentors"],
      summary: "List mentorship requests",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Mentorship requests", {
          type: "object",
          properties: {
            requests: {
              type: "array",
              items: { $ref: "#/components/schemas/MentorRequest" },
            },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
    post: {
      tags: ["Mentors"],
      summary: "Submit a mentorship request",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["mentorId"],
              properties: {
                mentorId: { type: "integer" },
                message: { type: "string", maxLength: 1000 },
              },
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Request submitted", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: validationErrorResponse("Invalid request payload"),
        401: errorResponse("Authentication required"),
        404: errorResponse("Mentor not found"),
      },
    },
  },
  "/api/mentors/requests/{id}/accept": {
    post: {
      tags: ["Mentors"],
      summary: "Mentor accepts a mentorship request",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Request updated", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        401: errorResponse("Authentication required"),
        404: errorResponse("Request not found or already processed"),
      },
    },
  },
  "/api/mentors/requests/{id}/confirm": {
    post: {
      tags: ["Mentors"],
      summary: "Journaler confirms a mentorship link",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Link established", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        401: errorResponse("Authentication required"),
        404: errorResponse("Request not ready for confirmation"),
      },
    },
  },
  "/api/mentors/requests/{id}/decline": {
    post: {
      tags: ["Mentors"],
      summary: "Decline a mentorship request",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Request declined", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        401: errorResponse("Authentication required"),
        404: errorResponse("Request not found"),
      },
    },
  },
  "/api/mentors/links/{mentorId}": {
    delete: {
      tags: ["Mentors"],
      summary: "Journaler disconnects from a mentor",
      security: bearerSecurity,
      parameters: [
        {
          name: "mentorId",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["password"],
              properties: {
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Link removed", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: validationErrorResponse("Invalid payload or mentor id"),
        401: errorResponse("Authentication required or incorrect password"),
        404: errorResponse("Mentor link not found"),
      },
    },
  },
  "/api/mentors/mentees": {
    get: {
      tags: ["Mentors"],
      summary: "Mentor views mentee list and latest activity",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Mentees", {
          type: "object",
          properties: {
            mentees: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  establishedAt: { type: "string", format: "date-time", nullable: true },
                  latestEntry: {
                    type: "object",
                    nullable: true,
                    properties: {
                      id: { type: "integer" },
                      entryDate: { type: "string", format: "date" },
                      mood: { type: "string", nullable: true },
                      summary: { type: "string", nullable: true },
                      sharedLevel: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
  },
  "/api/mentors/support-network": {
    get: {
      tags: ["Mentors"],
      summary: "List mentors connected to the authenticated journaler",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Support network", {
          type: "object",
          properties: {
            mentors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
  },
  "/api/mentors/panic-alerts": {
    post: {
      tags: ["Mentors"],
      summary: "Trigger a mentor panic alert",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["mentorId", "message"],
              properties: {
                mentorId: { type: "integer" },
                message: { type: "string", minLength: 1, maxLength: 500 },
              },
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Alert captured", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            notification: { type: "object", nullable: true },
          },
        }),
        400: validationErrorResponse("Invalid alert payload"),
        401: errorResponse("Authentication required"),
        404: errorResponse("Mentor link not found"),
      },
    },
  },
};
