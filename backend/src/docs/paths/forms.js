const {
  bearerSecurity,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} = require("./helpers");

module.exports = {
  "/api/forms/default": {
    get: {
      tags: ["Forms"],
      summary: "Fetch the default journal form",
      responses: {
        200: jsonResponse("Default form", {
          type: "object",
          properties: {
            form: { $ref: "#/components/schemas/Form" },
          },
        }),
        404: errorResponse("Default form not found"),
      },
    },
  },
  "/api/forms": {
    get: {
      tags: ["Forms"],
      summary: "List forms available to the authenticated user",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Forms", {
          type: "object",
          properties: {
            forms: {
              type: "array",
              items: { $ref: "#/components/schemas/Form" },
            },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
    post: {
      tags: ["Forms"],
      summary: "Create a mentor-authored journal form",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "fields"],
              properties: {
                title: { type: "string" },
                description: { type: "string", nullable: true },
                fields: {
                  type: "array",
                  minItems: 1,
                  items: { $ref: "#/components/schemas/FormField" },
                },
              },
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Form created", {
          type: "object",
          properties: {
            form: { $ref: "#/components/schemas/Form" },
          },
        }),
        400: validationErrorResponse("Invalid form payload"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Mentor role required"),
      },
    },
  },
  "/api/forms/{formId}": {
    put: {
      tags: ["Forms"],
      summary: "Update a mentor-authored form",
      security: bearerSecurity,
      parameters: [
        {
          name: "formId",
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
              required: ["title", "fields"],
              properties: {
                title: { type: "string" },
                description: { type: "string", nullable: true },
                fields: {
                  type: "array",
                  items: { $ref: "#/components/schemas/FormField" },
                },
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
        400: validationErrorResponse("Invalid form payload"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Only the author can update the form"),
        404: errorResponse("Form not found"),
      },
    },
    delete: {
      tags: ["Forms"],
      summary: "Delete a mentor-authored form",
      security: bearerSecurity,
      parameters: [
        {
          name: "formId",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
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
        403: errorResponse("Only the author can delete the form"),
        404: errorResponse("Form not found"),
      },
    },
  },
  "/api/forms/{formId}/assign": {
    post: {
      tags: ["Forms"],
      summary: "Assign a form to a journaler",
      security: bearerSecurity,
      parameters: [
        {
          name: "formId",
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
              required: ["journalerId"],
              properties: {
                journalerId: { type: "integer" },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Form assignment stored", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: validationErrorResponse("Invalid journaler id"),
        401: errorResponse("Authentication required"),
        403: errorResponse("Mentor link missing or insufficient role"),
        404: errorResponse("Form not found"),
      },
    },
  },
  "/api/forms/{formId}/assign/{journalerId}": {
    delete: {
      tags: ["Forms"],
      summary: "Remove a form assignment",
      security: bearerSecurity,
      parameters: [
        {
          name: "formId",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
        {
          name: "journalerId",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        200: jsonResponse("Assignment removed", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        401: errorResponse("Authentication required"),
        404: errorResponse("Assignment not found"),
      },
    },
  },
  "/api/forms/{formId}/assignment": {
    delete: {
      tags: ["Forms"],
      summary: "Journaler unlinks a form assignment",
      security: bearerSecurity,
      parameters: [
        {
          name: "formId",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: {
        200: jsonResponse("Form unlinked", {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
        }),
        400: errorResponse("Default form cannot be unlinked"),
        401: errorResponse("Authentication required"),
        404: errorResponse("Assignment not found"),
      },
    },
  },
};
