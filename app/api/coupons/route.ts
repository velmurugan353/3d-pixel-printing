import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Coupon } from '@/models';

export async function GET() {
  try {
    await dbConnect();
    const coupons = await Coupon.find({}).sort({ expiry: -1 });
    return NextResponse.json(coupons);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const newCoupon = new Coupon(body);
    await newCoupon.save();
    
    return NextResponse.json({ success: true, message: 'Coupon created!', coupon: newCoupon });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
