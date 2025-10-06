const bearerSecurity = [{ bearerAuth: [] }];

function jsonResponse(description, schema) {
  return {
    description,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

function errorResponse(description) {
  return jsonResponse(description, { $ref: "#/components/schemas/ErrorResponse" });
}

function validationErrorResponse(description) {
  return jsonResponse(description, {
    $ref: "#/components/schemas/ValidationErrorResponse",
  });
}

module.exports = {
  bearerSecurity,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
};
