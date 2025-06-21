// frontend/src/components/Auth/AuthModal.jsx

import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  if (!isOpen) return null;

  const handleSwitchToSignup = () => setMode('signup');
  const handleSwitchToLogin = () => setMode('login');

  const handleClose = () => {
    setMode('login'); // Reset to login when closing
    onClose();
  };

  // Handle clicking outside the modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="auth-container" onClick={handleBackdropClick}>
      <div className="auth-card">
        {mode === 'login' ? (
          <Login 
            onSwitchToSignup={handleSwitchToSignup}
            onClose={handleClose}
          />
        ) : (
          <Signup 
            onSwitchToLogin={handleSwitchToLogin}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
