import { generateId } from "../../utils/helpers.js";

// Simple date formatter utility
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// In-memory storage for demo purposes
const contactSubmissions = [];

const contactService = {
  // Process contact form submission
  processContactForm: async (contactData) => {
    try {
      // Create contact submission record
      const submission = {
        id: generateId(),
        ...contactData,
        submittedAt: new Date(),
        status: "received",
      };

      // Store submission (in a real app, this would go to a database)
      contactSubmissions.push(submission);

      // In a real application, you might:
      // - Send email notification
      // - Store in database
      // - Trigger webhook
      // - Add to CRM system

      console.log("New contact submission:", {
        id: submission.id,
        name: submission.name,
        email: submission.email,
        time: formatDate(submission.submittedAt),
      });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        id: submission.id,
        status: "received",
        message: "Your message has been received and will be reviewed shortly.",
      };
    } catch (error) {
      console.error("Contact service error:", error);
      throw new Error("Failed to process contact form");
    }
  },

  // Get all contact submissions (admin function)
  getAllSubmissions: async () => {
    return contactSubmissions.map((submission) => ({
      ...submission,
      formattedDate: formatDate(submission.submittedAt),
    }));
  },

  // Get submission by ID
  getSubmissionById: async (id) => {
    const submission = contactSubmissions.find((s) => s.id === id);
    if (!submission) {
      throw new Error("Submission not found");
    }
    return {
      ...submission,
      formattedDate: formatDate(submission.submittedAt),
    };
  },
};

export default contactService;
