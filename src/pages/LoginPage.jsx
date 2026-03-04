import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Eye, EyeOff, ArrowRight, 
  Chrome, AlertCircle, CheckCircle2, Cloud, Clock 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowResendConfirmation(false);
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password, { full_name: fullName });
        setSuccess('Account created! Please check your email to confirm.');
        setShowResendConfirmation(true);
      }
    } catch (err) {
      const message = err.message || 'An error occurred';
      setError(message);
      
      if (message.includes('Email not confirmed')) {
        setShowResendConfirmation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      // Redirect handled by OAuth provider
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      const { resendConfirmationEmail } = useAuth();
      await resendConfirmationEmail(email);
      setSuccess('Confirmation email resent! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to resend confirmation email');
    }
  };

  if (!isConfigured) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="not-configured">
            <Cloud size={48} className="not-configured-icon" />
            <h2>Cloud Sync Not Configured</h2>
            <p>
              Supabase is not configured. You can still use Podomodro locally,
              but cloud synchronization is unavailable.
            </p>
            <button onClick={() => navigate('/')} className="primary-btn">
              Continue Offline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <motion.div 
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo & Header */}
        <div className="login-header">
          <div className="login-logo">
            <Clock size={32} />
          </div>
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>
            {isLogin 
              ? 'Sign in to sync your data across devices' 
              : 'Join Podomodro to unlock cloud sync'}
          </p>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="alert alert-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div 
              className="alert alert-success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Sign In */}
        <button 
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <Chrome size={20} />
          <span>Continue with Google</span>
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
              {isLogin && (
                <button 
                  type="button" 
                  className="forgot-password"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot?
                </button>
              )}
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Resend Confirmation */}
        {showResendConfirmation && (
          <motion.button
            className="resend-btn"
            onClick={handleResendConfirmation}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Resend confirmation email
          </motion.button>
        )}

        {/* Toggle Login/Register */}
        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button 
              className="toggle-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Back to App */}
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          Continue without account
        </button>
      </motion.div>
    </div>
  );
}
