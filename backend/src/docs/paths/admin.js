const {
  bearerSecurity,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} = require("./helpers");

module.exports = {
  "/api/admin/overview": {
    get: {
      tags: ["Admin"],
      summary: "Administrative overview metrics",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Overview counts", {
          type: "object",
          properties: {
            users: { type: "object" },
            forms: { type: "object" },
            entries: { type: "object" },
            mentorLinks: { type: "object" },
            pendingRequests: { type: "integer" },
          },
        }),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
      },
    },
  },
  "/api/admin/forms": {
    get: {
      tags: ["Admin"],
      summary: "List all forms with assignment counts",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Form catalogue", {
          type: "object",
          properties: {
            forms: {
              type: "array",
              items: {
                allOf: [
                  { $ref: "#/components/schemas/Form" },
                  {
                    type: "object",
                    properties: {
                      created_by_name: { type: "string", nullable: true },
                      assignments: { type: "integer" },
                    },
                  },
                ],
              },
            },
          },
        }),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
      },
    },
  },
  "/api/admin/forms/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Update form metadata",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                description: { type: "string", nullable: true },
                visibility: { type: "string", enum: ["default", "mentor", "admin"] },
                isDefault: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Form updated", {
          type: "object",
          properties: {
            form: { $ref: "#/components/schemas/Form" },
          },
        }),
        400: validationErrorResponse("No valid updates supplied"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
        404: errorResponse("Form not found"),
      },
    },
    delete: {
      tags: ["Admin"],
      summary: "Delete a non-default form",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Form deleted", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: errorResponse("Invalid form id or default form"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
        404: errorResponse("Form not found"),
      },
    },
  },
  "/api/admin/mentors": {
    get: {
      tags: ["Admin"],
      summary: "List mentors with mentee metadata",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Mentors", {
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
                  mentee_count: { type: "integer" },
                  mentees: {
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
              },
            },
          },
        }),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
      },
    },
  },
  "/api/admin/journalers": {
    get: {
      tags: ["Admin"],
      summary: "List journalers with mentor relationships",
      security: bearerSecurity,
      parameters: [
        { name: "q", in: "query", schema: { type: "string" } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100 },
        },
      ],
      responses: {
        200: jsonResponse("Journalers", {
          type: "object",
          properties: {
            journalers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
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
                  mentor_count: { type: "integer" },
                },
              },
            },
          },
        }),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
      },
    },
  },
  "/api/admin/mentor-links": {
    post: {
      tags: ["Admin"],
      summary: "Create a mentor link",
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
                journalerId: { type: "integer" },
                journalerEmail: { type: "string", format: "email" },
              },
              oneOf: [{ required: ["journalerId"] }, { required: ["journalerEmail"] }],
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Link created", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            link: {
              type: "object",
              properties: {
                mentorId: { type: "integer" },
                journalerId: { type: "integer" },
              },
            },
          },
        }),
        400: validationErrorResponse("Invalid link payload"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
        404: errorResponse("Mentor or journaler not found"),
      },
    },
  },
  "/api/admin/mentor-links/{mentorId}/{journalerId}": {
    delete: {
      tags: ["Admin"],
      summary: "Remove a mentor link",
      security: bearerSecurity,
      parameters: [
        { name: "mentorId", in: "path", required: true, schema: { type: "integer" } },
        { name: "journalerId", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Link removed", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: errorResponse("Invalid path parameters"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
        404: errorResponse("Mentor link not found"),
      },
    },
  },
  "/api/admin/mentors/{id}": {
    delete: {
      tags: ["Admin"],
      summary: "Delete a mentor",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Mentor deleted", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: errorResponse("Invalid mentor id"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
        404: errorResponse("Mentor not found"),
      },
    },
  },
  "/api/admin/journals": {
    get: {
      tags: ["Admin"],
      summary: "Search journal entries",
      security: bearerSecurity,
      parameters: [
        { name: "q", in: "query", schema: { type: "string" } },
        {
          name: "sharedLevel",
          in: "query",
          schema: { type: "string", enum: ["private", "mood", "summary", "full"] },
        },
        { name: "mood", in: "query", schema: { type: "string" } },
        { name: "journalerId", in: "query", schema: { type: "integer" } },
        { name: "mentorId", in: "query", schema: { type: "integer" } },
        { name: "formId", in: "query", schema: { type: "integer" } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 200 },
        },
      ],
      responses: {
        200: jsonResponse("Journal entries", {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: { $ref: "#/components/schemas/AdminJournalEntry" },
            },
          },
        }),
        400: errorResponse("Invalid filter criteria"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
      },
    },
  },
  "/api/admin/journals/{id}": {
    delete: {
      tags: ["Admin"],
      summary: "Delete a journal entry",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Entry deleted", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: errorResponse("Invalid journal entry id"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
        404: errorResponse("Journal entry not found"),
      },
    },
  },
  "/api/admin/journalers/{id}": {
    delete: {
      tags: ["Admin"],
      summary: "Delete a journaler",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Journaler deleted", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: errorResponse("Invalid journaler id"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Admin role required"),
        404: errorResponse("Journaler not found"),
      },
    },
  },
};
