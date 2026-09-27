import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 'FILE_REQUIRED', 400);
    }

    // Validate mime type
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    if (!validMimeTypes.includes(file.type)) {
      return errorResponse(
        'Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are supported.',
        'INVALID_FILE_TYPE',
        400
      );
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return errorResponse('File size exceeds the 5MB limit', 'FILE_TOO_LARGE', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
    await mkdir(uploadsDir, { recursive: true });

    // Generate safe filename
    const ext = path.extname(file.name) || `.${file.type.split('/')[1] || 'png'}`;
    const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 5);
    const uniqueName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/banners/${uniqueName}`;

    return successResponse({
      url: publicUrl,
      filename: uniqueName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('File upload failed:', error);
    return errorResponse(error.message || 'File upload failed', 'UPLOAD_ERROR', 500);
  }
}
