import express from 'express'
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/authController.js'
import protect from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../schemas/auth.js'

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router