import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: '3D Pixel Printing Next.js API is running',
    time: new Date().toISOString()
  });
}
