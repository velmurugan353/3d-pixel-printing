import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { RepairRequest } from '@/models';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    
    const updated = await RepairRequest.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ success: false, error: 'Repair request not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Repair request updated!', repair: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
