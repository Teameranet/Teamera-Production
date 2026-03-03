import {
  successResponse,
  errorResponse,
  sanitizeInput,
} from "../../utils/helpers.js";
import contactService from "../services/contactService.js";

const contactController = {
  submitContact: async (req, res) => {
    try {
      const { name, email, message } = req.body;

      // Validate required fields
      if (!name || !email || !message) {
        return res
          .status(400)
          .json(errorResponse("All fields are required", "VALIDATION_ERROR"));
      }

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        message: sanitizeInput(message),
      };

      // Process contact form through service
      const result = await contactService.processContactForm(sanitizedData);

      res
        .status(201)
        .json(successResponse(result, "Contact form submitted successfully"));
    } catch (error) {
      console.error("Contact form error:", error);
      res
        .status(500)
        .json(
          errorResponse("Failed to submit contact form", "SUBMISSION_ERROR"),
        );
    }
  },
};

export default contactController;
