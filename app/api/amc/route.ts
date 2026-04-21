import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AMCPlan } from '@/models';

export async function GET() {
  try {
    await dbConnect();
    const amc = await AMCPlan.find().sort({ createdAt: -1 });
    return NextResponse.json(amc);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Basic validation logic from server.js
    const errors = [];
    if (!body.customer?.name) errors.push('Customer name is required');
    if (!body.planName) errors.push('Plan name is required');
    if (!body.price || body.price < 0) errors.push('Valid price is required');
    if (!body.expiryDate || new Date(body.expiryDate) <= new Date()) errors.push('Valid expiry date is required');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const newAMC = new AMCPlan(body);
    await newAMC.save();
    return NextResponse.json({ success: true, amc: newAMC }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
