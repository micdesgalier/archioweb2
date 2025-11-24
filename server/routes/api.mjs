import express from 'express';
import { login } from '../api/auth.mjs';
import { logout } from '../api/logout.mjs';

const router = express.Router();

// Auth routes
router.post('/auth/login', login);
router.post('/auth/logout', logout);

export default router;
