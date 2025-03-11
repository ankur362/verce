import { ApiError } from "../utils/ApiError.js"; // Ensure correct path

const errorHandler = (err, req, res, next) => {
    console.error("🔥 API Error:", err);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
            data: err.data || null,
        });
    }

    // Handle other unexpected errors
    return res.status(500).json({
        success: false,
        message: "Something went wrong",
    });
};

export { errorHandler };
