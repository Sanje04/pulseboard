import { Request, Response } from 'express';
import { User } from '../models/user';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { AuthRequest } from "../middleware/requireAuth";

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

export const login = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Extract email, password
    const { email, password } = req.body;

    // 2️⃣ Validate presence
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 3️⃣ Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 4️⃣ Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 5️⃣ Compare password using comparePassword
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 6️⃣ If valid → signToken(userId)
    const accessToken = signToken(user._id.toString());

    // 7️⃣ Return { user, accessToken }
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Protected route to get current user info
export const me = async (req: AuthRequest, res: Response) => {
  try {
    // 1️⃣ Ensure req.userId is set by requireAuth middleware
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // 2️⃣ Fetch user from DB
    const user = await User.findById(req.userId).select("_id name email");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // 3️⃣ Return user info
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    // 4️⃣ Handle errors
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};