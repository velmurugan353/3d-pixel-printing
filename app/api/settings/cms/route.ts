import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Settings } from '@/models';

export async function GET() {
  try {
    await dbConnect();
    const cms = await Settings.findOne({ key: 'cms_config' });
    
    // Default config if not found
    const defaultCMS = {
      hero_title: '3D Pixel Printing',
      hero_subtitle: 'The best 3D printing in town',
      features: [],
      testimonials: [],
      banners: [],
      seo: {
        title: '3D Pixel Printing',
        description: 'Quality 3D Printing'
      }
    };

    return NextResponse.json(cms?.value || defaultCMS);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    await Settings.findOneAndUpdate(
      { key: 'cms_config' },
      { key: 'cms_config', value: body },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, message: 'CMS config updated!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
