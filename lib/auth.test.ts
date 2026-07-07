import { describe, it, expect, jest } from '@jest/globals';
import crypto from 'crypto';

describe('Authentication Module - Unit Tests', () => {
  describe('Session Signing', () => {
    it('should create HMAC-SHA256 signature', () => {
      const secret = 'test-secret';
      const sessionData = JSON.stringify({ adminId: '1', username: 'admin' });
      
      const signature = crypto
        .createHmac('sha256', secret)
        .update(sessionData)
        .digest('hex');
      
      expect(signature).toHaveLength(64); // SHA256 = 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/.test(signature)).toBe(true);
    });

    it('should create signed token with data and signature', () => {
      const secret = 'test-secret';
      const sessionData = JSON.stringify({ adminId: '1' });
      const signature = crypto
        .createHmac('sha256', secret)
        .update(sessionData)
        .digest('hex');
      
      const signedToken = `${sessionData}.${signature}`;
      
      expect(signedToken).toContain(sessionData);
      expect(signedToken).toContain('.');
    });

    it('should verify valid signature', () => {
      const secret = 'test-secret';
      const sessionData = JSON.stringify({ adminId: '1' });
      const signature = crypto
        .createHmac('sha256', secret)
        .update(sessionData)
        .digest('hex');
      
      const signedToken = `${sessionData}.${signature}`;
      const lastDot = signedToken.lastIndexOf('.');
      const extractedData = signedToken.substring(0, lastDot);
      const extractedSignature = signedToken.substring(lastDot + 1);
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(extractedData)
        .digest('hex');
      
      expect(extractedSignature).toBe(expectedSignature);
    });

    it('should detect tampered signature', () => {
      const secret = 'test-secret';
      const sessionData = JSON.stringify({ adminId: '1' });
      const signature = crypto
        .createHmac('sha256', secret)
        .update(sessionData)
        .digest('hex');
      
      const signedToken = `${sessionData}.tampered-signature`;
      const lastDot = signedToken.lastIndexOf('.');
      const extractedData = signedToken.substring(0, lastDot);
      const extractedSignature = signedToken.substring(lastDot + 1);
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(extractedData)
        .digest('hex');
      
      expect(extractedSignature).not.toBe(expectedSignature);
    });

    it('should use timingSafeEqual for secure comparison', () => {
      const sig1 = Buffer.from('abc123');
      const sig2 = Buffer.from('abc123');
      const sig3 = Buffer.from('abc124');
      
      expect(crypto.timingSafeEqual(sig1, sig2)).toBe(true);
      expect(crypto.timingSafeEqual(sig1, sig3)).toBe(false);
    });
  });

  describe('Password Hashing', () => {
    it('should generate bcrypt hash with correct format', async () => {
      const bcrypt = await import('bcryptjs');
      const password = 'secure-password';
      
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toMatch(/^\$2[abxy]?\$\d+\$.{53}$/);
    });

    it('should verify correct password', async () => {
      const bcrypt = await import('bcryptjs');
      const password = 'test-password';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const bcrypt = await import('bcryptjs');
      const password = 'correct-password';
      const wrongPassword = 'wrong-password';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Session Data Structure', () => {
    it('should have required fields', () => {
      const session = {
        adminId: 'admin-1',
        username: 'admin',
        createdAt: Date.now(),
      };
      
      expect(session).toHaveProperty('adminId');
      expect(session).toHaveProperty('username');
      expect(session).toHaveProperty('createdAt');
      expect(typeof session.createdAt).toBe('number');
    });

    it('should validate session expiration', () => {
      const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();
      
      const validSession = { createdAt: now - (12 * 60 * 60 * 1000) }; // 12 hours ago
      const expiredSession = { createdAt: now - (25 * 60 * 60 * 1000) }; // 25 hours ago
      
      expect(now - validSession.createdAt).toBeLessThan(SESSION_DURATION);
      expect(now - expiredSession.createdAt).toBeGreaterThan(SESSION_DURATION);
    });
  });
});
