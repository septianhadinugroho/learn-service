import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { sendOTPEmail } from '../config/mailer.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// GOOGLE AUTHENTICATION (Register / Login Hybrid)
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ success: false, message: 'Google ID token is required' });
    return;
  }

  try {
    // 1. Verifikasi ID Token dari Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).json({ success: false, message: 'Invalid Google token payload' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    // 2. Cari atau Buat User Baru
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Jika user belum ada -> Auto Register
      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email,
          googleId,
          avatar: picture,
          isVerified: true // Otomatis terverifikasi via Google
        }
      });
    } else if (!user.googleId) {
      // Jika user sudah ada (manual regis sebelumnya) -> Link akun Google
      user = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          avatar: user.avatar || picture,
          isVerified: true
        }
      });
    }

    // 3. Generate JWT Token Internal Apps
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Google authentication failed: ' + error.message
    });
  }
};

// Helper function untuk generate 6 digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. REGISTER (With confirmPassword & OTP) (Method Register Manual)
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, confirmPassword } = req.body;

  // 1. Validasi Wajib Isi untuk Registrasi Manual
  if (!name || !email || !password || !confirmPassword) {
    res.status(400).json({ 
      success: false, 
      message: 'Name, email, password, and confirm password are required for manual registration' 
    });
    return;
  }

  // 2. Validasi Match Password
  if (password !== confirmPassword) {
    res.status(400).json({ 
      success: false, 
      message: 'Password and confirm password do not match' 
    });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expiration 10 mins

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        otpCode,
        otpExpires,
        isVerified: false
      },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    await sendOTPEmail(email, otpCode);

    // Catatan: Pada aplikasi produksi, kirim otpCode via Nodemailer/Email API.
    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification OTP code has been sent to your email.',
      // otpCode, // Ditampilkan di response untuk keperluan pengujian lokal
      data: newUser
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
  
};

// 2. VERIFY OTP
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'Account is already verified' });
      return;
    }

    if (user.otpCode !== otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpires: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Account verified successfully. You can now log in.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. RESEND OTP
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'Account is already verified' });
      return;
    }

    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otpCode, otpExpires }
    });

    await sendOTPEmail(email, otpCode)

    res.status(200).json({
      success: true,
      message: 'A new OTP code has been sent to your email.',
      // otpCode // Ditampilkan di response untuk pengujian lokal
    });
    
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. LOGIN (Dengan Cek Verifikasi OTP)
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
    }

    // Proteksi: Jika user terdaftar via Google dan belum pernah set password
    if (!user.password && user.googleId) {
      res.status(400).json({
        success: false,
        message: 'This account was registered using Google Sign-In. Please log in with Google or reset your password to set a manual password.'
      });
      return;
    }

    // Verifikasi bcrypt password biasa...
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. UPDATE PROFILE
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { name, email } = req.body;

  if (!name && !email) {
    res.status(400).json({ success: false, message: 'Please provide name or email to update' });
    return;
  }

  try {
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });

      if (existingUser) {
        res.status(409).json({ success: false, message: 'Email already in use' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email })
      },
      select: { id: true, name: true, email: true, updatedAt: true }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. DELETE ACCOUNT
export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  try {
    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. FORGOT PASSWORD
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ success: false, message: 'User with given email not found' });
      return;
    }

    // Proteksi jika akun terdaftar via Google tanpa password
    if (!user.password && user.googleId) {
      res.status(400).json({
        success: false,
        message: 'This account was created using Google Sign-In. Please log in using Google.'
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { email },
      data: { resetPasswordToken: resetToken, resetPasswordExpires: expiresAt }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully',
      resetToken
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. RESET PASSWORD
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword, confirmNewPassword } = req.body;

  if (!token || !newPassword || !confirmNewPassword) {
    res.status(400).json({
      success: false,
      message: 'Token, new password, and confirm password are required'
    });
    return;
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    return;
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. CHANGE PASSWORD (Untuk user yang sedang login)
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    res.status(400).json({
      success: false,
      message: 'Current password, new password, and confirm new password are required'
    });
    return;
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400).json({
      success: false,
      message: 'New password and confirm new password do not match'
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Handle jika akun dibuat via Google (password masih null)
    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'Accounts registered via Google do not have a password set. Please use password reset to create a password.'
      });
      return;
    }

    // TypeScript kini tahu pasti bahwa user.password bertipe string
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Incorrect current password' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};