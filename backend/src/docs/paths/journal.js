const {
  bearerSecurity,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} = require("./helpers");

module.exports = {
  "/api/journal-entries": {
    post: {
      tags: ["Journal Entries"],
      summary: "Create a journal entry",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["formId", "responses"],
              properties: {
                formId: { type: "integer" },
                responses: {
                  type: "object",
                  additionalProperties: {},
                },
                sharedLevel: {
                  type: "string",
                  enum: ["private", "mood", "summary", "full"],
                },
              },
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Entry created", {
          type: "object",
          properties: {
            entry: { $ref: "#/components/schemas/JournalEntry" },
          },
        }),
        400: validationErrorResponse("Invalid entry payload"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Form assignment missing"),
        404: errorResponse("Form not found"),
      },
    },
    get: {
      tags: ["Journal Entries"],
      summary: "List journal entries",
      security: bearerSecurity,
      parameters: [
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100 },
          description: "Maximum entries to return (default 30).",
        },
        {
          name: "journalerId",
          in: "query",
          schema: { type: "integer" },
          description: "Required for mentors when fetching mentee entries.",
        },
      ],
      responses: {
        200: jsonResponse("Entries", {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: { $ref: "#/components/schemas/JournalEntry" },
            },
          },
        }),
        400: errorResponse("Missing journalerId for mentor"),
        401: errorResponse("Authentication required"),
        403: errorResponse("No mentorship link"),
      },
    },
  },
  "/api/journal-entries/{id}": {
    patch: {
      tags: ["Journal Entries"],
      summary: "Update an existing journal entry",
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
              required: ["responses"],
              properties: {
                responses: { type: "object", additionalProperties: {} },
                sharedLevel: {
                  type: "string",
                  enum: ["private", "mood", "summary", "full"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Entry updated", {
          type: "object",
          properties: {
            entry: { $ref: "#/components/schemas/JournalEntry" },
          },
        }),
        400: validationErrorResponse("Invalid entry payload"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Access denied"),
        404: errorResponse("Entry not found"),
      },
    },
    delete: {
      tags: ["Journal Entries"],
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
        400: errorResponse("Invalid entry id"),
        401: errorResponse("Authentication required"),
        404: errorResponse("Entry not found"),
      },
    },
    get: {
      tags: ["Journal Entries"],
      summary: "Fetch a single journal entry",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Entry", {
          type: "object",
          properties: {
            entry: { $ref: "#/components/schemas/JournalEntry" },
          },
        }),
        401: errorResponse("Authentication required"),
        403: errorResponse("Access denied"),
        404: errorResponse("Entry not found"),
      },
    },
  },
  "/api/journal-entries/export": {
    get: {
      tags: ["Journal Entries"],
      summary: "Export journal entries as JSON",
      security: bearerSecurity,
      parameters: [
        {
          name: "journalerId",
          in: "query",
          schema: { type: "integer" },
          description: "Required for mentors when exporting mentee entries.",
        },
      ],
      responses: {
        200: {
          description: "Exported file",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  generatedAt: { type: "string", format: "date-time" },
                  requester: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      role: { type: "string" },
                    },
                  },
                  journalerId: { type: "integer" },
                  entryCount: { type: "integer" },
                  entries: {
                    type: "array",
                    items: { $ref: "#/components/schemas/JournalEntry" },
                  },
                },
              },
            },
          },
        },
        400: errorResponse("Missing journalerId for mentor"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Access denied"),
      },
    },
  },
  "/api/journal-entries/{id}/comments": {
    get: {
      tags: ["Journal Entries"],
      summary: "List mentor comments on an entry",
      security: bearerSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      responses: {
        200: jsonResponse("Comments", {
          type: "object",
          properties: {
            comments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  comment: { type: "string" },
                  created_at: { type: "string", format: "date-time" },
                  mentor_id: { type: "integer" },
                  mentor_name: { type: "string" },
                },
              },
            },
          },
        }),
        400: errorResponse("Invalid entry id"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Access denied"),
        404: errorResponse("Entry not found"),
      },
    },
    post: {
      tags: ["Journal Entries"],
      summary: "Add a mentor comment to an entry",
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
              required: ["comment"],
              properties: {
                comment: { type: "string", minLength: 1, maxLength: 1000 },
              },
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Comment created", {
          type: "object",
          properties: {
            comment: {
              type: "object",
              properties: {
                id: { type: "integer" },
                comment: { type: "string" },
                created_at: { type: "string", format: "date-time" },
              },
            },
          },
        }),
        400: validationErrorResponse("Invalid comment"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Entry is private or no link"),
        404: errorResponse("Entry not found"),
      },
    },
  },
};
