import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { STLJob, User } from '@/models';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    const jobs = await STLJob.find().sort({ createdAt: -1 });
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Check if this is a manual job from admin
    if (body.manual) {
      let customer: any = { name: 'Guest Walk-in', phone: 'N/A', address: 'N/A', city: 'N/A' };
      if (body.customerId && mongoose.Types.ObjectId.isValid(body.customerId)) {
        const user = await User.findById(body.customerId);
        if (user) {
          customer = { 
            name: user.name, 
            phone: user.phone || 'N/A', 
            address: user.address || 'N/A', 
            city: user.city || 'N/A' 
          };
        }
      }
      
      const newJob = new STLJob({
        filename: body.filename,
        fileData: body.fileData,
        customer: customer,
        settings: body.settings,
        quote: body.quote,
        weightEst: body.weightEst,
        status: 'queued',
        workflowTimeline: [{ 
          status: 'queued', 
          date: new Date(), 
          remark: 'Manual quote created by Admin', 
          updatedBy: 'Admin' 
        }]
      });
      
      const saved = await newJob.save();
      return NextResponse.json({ success: true, jobId: saved._id }, { status: 201 });
    }

    const newJob = new STLJob(body);
    const saved = await newJob.save();
    return NextResponse.json({ success: true, message: 'STL Job submitted!', jobId: saved._id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
