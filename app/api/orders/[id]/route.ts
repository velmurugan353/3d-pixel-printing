import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const order = await Order.findById(id).populate('items.productId');
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
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
    
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.remark) {
      updateData.$push = { 
        timeline: { 
          status: body.status || 'updated', 
          date: new Date(), 
          remark: body.remark 
        } 
      };
    } else if (body.status) {
       updateData.$push = { 
        timeline: { 
          status: body.status, 
          date: new Date(), 
          remark: `Order status updated to ${body.status}` 
        } 
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedOrder) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Order updated!', order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
