export const successResponse = (data = null, message = 'Success', meta = {}) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return {
    ...response,
    ...meta,
  };
};

export const errorResponse = (message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    if (Array.isArray(errors)) {
      response.errors = errors;
    } else if (typeof errors === 'object') {
      response.errorDetails = errors;
    }
  }

  return response;
};

export const paginatedResponse = (data, pagination, message = 'Success') => {
  return successResponse(data, message, { pagination });
};

export const createdResponse = (data = null, message = 'Created successfully') => {
  return {
    status: 201,
    body: successResponse(data, message),
  };
};

export const noContentResponse = () => {
  return {
    status: 204,
    body: null,
  };
};

export const notFoundResponse = (message = 'Resource not found') => {
  return {
    status: 404,
    body: errorResponse(message),
  };
};

export const validationErrorResponse = (errors) => {
  return {
    status: 400,
    body: errorResponse('Validation failed', errors),
  };
};

export const unauthorizedResponse = (message = 'Unauthorized') => {
  return {
    status: 401,
    body: errorResponse(message),
  };
};

export const forbiddenResponse = (message = 'Forbidden') => {
  return {
    status: 403,
    body: errorResponse(message),
  };
};

export const serverErrorResponse = (message = 'Internal server error') => {
  return {
    status: 500,
    body: errorResponse(message),
  };
};
