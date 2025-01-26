import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const db = new PrismaClient();

router.get('/users', async (req: any, res: Response) => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        isBlocked: true,
      },
    });
    const currentUserId = req.userId;

    res.status(200).json({ users, currentUserId });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/fetch-user', async (req: any, res: any) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    if (!process.env.JWT_ACCESS_SECRET) {
      console.log('JWT_ACCESS_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as {
      userId: number;
    };

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userDoc = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        isBlocked: true,
      },
    });

    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ userDoc });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.post('/logout', async (req: any, res: any) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/users/block', async (req: Request, res: Response) => {
  const { userIds } = req.body;

  try {
    await db.user.updateMany({
      where: { id: { in: userIds } },
      data: { isBlocked: true },
    });
    res.status(200).json({ message: 'Users blocked successfully' });
  } catch (error) {
    console.error('Error blocking users:', error);
    res.status(500).json({ message: 'Failed to block users' });
  }
});

router.post('/users/unblock', async (req: Request, res: Response) => {
  const { userIds } = req.body;

  try {
    await db.user.updateMany({
      where: { id: { in: userIds } },
      data: { isBlocked: false },
    });
    res.status(200).json({ message: 'Users unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking users:', error);
    res.status(500).json({ message: 'Failed to unblock users' });
  }
});

router.delete('/users/delete', async (req: Request, res: Response) => {
  const { userIds } = req.body;

  try {
    await db.user.deleteMany({
      where: { id: { in: userIds } },
    });
    res.status(200).json({ message: 'Users deleted successfully' });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ message: 'Failed to delete users' });
  }
});

export default router;
