import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Semua route di bawah ini wajib pakai Bearer Token
router.use(authenticateToken);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

export default router;