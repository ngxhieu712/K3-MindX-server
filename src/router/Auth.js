import { login } from '../controller/Auth.js';
import { register } from '../controller/Auth.js';
import { logout } from '../controller/Auth.js';

import { Router } from 'express';
const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

export default router;