// frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  const [sessionToken, setSessionToken] = useState(null);

  const logout = useCallback(async () => {
    if (sessionToken) {
      try {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
  }, [sessionToken]);

  const validateSession = useCallback(async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSessionToken(token);
      } else {
        // Invalid token, clear auth state
        logout();
      }
    } catch (error) {
      console.error('Session validation error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('sessionToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setSessionToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Validate the token with the server
      validateSession(storedToken);
    } else {
      setLoading(false);
    }
  }, [validateSession]);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setSessionToken(data.session_token);
        localStorage.setItem('sessionToken', data.session_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (activationCode, username, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activation_code: activationCode,
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setSessionToken(data.session_token);
        localStorage.setItem('sessionToken', data.session_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const checkActivationCode = async (activationCode) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/check-activation-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activation_code: activationCode }),
      });

      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      console.error('Activation code check error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const getAuthHeaders = () => {
    return sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {};
  };

  const value = {
    user,
    loading,
    sessionToken,
    login,
    signup,
    logout,
    checkActivationCode,
    getAuthHeaders,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
