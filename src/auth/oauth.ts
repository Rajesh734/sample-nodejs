import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { getPrismaClient } from '../utils/dbConnection';
import { generateToken } from '../utils/authUtils';
import logger from '../utils/logger';

const prisma = getPrismaClient();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || '';
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || '';
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback';

/**
 * Google OAuth 2.0 Strategy Configuration
 */
export const googleStrategy = new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${CALLBACK_URL}/google`,
  },
  async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      const providerId = profile.id;

      if (!email) {
        return done(new Error('No email found in Google profile'));
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
      } else if (user.provider !== 'GOOGLE') {
        // Update existing user to use Google OAuth
        user = await prisma.user.update({
          where: { email },
          data: {
            provider: 'GOOGLE',
            providerId,
            name: name || user.name,
          },
        });
        logger.info(`User switched to Google OAuth: ${email}`);
      }

      done(null, user);
    } catch (error) {
      logger.error(`Google OAuth error: ${error}`);
      done(error);
    }
  }
);

/**
 * Apple OAuth Strategy Configuration
 */
export const appleStrategy = new AppleStrategy(
  {
    clientID: APPLE_CLIENT_ID,
    teamID: APPLE_TEAM_ID,
    keyID: APPLE_KEY_ID,
    privateKey: APPLE_PRIVATE_KEY,
    callbackURL: `${CALLBACK_URL}/apple`,
  } as any,
  async (_accessToken: string, _refreshToken: string, _idToken: string, profile: any, done: any) => {
    try {
      const email = profile.email || profile._json?.email;
      const name = profile.name
        ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
        : profile._json?.user?.name?.firstName || 'Apple User';
      const providerId = profile.id;

      if (!email) {
        return done(new Error('No email found in Apple profile'));
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
            verified: true,
          },
        });
        logger.info(`New Apple user created: ${email}`);
      } else if (user.provider !== 'APPLE') {
        // Update existing user to use Apple OAuth
        user = await prisma.user.update({
          where: { email },
          data: {
            provider: 'APPLE',
            providerId,
            name: name || user.name,
          },
        });
        logger.info(`User switched to Apple OAuth: ${email}`);
      }

      done(null, user);
    } catch (error) {
      logger.error(`Apple OAuth error: ${error}`);
      done(error);
    }
  }
);

/**
 * Serialize user for session
 */
export const serializeUser = (user: any, done: any) => {
  done(null, user.id);
};

/**
 * Deserialize user from session
 */
export const deserializeUser = async (id: string, done: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
};

/**
 * Generate JWT from OAuth user
 */
export const generateOAuthToken = (user: any): string => {
  return generateToken(user.id, user.email, user.role);
};
