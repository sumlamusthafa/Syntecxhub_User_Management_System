const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate value: already exists";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  }

  if (status === 500) console.error(err);

  res.status(status).json({
    message:
      status === 500 && process.env.NODE_ENV === "production"
        ? "Server error"
        : message,
  });
};

module.exports = { notFound, errorHandler };