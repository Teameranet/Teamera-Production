import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import {
  successResponse,
  errorResponse,
  asyncHandler,
} from "../../utils/helpers.js";

// Function to get display title based on user role
const getRoleDisplayTitle = (role) => {
  const roleMap = {
    'founder': 'The Founder',
    'professional': 'The Professional',
    'investor': 'The Investor',
    'student': 'The Student',
    'admin': 'Administrator',
    'moderator': 'Moderator',
    'user': 'Developer'
  };
  return roleMap[role] || 'Developer';
};

const userController = {
  // Login user
  loginUser: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json(errorResponse("Email and password are required", "MISSING_CREDENTIALS"));
    }

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res
        .status(401)
        .json(errorResponse("Invalid email or password", "INVALID_CREDENTIALS"));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(errorResponse("Invalid email or password", "INVALID_CREDENTIALS"));
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'teamera-super-secret-jwt-key-2024',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password from response
    const userResponse = user.toJSON();

    const response = successResponse(
      {
        user: userResponse,
        token
      },
      "Login successful"
    );
    res.json(response);
  }),

  // Get all users
  getAllUsers: asyncHandler(async (req, res) => {
    const users = await User.find().select('-password');
    const response = successResponse(users, "Users retrieved successfully");
    res.json(response);
  }),

  // Get user by ID
  getUserById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res
        .status(404)
        .json(errorResponse("User not found", "USER_NOT_FOUND"));
    }

    const response = successResponse(user, "User retrieved successfully");
    res.json(response);
  }),

  // Get user projects
  getUserProjects: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json(errorResponse("User not found", "USER_NOT_FOUND"));
    }

    // TODO: Implement project retrieval from Project model
    const projects = {
      ownedProjects: [],
      participatingProjects: [],
    };
    
    const response = successResponse(
      projects,
      "User projects retrieved successfully",
    );
    res.json(response);
  }),

  // Create new user (Registration)
  createUser: asyncHandler(async (req, res) => {
    const { name, email, password, role, ...otherData } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json(errorResponse("Email already exists", "EMAIL_EXISTS"));
    }

    // Set default title based on role if not provided
    const title = otherData.title || getRoleDisplayTitle(role || 'user');

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      title,
      ...otherData
    });

    const response = successResponse(newUser, "User created successfully");
    res.status(201).json(response);
  }),

  // Update user
  updateUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email, ...updateData } = req.body;

    // Check if email is taken by another user
    if (email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (emailExists) {
        return res
          .status(409)
          .json(errorResponse("Email already exists", "EMAIL_EXISTS"));
      }
      updateData.email = email;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res
        .status(404)
        .json(errorResponse("User not found", "USER_NOT_FOUND"));
    }

    const response = successResponse(updatedUser, "User updated successfully");
    res.json(response);
  }),

  // Get user profile
  getUserProfile: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res
        .status(404)
        .json(errorResponse("User not found", "USER_NOT_FOUND"));
    }

    const response = successResponse(
      user,
      "User profile retrieved successfully",
    );
    res.json(response);
  }),

  // Update user profile
  updateUserProfile: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const profileData = req.body;

    // Remove password and email from profile updates for security
    delete profileData.password;
    delete profileData.email;
    delete profileData.id;
    delete profileData._id;
    delete profileData.token;

    // If role is being updated and title is not provided, set default title
    if (profileData.role && !profileData.title) {
      profileData.title = getRoleDisplayTitle(profileData.role);
    }

    // Handle experiences field mapping (frontend sends 'experience' array, backend expects 'experiences')
    if (profileData.experience && Array.isArray(profileData.experience)) {
      profileData.experiences = profileData.experience;
      delete profileData.experience;
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: profileData },
        { new: true, runValidators: false }
      ).select('-password');

      if (!updatedUser) {
        return res
          .status(404)
          .json(errorResponse("User not found", "USER_NOT_FOUND"));
      }

      const response = successResponse(
        updatedUser,
        "Profile updated successfully",
      );
      res.json(response);
    } catch (error) {
      console.error('Profile update error:', error);
      return res
        .status(500)
        .json(errorResponse(error.message || "Failed to update profile", "UPDATE_ERROR"));
    }
  }),

  // Delete user
  deleteUser: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id).select('-password');

    if (!deletedUser) {
      return res
        .status(404)
        .json(errorResponse("User not found", "USER_NOT_FOUND"));
    }

    const response = successResponse(deletedUser, "User deleted successfully");
    res.json(response);
  }),

  // Verify user by email
  verifyUserByEmail: asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json(errorResponse("Email is required", "MISSING_EMAIL"));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('-password');

    if (!user) {
      return res
        .status(404)
        .json(errorResponse("User not found with this email", "USER_NOT_FOUND"));
    }

    const response = successResponse(user, "User verified successfully");
    res.json(response);
  }),
};

export default userController;
