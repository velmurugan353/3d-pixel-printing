import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AMCPlan } from '@/models';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    
    const plan = await AMCPlan.findById(resolvedParams.id);
    if (!plan) return NextResponse.json({ success: false, error: 'AMC Plan not found' }, { status: 404 });
    
    plan.notes.push({
      text: body.text,
      category: body.category || 'General',
      status: body.status || 'none',
      isPinned: body.isPinned || false,
      date: body.date ? new Date(body.date) : new Date(),
      author: body.author || 'Admin'
    });
    
    await plan.save();
    return NextResponse.json({ success: true, message: 'Note added successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
