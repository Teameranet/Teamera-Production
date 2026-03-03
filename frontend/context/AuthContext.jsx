import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0);
  
  /* Demo users disabled
  const demoUsers = [];
  */

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('teamera_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    // Store profile data if it's a new user or has extended profile info
    const storedUser = await storeUserProfile(userData);
    setUser(storedUser);
    localStorage.setItem('teamera_user', JSON.stringify(storedUser));
    setShowAuthModal(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('teamera_user');
  };

  const signup = async (userData) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        const newUser = { ...result.data, id: result.data._id || result.data.id };
        
        // Store user locally and in localStorage
        setUser(newUser);
        localStorage.setItem('teamera_user', JSON.stringify(newUser));
        setShowAuthModal(false);
        
        return { success: true, user: newUser };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      // Map role to title if role is provided but title is not
      const getRoleDisplayTitle = (role) => {
        const roleMap = {
          'founder': 'The Founder',
          'professional': 'The Professional',
          'investor': 'The Investor',
          'student': 'The Student'
        };
        return roleMap[role] || 'Developer';
      };

      // Set title based on role if not already set
      if (profileData.role && !profileData.title) {
        profileData.title = getRoleDisplayTitle(profileData.role);
      }

      // Update locally first for immediate UI feedback
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('teamera_user', JSON.stringify(updatedUser));

      // Sync with backend if user has an ID
      if (user?.id || user?._id) {
        const userId = user.id || user._id;
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        console.log('Updating profile for user:', userId);
        console.log('Profile data being sent:', profileData);
        
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });

        if (response.ok) {
          const result = await response.json();
          const backendUser = result.data;
          // Merge backend data with local user data
          const mergedUser = { ...updatedUser, ...backendUser, id: backendUser._id || backendUser.id };
          setUser(mergedUser);
          localStorage.setItem('teamera_user', JSON.stringify(mergedUser));
          
          // Trigger profile refresh in components
          setProfileUpdateTrigger(prev => prev + 1);
          
          console.log('Profile synced with backend successfully');
          return { success: true, user: mergedUser };
        } else {
          const errorData = await response.json();
          console.error('Failed to sync profile with backend:', errorData);
          return { success: false, error: errorData.message || 'Failed to sync with backend' };
        }
      }

      // Trigger profile refresh even for local-only updates
      setProfileUpdateTrigger(prev => prev + 1);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  };

  // Store new user profile data on signup/signin
  const storeUserProfile = async (userData) => {
    try {
      const userId = userData.id || userData._id;
      if (userId) {
        // If user has ID, sync with backend
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const result = await response.json();
          return { ...result.data, id: result.data._id || result.data.id };
        }
      }
      return userData;
    } catch (error) {
      console.error('Error storing user profile:', error);
      return userData; // Return original data if backend fails
    }
  };
  
  // Demo login disabled
  // const loginAsDemoUser = (userId) => {}

  const value = {
    user,
    setUser,
    login,
    logout,
    signup,
    updateProfile,
    storeUserProfile,
    loading,
    isAuthenticated: !!user,
    profileUpdateTrigger,
    // demoUsers,
    // loginAsDemoUser,
    showAuthModal,
    setShowAuthModal
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};