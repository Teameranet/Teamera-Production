import { errorResponse } from '../utils/helpers.js';

/**
 * Validation middleware for user registration
 * Validates that password and confirmPassword match
 */
export const validateRegistration = (req, res, next) => {
  const { password, confirmPassword, email, name } = req.body;

  // Check if required fields are present
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json(
      errorResponse(
        'All fields are required: name, email, password, and confirmPassword',
        'MISSING_FIELDS'
      )
    );
  }

  // Validate password and confirmPassword match
  if (password !== confirmPassword) {
    return res.status(400).json(
      errorResponse(
        'Password and Confirm Password do not match',
        'PASSWORD_MISMATCH'
      )
    );
  }

  // Remove confirmPassword from body before proceeding
  // (we don't want to store it in the database)
  delete req.body.confirmPassword;

  next();
};

/**
 * Validation middleware for password update
 * Validates that newPassword and confirmPassword match
 */
export const validatePasswordUpdate = (req, res, next) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json(
      errorResponse(
        'Both newPassword and confirmPassword are required',
        'MISSING_FIELDS'
      )
    );
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json(
      errorResponse(
        'New Password and Confirm Password do not match',
        'PASSWORD_MISMATCH'
      )
    );
  }

  delete req.body.confirmPassword;
  next();
};

/**
 * Validation middleware for email format
 */
export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(
      errorResponse('Email is required', 'MISSING_EMAIL')
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json(
      errorResponse('Invalid email format', 'INVALID_EMAIL')
    );
  }

  next();
};

export default {
  validateRegistration,
  validatePasswordUpdate,
  validateEmail
};
