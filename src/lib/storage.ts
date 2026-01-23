import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucketName = process.env.MINIO_BUCKET || 'ascent-uploads';

// Ensure bucket exists
async function ensureBucket(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.log(`Bucket ${bucketName} created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
  }
}

// Initialize bucket on module load
ensureBucket();

export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
}

export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<{ uploadUrl: string; key: string }> {
  const extension = fileName.split('.').pop() || '';
  const key = `${folder}/${uuidv4()}.${extension}`;

  const uploadUrl = await minioClient.presignedPutObject(bucketName, key, 60 * 60); // 1 hour expiry

  return { uploadUrl, key };
}

export async function generateDownloadUrl(key: string): Promise<string> {
  return minioClient.presignedGetObject(bucketName, key, 60 * 60); // 1 hour expiry
}

export async function deleteFile(key: string): Promise<void> {
  await minioClient.removeObject(bucketName, key);
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const extension = fileName.split('.').pop() || '';
  const key = `${folder}/${uuidv4()}.${extension}`;

  await minioClient.putObject(bucketName, key, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  const url = await generateDownloadUrl(key);

  return { url, key, fileName };
}

export async function getFileMetadata(key: string): Promise<Minio.BucketItemStat | null> {
  try {
    return await minioClient.statObject(bucketName, key);
  } catch {
    return null;
  }
}

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function isValidImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType);
}

export function isValidDocumentType(contentType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(contentType);
}

export function isValidVideoType(contentType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(contentType);
}

export function isValidFileType(contentType: string): boolean {
  return (
    isValidImageType(contentType) ||
    isValidDocumentType(contentType) ||
    isValidVideoType(contentType)
  );
}

// Max file sizes (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export function getMaxFileSize(contentType: string): number {
  if (isValidImageType(contentType)) return MAX_IMAGE_SIZE;
  if (isValidVideoType(contentType)) return MAX_VIDEO_SIZE;
  return MAX_DOCUMENT_SIZE;
}
