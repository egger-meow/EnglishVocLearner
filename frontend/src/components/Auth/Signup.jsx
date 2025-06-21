// frontend/src/components/Auth/Signup.jsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Signup = ({ onSwitchToLogin, onClose }) => {
  const [step, setStep] = useState(1); // 1 = activation code, 2 = user details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    activationCode: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { signup, checkActivationCode } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleActivationCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await checkActivationCode(formData.activationCode);
    
    if (result.success) {
      setStep(2);
    } else {
      setError(result.error || 'Invalid activation code');
    }
    
    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await signup(
      formData.activationCode,
      formData.username,
      formData.email,
      formData.password
    );
    
    if (result.success) {
      // Show success message briefly before closing
      setError(''); // Clear any previous errors
      setLoading(false);
      setSuccess(true);
      
      // Show success state briefly, then close
      setTimeout(() => {
        onClose && onClose();
      }, 1500); // Wait 1.5 seconds to show success before closing
    } else {
      setError(result.error);
      // If activation code is invalid, go back to step 1
      if (result.error.includes('activation code')) {
        setStep(1);
      }
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setError('');
  };

  return (
    <>
      <h2>Sign Up</h2>
      
      {step === 1 ? (
        <form onSubmit={handleActivationCodeSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="activationCode">Activation Code (啟動碼):</label>
            <input
              type="text"
              id="activationCode"
              name="activationCode"
              value={formData.activationCode}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your activation code"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Validating...' : 'Validate Code'}
          </button>

          <div className="auth-switch">
            <span>Already have an account? </span>
            <button type="button" onClick={onSwitchToLogin} className="switch-button">
              Login here
            </button>
          </div>

          <button type="button" onClick={onClose} className="close-button">
            Close
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignupSubmit} className="auth-form">
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
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
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
              placeholder="Choose a password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Confirm your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Account created successfully!</div>}

          <button type="submit" className="auth-button" disabled={loading || success}>
            {success ? 'Account Created! ✓' : loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="auth-switch">
            <button type="button" onClick={handleBackToStep1} className="switch-button">
              ← Back to activation code
            </button>
          </div>

          <button type="button" onClick={onClose} className="close-button">
            Close
          </button>
        </form>
      )}
    </>
  );
};

export default Signup;
