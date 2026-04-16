import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || '3dpixelprinting_secret_key_2025';

export interface AuthUser {
  email: string;
  role: string;
  userId: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    return null;
  }
}

export async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function authorizeAdmin(user: AuthUser | null) {
  if (!user) return false;
  return user.role === 'superadmin' || user.role === 'subadmin';
}

export function authResponse(success: boolean, error: string, status: number) {
  return NextResponse.json({ success, error }, { status });
}
