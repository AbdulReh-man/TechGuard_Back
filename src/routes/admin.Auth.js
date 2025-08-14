// routes/adminAuth.js

import express from 'express';
const router = express.Router();
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
// POST /api/admin/login
router.route('/login').post(async (req, res) => {
  const { email, password } = req.body;

  try {
    
    // Find user
    const user = await User.findOne({ email });

    // Check if user exists and is admin
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
})

export default router;
