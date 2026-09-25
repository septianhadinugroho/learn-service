import { Router } from 'express';
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  updateProfile,
  verifyNewEmail,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// ==========================================
// 1. PUBLIC / AUTHENTICATION ROUTES
// ==========================================
router.post('/register', authRateLimiter, register);
router.post('/verify-otp', authRateLimiter, verifyOTP);
router.post('/resend-otp', authRateLimiter, resendOTP);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleAuth);

// ==========================================
// 2. PASSWORD RECOVERY ROUTES
// ==========================================
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

// ==========================================
// 3. PROTECTED USER PROFILE & ACCOUNT ROUTES
// ==========================================
router.put('/profile', authenticateToken, updateProfile);
router.put('/verify-new-email', authenticateToken, verifyNewEmail);
router.put('/change-password', authenticateToken, changePassword);
router.delete('/account', authenticateToken, deleteAccount);

export default router;