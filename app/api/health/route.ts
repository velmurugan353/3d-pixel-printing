import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  let dbStatus = 'Disconnected';
  try {
    await dbConnect();
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'Connected';
    }
  } catch (error) {
    console.error('Database connection error:', error);
    dbStatus = 'Error';
  }

  return NextResponse.json({
    status: 'OK',
    database: dbStatus,
    message: '3D Pixel Printing Next.js API is running',
    time: new Date().toISOString()
  });
}
