const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  schemas: {
    ErrorResponse: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
    },
    ValidationErrorResponse: {
      type: "object",
      properties: {
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              msg: { type: "string" },
              param: { type: "string" },
              location: { type: "string" },
            },
          },
        },
      },
    },
    User: {
      type: "object",
      properties: {
        id: { type: "integer" },
        email: { type: "string", format: "email" },
        name: { type: "string" },
        role: { type: "string" },
        timezone: { type: "string", nullable: true },
        isVerified: { type: "boolean" },
        mentorProfile: {
          type: "object",
          nullable: true,
          properties: {
            expertise: { type: "string", nullable: true },
            availability: { type: "string", nullable: true },
            bio: { type: "string", nullable: true },
          },
        },
      },
    },
    FormField: {
      type: "object",
      properties: {
        id: { type: "integer", nullable: true },
        label: { type: "string" },
        fieldType: { type: "string" },
        required: { type: "boolean" },
        helperText: { type: "string", nullable: true },
        options: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    Form: {
      type: "object",
      properties: {
        id: { type: "integer" },
        title: { type: "string" },
        description: { type: "string", nullable: true },
        visibility: { type: "string" },
        is_default: { type: "boolean" },
        created_by: { type: "integer", nullable: true },
        createdAt: { type: "string", format: "date-time", nullable: true },
        creatorName: { type: "string", nullable: true },
        mentees: {
          type: "array",
          nullable: true,
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
            },
          },
        },
        assignment: {
          type: "object",
          nullable: true,
          properties: {
            assignedAt: { type: "string", format: "date-time" },
            mentorId: { type: "integer" },
            mentorName: { type: "string" },
          },
        },
        fields: {
          type: "array",
          items: { $ref: "#/components/schemas/FormField" },
        },
      },
    },
    MentorRequest: {
      type: "object",
      properties: {
        id: { type: "integer" },
        status: { type: "string" },
        message: { type: "string", nullable: true },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        journaler: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
        mentor: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    JournalEntry: {
      type: "object",
      properties: {
        id: { type: "integer" },
        formId: { type: "integer" },
        journalerId: { type: "integer" },
        entryDate: { type: "string", format: "date" },
        createdAt: { type: "string", format: "date-time" },
        mood: { type: "string", nullable: true },
        sharedLevel: { type: "string" },
        summary: { type: "string", nullable: true },
        formTitle: { type: "string", nullable: true },
        responses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fieldId: { type: "integer", nullable: true },
              label: { type: "string" },
              value: {},
            },
          },
        },
      },
    },
    AdminJournalEntry: {
      allOf: [
        { $ref: "#/components/schemas/JournalEntry" },
        {
          type: "object",
          properties: {
            journaler: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
            },
            form: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "integer" },
                title: { type: "string" },
              },
            },
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
        },
      ],
    },
  },
};

const tags = [
  { name: "Health", description: "Service health checks" },
  { name: "Auth", description: "Authentication, accounts, and identity" },
  { name: "Forms", description: "Journal form management" },
  { name: "Mentors", description: "Mentor and mentee relationship management" },
  { name: "Journal Entries", description: "Journal entry workflows" },
  { name: "Dashboard", description: "Dashboard summaries" },
  { name: "Admin", description: "Administrative tooling" },
];

module.exports = { components, tags };
