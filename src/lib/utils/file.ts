import fs from 'fs';
import path from 'path';

export const MAX_IMAGES_PER_ROOM = 10;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validate image file
 * @param file File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `File size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
}

/**
 * Ensure directory exists
 * @param dirPath Directory path
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get room images directory path
 * @param roomId Room ID
 * @returns Directory path
 */
export function getRoomImagesDir(roomId: string): string {
  return path.join(process.cwd(), 'public', 'meeting-rooms', roomId);
}

/**
 * Get room image URL
 * @param roomId Room ID
 * @param fileName File name
 * @returns Image URL
 */
export function getRoomImageUrl(roomId: string, fileName: string): string {
  return `/meeting-rooms/${roomId}/${fileName}`;
}

/**
 * Delete file if exists
 * @param filePath File path
 */
export function deleteFileIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Generate unique filename
 * @param originalName Original filename
 * @returns Unique filename
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${baseName}_${timestamp}_${random}${extension}`;
}

