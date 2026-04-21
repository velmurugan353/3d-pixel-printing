import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Product } from '@/models';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const original = await Product.findById(id);
    if (!original) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    
    const duplicateData = original.toObject();
    delete duplicateData._id;
    duplicateData.sku = `${duplicateData.sku}-copy-${Date.now()}`;
    duplicateData.name = `${duplicateData.name} (Copy)`;
    
    const newProduct = new Product(duplicateData);
    await newProduct.save();
    
    return NextResponse.json({ success: true, message: 'Product duplicated!', product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
