import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { STLJob } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const job = await STLJob.findById(id);
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    return NextResponse.json(job);
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
    const job = await STLJob.findById(id);
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    
    if (body.status && body.status !== job.status) {
        job.status = body.status;
        job.workflowTimeline.push({ 
            status: body.status, 
            date: new Date(), 
            remark: body.remark || `Workflow transitioned to ${body.status}`,
            updatedBy: body.updatedBy || 'Admin'
        });
    }

    if (body.printerId !== undefined) job.printerId = body.printerId;
    if (body.slicingSpecs) job.slicingSpecs = { ...job.slicingSpecs, ...body.slicingSpecs };
    if (body.weightEst !== undefined) job.weightEst = body.weightEst;

    if (body.adminNote) {
        job.adminNotes.push({ text: body.adminNote, date: new Date(), author: body.author || 'Admin' });
    }

    await job.save();
    return NextResponse.json({ success: true, message: 'Production data updated!', job });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
