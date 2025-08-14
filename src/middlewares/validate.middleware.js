const validate = (schema) => {
  return (req, res, next) => {
    // console.log('Schema:', schema); // Debug: Check schema structure
    // console.log('Request body:', req.body); // Debug: Check input data
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true, // Allow unknown fields, but we will ignore them in the error response
    });

    if (error) {
      // Filter out unwanted error messages and include only the fields that are in the schema
      const filteredErrors = error.details.filter((detail) => {
        return schema.describe().keys.hasOwnProperty(detail.context.key); // Only include errors for known fields in schema
      });
      return res.status(400).json({
        errors: error.details.map((detail) => ({
          message: detail.message,
          field: detail.context.key,
        })),
      });
    }
    next();
  };
};

export { validate };
