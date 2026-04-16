import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect, { getGridFSBucket } from '@/lib/mongodb';
import { ProductImage } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const image = await ProductImage.findById(id);
    if (!image) {
      return new NextResponse('Image not found', { status: 404 });
    }

    if (image.data && image.data.startsWith('gridfs:')) {
      const gridfsId = image.data.split(':')[1];
      const bucket = await getGridFSBucket();
      
      if (!bucket) {
        return new NextResponse('Storage not ready', { status: 500 });
      }

      const downloadStream = bucket.openDownloadStream(new mongoose.mongo.ObjectId(gridfsId));
      
      // Convert stream to ReadableStream for Next.js response
      const readableStream = new ReadableStream({
        start(controller) {
          downloadStream.on('data', (chunk) => controller.enqueue(chunk));
          downloadStream.on('error', (err) => controller.error(err));
          downloadStream.on('end', () => controller.close());
        }
      });

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': image.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    } else if (image.data) {
      const imgBuffer = Buffer.from(image.data, 'base64');
      return new NextResponse(imgBuffer, {
        headers: {
          'Content-Type': image.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    } else {
      return new NextResponse('No image data found', { status: 404 });
    }
  } catch (error) {
    console.error('IMAGE FETCH ERROR:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
