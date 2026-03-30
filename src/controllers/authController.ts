import { Request, Response } from 'express';
import { getPrismaClient } from '../utils/dbConnection';
import { generateToken } from '../utils/authUtils';
import { AppError, catchAsync } from '../utils/errorUtils';
import logger from '../utils/logger';

const prisma = getPrismaClient();

/**
 * POST /auth/google
 * Verify Google ID token and return JWT
 */
export const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new AppError(400, 'ID token is required');
  }

  try {
    // Verify token with Google (in production, use google-auth-library)
    // For now, we'll do basic validation
    const tokenParts = idToken.split('.');
    if (tokenParts.length !== 3) {
      throw new AppError(400, 'Invalid ID token format');
    }

    // Decode payload (without verification for demo)
    // In production, verify with Google's public keys
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    const email = payload.email;
    const name = payload.name;
    const providerId = payload.sub;

    if (!email) {
      throw new AppError(400, 'No email in token');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          provider: 'GOOGLE',
          providerId,
          verified: true,
        },
      });
      logger.info(`New Google user created: ${email}`);
    } else if (!user.provider || user.provider !== 'GOOGLE') {
      user = await prisma.user.update({
        where: { email },
        data: {
          provider: 'GOOGLE',
          providerId,
          name: name || user.name,
        },
      });
    }

    const jwtToken = generateToken(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (error: any) {
    logger.error(`Google login error: ${error.message}`);
    throw new AppError(401, 'Google authentication failed');
  }
});

/**
 * POST /auth/apple
 * Verify Apple JWT and return JWT
 */
export const appleLogin = catchAsync(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new AppError(400, 'ID token is required');
  }

  try {
    // Decode and verify Apple JWT
    const tokenParts = idToken.split('.');
    if (tokenParts.length !== 3) {
      throw new AppError(400, 'Invalid ID token format');
    }

    // Decode payload (without verification for demo)
    // In production, verify signature with Apple's public keys
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

    const email = payload.email;
    const name = payload.email_verified ? payload.email.split('@')[0] : undefined;
    const providerId = payload.sub;

    if (!email) {
      throw new AppError(400, 'No email in token');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          provider: 'APPLE',
          providerId,
          verified: payload.email_verified || false,
        },
      });
      logger.info(`New Apple user created: ${email}`);
    } else if (!user.provider || user.provider !== 'APPLE') {
      user = await prisma.user.update({
        where: { email },
        data: {
          provider: 'APPLE',
          providerId,
          name: name || user.name,
        },
      });
    }

    const jwtToken = generateToken(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Apple authentication successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (error: any) {
    logger.error(`Apple login error: ${error.message}`);
    throw new AppError(401, 'Apple authentication failed');
  }
});

/**
 * GET /auth/verify
 * Verify current JWT token
 */
export const verifyToken = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'No authenticated user');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      role: user.role,
    },
  });
});

/**
 * POST /auth/logout
 * Logout (JWT is stateless, client should discard)
 */
export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your token.',
  });
});
