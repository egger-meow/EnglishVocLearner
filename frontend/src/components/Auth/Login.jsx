// frontend/src/components/Auth/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = ({ onSwitchToSignup, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      onClose && onClose();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your password"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="auth-switch">
          <span>Don't have an account? </span>
          <button type="button" onClick={onSwitchToSignup} className="switch-button">
            Sign up here
          </button>
        </div>

        <button type="button" onClick={onClose} className="close-button">
          Close
        </button>
      </form>
    </>
  );
};

export default Login;
