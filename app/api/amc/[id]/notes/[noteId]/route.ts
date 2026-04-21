import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AMCPlan } from '@/models';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, noteId: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    
    const plan = await AMCPlan.findById(resolvedParams.id);
    if (!plan) return NextResponse.json({ success: false, error: 'AMC Plan not found' }, { status: 404 });
    
    const note = plan.notes.id(resolvedParams.noteId);
    if (!note) return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });

    if (body.isPinned !== undefined) note.isPinned = body.isPinned;
    if (body.status !== undefined) note.status = body.status;
    
    await plan.save();
    return NextResponse.json({ success: true, message: 'Note updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, noteId: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const plan = await AMCPlan.findById(resolvedParams.id);
    if (!plan) return NextResponse.json({ success: false, error: 'AMC Plan not found' }, { status: 404 });
    
    plan.notes.pull(resolvedParams.noteId);
    await plan.save();
    
    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
