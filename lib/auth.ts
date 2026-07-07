import { cookies } from 'next/headers';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface AdminSession {
  adminId: string;
  username: string;
  role: string;
  createdAt: number;
}

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 获取 Session 签名密钥
 * 生产环境必须设置 ADMIN_SESSION_SECRET 环境变量
 */
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET environment variable is required in production');
    }
    // 开发环境使用默认值（不推荐）
    return 'dev-only-default-secret-do-not-use-in-production';
  }
  return secret;
}

/**
 * 生成 session 签名（HMAC-SHA256）
 */
export function signSession(sessionData: string): string {
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(sessionData)
    .digest('hex');
  return `${sessionData}.${signature}`;
}

/**
 * 验证 session 签名
 */
function verifySession(signedData: string): string | null {
  const lastDot = signedData.lastIndexOf('.');
  if (lastDot === -1) return null;

  const sessionData = signedData.substring(0, lastDot);
  const signature = signedData.substring(lastDot + 1);

  const secret = getSessionSecret();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(sessionData)
    .digest('hex');

  // 使用 timingSafeEqual 防止时序攻击
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  return sessionData;
}

/**
 * Verify admin credentials and create session
 */
export async function verifyAdmin(
  username: string,
  password: string
): Promise<AdminSession | null> {
  try {
    // Fetch admin from database
    const admin = await prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!admin) {
      return null;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Create session
    const session: AdminSession = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      createdAt: Date.now(),
    };

    return session;
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}

/**
 * Set admin session cookie (带签名的 session)
 */
export async function setAdminSession(session: AdminSession): Promise<void> {
  const cookieStore = await cookies();

  // 创建带签名的 session token
  const sessionData = JSON.stringify(session);
  const signedToken = signSession(sessionData);

  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    // HTTP 环境（如服务器通过 IP 访问）必须为 false，否则浏览器不会发送 cookie
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

/**
 * Get current admin session (验证签名)
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME);

    if (!token) {
      return null;
    }

    // 验证签名
    const sessionData = verifySession(token.value);
    if (!sessionData) {
      // 签名无效，清除 cookie
      await clearAdminSession();
      return null;
    }

    const session: AdminSession = JSON.parse(sessionData);

    // Check if session is expired
    const now = Date.now();
    if (now - session.createdAt > SESSION_DURATION) {
      await clearAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

/**
 * Clear admin session
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verify if current user is authenticated admin
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}
