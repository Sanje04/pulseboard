import { Request, Response } from 'express';
import { User } from '../models/user';
import { hashPassword } from '../utils/hash';

export const register = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Extract input
    const { name, email, password } = req.body;

    // 2️⃣ Validate
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase();

    // 3️⃣ Check uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // 4️⃣ Hash password
    const passwordHash = await hashPassword(password);

    // 5️⃣ Create user
    const user = new User({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    // 6️⃣ Save to DB
    await user.save();

    // 7️⃣ Respond (safe fields only)
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
