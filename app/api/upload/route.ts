import { NextRequest, NextResponse } from 'next/server';
import { getGridFSBucket } from '@/lib/mongodb';
import { ProductImage } from '@/models';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bucket = await getGridFSBucket();
    
    // Convert File to Buffer then to Readable stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const uploadStream = bucket.openUploadStream(file.name, {
      contentType: file.type
    });
    
    const fileId = uploadStream.id;

    const uploadPromise = new Promise((resolve, reject) => {
      stream.pipe(uploadStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    await uploadPromise;

    const newImage = new ProductImage({
        filename: file.name,
        contentType: file.type,
        data: 'gridfs:' + fileId.toString()
    });

    await newImage.save();

    return NextResponse.json({ success: true, imageId: newImage._id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
