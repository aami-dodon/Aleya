const {
  bearerSecurity,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} = require("./helpers");

module.exports = {
  "/api/auth/session": {
    get: {
      tags: ["Auth"],
      summary: "Retrieve the current deployment boot identifier",
      responses: {
        200: jsonResponse("Current boot identifier", {
          type: "object",
          properties: {
            bootId: { type: "string", nullable: true },
          },
        }),
      },
    },
  },
  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new journaler or mentor",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password", "confirmPassword", "name"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 8 },
                confirmPassword: { type: "string", minLength: 8 },
                name: { type: "string" },
                role: {
                  type: "string",
                  enum: ["journaler", "mentor"],
                  description: "Defaults to journaler when omitted.",
                },
                timezone: { type: "string" },
                mentorProfile: {
                  type: "object",
                  properties: {
                    expertise: { type: "string" },
                    availability: { type: "string" },
                    bio: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Account created and verification email dispatched", {
          type: "object",
          properties: {
            message: { type: "string" },
            email: { type: "string", format: "email" },
            verificationExpiresAt: { type: "string", format: "date-time" },
            verificationExpiresInHours: { type: "integer" },
          },
        }),
        400: validationErrorResponse("Invalid registration payload"),
        409: errorResponse("Email already registered"),
      },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Authenticate with email and password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("JWT token and user profile", {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        }),
        400: validationErrorResponse("Invalid login payload"),
        401: errorResponse("Invalid credentials"),
        403: errorResponse("Email verification required"),
      },
    },
  },
  "/api/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Request a password reset email",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: { type: "string", format: "email" },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Password reset email dispatched if the account exists", {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        }),
        400: validationErrorResponse("Invalid email supplied"),
        500: errorResponse("Unable to send reset email"),
      },
    },
  },
  "/api/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset a password using a token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["token", "password", "confirmPassword"],
              properties: {
                token: { type: "string" },
                password: { type: "string", minLength: 8 },
                confirmPassword: { type: "string", minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Password reset successful", {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        }),
        400: validationErrorResponse("Invalid reset payload or token"),
      },
    },
  },
  "/api/auth/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Confirm email verification",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["token"],
              properties: {
                token: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Verification status", {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        }),
        400: errorResponse("Invalid or expired verification link"),
      },
    },
  },
  "/api/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Fetch the authenticated user's profile",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Authenticated user", {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
    patch: {
      tags: ["Auth"],
      summary: "Update profile details",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                timezone: { type: "string" },
                password: { type: "string", minLength: 8 },
                mentorProfile: {
                  type: "object",
                  properties: {
                    expertise: { type: "string" },
                    availability: { type: "string" },
                    bio: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: jsonResponse("Updated user", {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
          },
        }),
        400: errorResponse("No updates provided"),
        401: errorResponse("Authentication required"),
      },
    },
    delete: {
      tags: ["Auth"],
      summary: "Delete the authenticated account",
      security: bearerSecurity,
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
        200: jsonResponse("Account deleted", {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        }),
        400: errorResponse("Password is required"),
        401: errorResponse("Incorrect password or authentication required"),
      },
    },
  },
  "/api/auth/mentor/profiles": {
    get: {
      tags: ["Auth"],
      summary: "List mentor profiles",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Mentor profiles", {
          type: "object",
          properties: {
            mentors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  email: { type: "string", format: "email" },
                  name: { type: "string" },
                  expertise: { type: "string", nullable: true },
                  availability: { type: "string", nullable: true },
                  bio: { type: "string", nullable: true },
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
  "/api/auth/expertise": {
    get: {
      tags: ["Auth"],
      summary: "Suggest mentor expertise keywords",
      parameters: [
        {
          name: "q",
          in: "query",
          schema: { type: "string" },
          description: "Filter suggestions by text.",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100 },
          description: "Maximum number of suggestions to return (default 50).",
        },
      ],
      responses: {
        200: jsonResponse("Expertise suggestions", {
          type: "object",
          properties: {
            expertise: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  frequency: { type: "integer" },
                },
              },
            },
          },
        }),
      },
    },
  },
  "/api/auth/google": {
    get: {
      tags: ["Auth"],
      summary: "Initiate Google OAuth",
      responses: {
        302: {
          description: "Redirects to Google for authentication.",
        },
      },
    },
  },
  "/api/auth/google/callback": {
    get: {
      tags: ["Auth"],
      summary: "Handle Google OAuth callback",
      responses: {
        302: {
          description: "Redirects to the frontend with a generated JWT token.",
        },
      },
    },
  },
  "/api/auth/social-accounts": {
    get: {
      tags: ["Auth"],
      summary: "List linked social accounts",
      security: bearerSecurity,
      responses: {
        200: jsonResponse("Linked social providers", {
          type: "object",
          properties: {
            socialAccounts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  provider: { type: "string" },
                  provider_email: { type: "string", format: "email" },
                  provider_name: { type: "string" },
                  created_at: { type: "string", format: "date-time" },
                },
              },
            },
          },
        }),
        401: errorResponse("Authentication required"),
      },
    },
  },
  "/api/auth/social-accounts/{provider}": {
    delete: {
      tags: ["Auth"],
      summary: "Unlink a social login provider",
      security: bearerSecurity,
      parameters: [
        {
          name: "provider",
          in: "path",
          required: true,
          schema: { type: "string", enum: ["google", "facebook"] },
        },
      ],
      responses: {
        200: jsonResponse("Provider unlinked", {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        }),
        400: errorResponse("Invalid provider or cannot unlink only method"),
        401: errorResponse("Authentication required"),
        404: errorResponse("Social account not found"),
      },
    },
  },
};
