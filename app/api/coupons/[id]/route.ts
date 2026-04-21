import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Coupon } from '@/models';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Coupon deleted!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
