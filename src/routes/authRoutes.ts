import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const db = new PrismaClient();
const router = Router();

router.post('/signup', async (req: any, res: any) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      throw new Error('all fields are required');
    }

    const emailExists = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (emailExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userDoc = await db.user.create({
      data: {
        name: username,
        email: email,
        password: hashedPassword,
        lastLoginAt: new Date(),
      },
    });

    if (userDoc) {
      const secret = process.env.JWT_ACCESS_SECRET;

      if (!secret) {
        console.log(
          'JWT_ACCESS_SECRET is not defined in environment variables'
        );
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const token = jwt.sign({ userId: userDoc.id }, secret, {
        expiresIn: '30d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ message: 'User created successfully' });
    }

    return res.status(500).json({ message: 'Error creating user' });
  } catch (error) {
    res.status(400).json({ message: 'Error to create new user' });
  }
});

router.post('/login', async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const userDoc = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!userDoc) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, userDoc.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (userDoc) {
      const secret = process.env.JWT_ACCESS_SECRET;

      if (!secret) {
        console.log(
          'JWT_ACCESS_SECRET is not defined in environment variables'
        );
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const token = jwt.sign({ userId: userDoc.id }, secret, {
        expiresIn: '30d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ message: 'Loged in successfully' });
    }

    return res.status(500).json({ message: 'Error log in user' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error log in user ' });
  }
});

export default router;
