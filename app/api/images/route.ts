import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ProductImage } from '@/models';

export async function GET() {
  try {
    await dbConnect();
    const images = await ProductImage.find({}).sort({ uploadedAt: -1 });
    return NextResponse.json(images);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
