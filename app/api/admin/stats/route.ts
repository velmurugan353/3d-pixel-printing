import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Product, Order, STLJob, User } from '@/models';
import { authenticate, authorizeAdmin, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!authorizeAdmin(user)) {
      return authResponse(false, 'Unauthorized access', 403);
    }

    await dbConnect();

    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const stlJobCount = await STLJob.countDocuments();
    const userCount = await User.countDocuments();
    
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    
    return NextResponse.json({ 
      success: true,
      stats: {
        products: productCount,
        orders: orderCount,
        stlJobs: stlJobCount,
        users: userCount
      },
      recentOrders
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
