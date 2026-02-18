import React, { useCallback } from 'react';
import { Upload, X, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import * as storageService from '../lib/storageService';

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  path?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface FileUploadProps {
  files: UploadFile[];
  onFilesChange: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept,
  disabled = false,
}) => {
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;
    
    // 检查文件数量限制
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }
    
    // 验证并创建上传文件对象
    const newFiles: UploadFile[] = [];
    
    for (const selectedFile of selectedFiles) {
      const validation = storageService.validateFile(selectedFile, { maxSize });
      
      if (!validation.valid) {
        alert(`${selectedFile.name}: ${validation.error}`);
        continue;
      }
      
      const uploadFile: UploadFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: selectedFile.name,
        size: selectedFile.size,
        type: storageService.getFileType(selectedFile.name),
        status: 'pending',
      };
      
      newFiles.push(uploadFile);
    }
    
    if (newFiles.length === 0) return;
    
    // 更新状态为上传中
    onFilesChange([...files, ...newFiles.map(f => ({ ...f, status: 'uploading' as const }))]);
    
    // 上传文件
    for (const uploadFile of newFiles) {
      try {
        const fileToUpload = selectedFiles.find(f => f.name === uploadFile.name);
        if (!fileToUpload) continue;
        
        const result = await storageService.uploadFile(fileToUpload, 'attachments', 'assignments');
        
        // 更新当前文件列表
        const updatedFiles = files.map((f: UploadFile): UploadFile =>
          f.id === uploadFile.id
            ? { ...f, status: 'done', url: result.url, path: result.path }
            : f
        );
        onFilesChange(updatedFiles);
        
        // 更新本地 files 引用
        files.splice(0, files.length, ...updatedFiles);
      } catch (error: any) {
        const updatedFiles = files.map((f: UploadFile): UploadFile =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: error.message }
            : f
        );
        onFilesChange(updatedFiles);
        files.splice(0, files.length, ...updatedFiles);
      }
    }
  }, [files, onFilesChange, maxFiles, maxSize]);
  
  const handleRemoveFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    // 如果文件已上传，删除存储中的文件
    if (file.path && file.status === 'done') {
      try {
        await storageService.deleteFile(file.path, 'attachments');
      } catch (error) {
        console.error('删除文件失败:', error);
      }
    }
    
    onFilesChange(files.filter(f => f.id !== fileId));
  }, [files, onFilesChange]);
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={20} className="text-purple-500" />;
      case 'video':
        return <Video size={20} className="text-red-500" />;
      case 'audio':
        return <Music size={20} className="text-green-500" />;
      case 'document':
      default:
        return <FileText size={20} className="text-blue-500" />;
    }
  };
  
  const canAddMore = files.length < maxFiles && !disabled;
  
  return (
    <div className="space-y-3">
      {/* 上传按钮 */}
      {canAddMore && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">点击上传文件或拖拽到此处</span>
            <span className="text-xs text-gray-400">
              支持图片、文档、视频等格式，最多 {maxFiles} 个文件
            </span>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={accept}
            multiple={maxFiles > 1}
            disabled={disabled}
          />
        </label>
      )}
      
      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                file.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : file.status === 'uploading'
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              {file.status === 'uploading' ? (
                <Loader2 size={20} className="text-blue-500 animate-spin" />
              ) : (
                getFileIcon(file.type)
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {file.status === 'uploading'
                    ? '上传中...'
                    : file.status === 'error'
                    ? file.error || '上传失败'
                    : storageService.formatFileSize(file.size)}
                </p>
              </div>
              
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={file.status === 'uploading'}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* 文件数量提示 */}
      <p className="text-xs text-gray-400 text-center">
        {files.length} / {maxFiles} 个文件
      </p>
    </div>
  );
};

export default FileUpload;
