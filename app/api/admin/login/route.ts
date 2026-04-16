import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();
    
    const validCredentials: Record<string, any> = {
      'admin@3dpixelprinting.in': {
        password: 'Admin@2025',
        roles: ['superadmin', 'subadmin']
      }
    };

    if (!validCredentials[email]) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (password !== validCredentials[email].password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (!validCredentials[email].roles.includes(role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized role' }, { status: 403 });
    }

    const token = signToken({ 
      email, 
      role,
      userId: 'admin_user_id' 
    });

    return NextResponse.json({ 
      success: true, 
      token, 
      user: { 
        email, 
        role 
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
