import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AMCPlan } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const amc = await AMCPlan.findById(id);
    if (!amc) {
      return NextResponse.json({ success: false, error: 'AMC not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, amc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const updated = await AMCPlan.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'AMC not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, amc: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const deleted = await AMCPlan.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'AMC not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'AMC plan deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
