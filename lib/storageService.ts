import { supabase } from './supabaseClient';

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
}

/**
 * 上传文件到 Supabase Storage
 * @param file 要上传的文件
 * @param bucket 存储桶名称（默认：attachments）
 * @param folder 文件夹路径
 * @returns 上传结果
 */
export async function uploadFile(
  file: File,
  bucket: string = 'attachments',
  folder: string = 'assignments'
): Promise<UploadResult> {
  // 生成唯一文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  const filename = `${timestamp}-${randomStr}.${extension}`;
  const path = `${folder}/${filename}`;

  // 上传文件
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`上传失败: ${uploadError.message}`);
  }

  // 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    url: publicUrl,
    path,
    filename: file.name,
  };
}

/**
 * 批量上传文件
 * @param files 文件列表
 * @param bucket 存储桶名称
 * @param folder 文件夹路径
 * @returns 上传结果列表
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string = 'attachments',
  folder: string = 'assignments'
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, bucket, folder))
  );
  return results;
}

/**
 * 删除文件
 * @param path 文件路径
 * @param bucket 存储桶名称
 */
export async function deleteFile(
  path: string,
  bucket: string = 'attachments'
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`删除失败: ${error.message}`);
  }
}

/**
 * 获取文件类型图标
 * @param filename 文件名
 * @returns 文件类型
 */
export function getFileType(filename: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (!ext) return 'other';
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
  
  if (imageExts.includes(ext)) return 'image';
  if (documentExts.includes(ext)) return 'document';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  
  return 'other';
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 验证文件
 * @param file 文件
 * @param options 验证选项
 * @returns 验证结果
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // 最大文件大小（字节）
    allowedTypes?: string[]; // 允许的文件类型
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options; // 默认 10MB
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件大小超过限制 (${formatFileSize(maxSize)})`,
    };
  }
  
  if (allowedTypes && allowedTypes.length > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedTypes.includes(ext)) {
      return {
        valid: false,
        error: `不支持的文件类型，请上传: ${allowedTypes.join(', ')}`,
      };
    }
  }
  
  return { valid: true };
}
