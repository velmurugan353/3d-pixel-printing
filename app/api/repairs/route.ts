import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { RepairRequest } from '@/models';

export async function GET() {
  try {
    await dbConnect();
    const repairs = await RepairRequest.find().sort({ createdAt: -1 });
    return NextResponse.json(repairs);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
