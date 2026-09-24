import { Router } from 'express';
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';
import { googleAuth } from '../controllers/authController.js';

const router = Router();

// Route Google Auth
router.post('/google', authRateLimiter, googleAuth);

router.post('/register', authRateLimiter, register);
router.post('/verify-otp', authRateLimiter, verifyOTP);
router.post('/resend-otp', authRateLimiter, resendOTP);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.delete('/account', authenticateToken, deleteAccount);

export default router;