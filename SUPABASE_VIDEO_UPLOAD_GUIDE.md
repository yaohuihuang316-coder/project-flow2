# Supabase 教学视频上传完整指南

## 目录

1. [Storage 存储桶配置](#1-storage-存储桶配置)
2. [数据库表设计](#2-数据库表设计)
3. [前端上传实现](#3-前端上传实现)
4. [视频播放集成](#4-视频播放集成)
5. [权限控制](#5-权限控制)
6. [成本优化](#6-成本优化)

---

## 1. Storage 存储桶配置

### 1.1 创建存储桶

登录 Supabase Dashboard → Storage → New bucket

```
Bucket Name: course-videos
Public: false (推荐私有，通过签名URL访问)
```

### 1.2 文件夹结构规划

```
course-videos/
├── raw/                    # 原始上传视频
│   ├── course-{id}/
│   │   ├── chapter-{id}/
│   │   │   └── {uuid}.mp4
├── processed/              # 转码后视频（多分辨率）
│   ├── course-{id}/
│   │   ├── chapter-{id}/
│   │   │   ├── 1080p/
│   │   │   ├── 720p/
│   │   │   └── 480p/
├── thumbnails/             # 视频封面图
│   └── course-{id}/
│       └── chapter-{id}.jpg
└── subtitles/              # 字幕文件
    └── course-{id}/
        └── chapter-{id}-zh.srt
```

### 1.3 存储桶策略配置

```sql
-- 允许教师上传视频
CREATE POLICY "Teachers can upload videos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'course-videos' AND
        (storage.foldername(name))[1] = 'raw' AND
        EXISTS (
            SELECT 1 FROM app_teacher_courses
            WHERE teacher_id = auth.uid()::text
        )
    );

-- 允许学生查看视频（通过签名URL）
CREATE POLICY "Students can view videos" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'course-videos' AND
        EXISTS (
            SELECT 1 FROM app_course_enrollments
            WHERE student_id = auth.uid()::text
            AND course_id = (storage.foldername(name))[2]
        )
    );
```

---

## 2. 数据库表设计

### 2.1 视频资源表

```sql
-- 课程章节视频表
CREATE TABLE IF NOT EXISTS app_course_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL,
    
    -- 视频基本信息
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER,                    -- 时长（秒）
    
    -- 存储信息
    storage_path TEXT NOT NULL,          -- Supabase Storage 路径
    file_size BIGINT,                    -- 文件大小（字节）
    mime_type TEXT DEFAULT 'video/mp4',
    
    -- 多分辨率支持
    qualities JSONB DEFAULT '[]',        -- ["1080p", "720p", "480p"]
    
    -- 处理状态
    status TEXT DEFAULT 'uploading',     -- uploading/processing/ready/error
    processing_error TEXT,               -- 错误信息
    
    -- 观看统计
    view_count INTEGER DEFAULT 0,
    total_watch_time INTEGER DEFAULT 0,  -- 总观看时长（秒）
    
    -- 字幕
    subtitles JSONB DEFAULT '[]',        -- [{lang: "zh", url: "..."}]
    
    -- 时间戳
    uploaded_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 视频观看进度表（学生端）
CREATE TABLE IF NOT EXISTS app_video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES app_course_videos(id) ON DELETE CASCADE,
    
    -- 播放进度
    current_time INTEGER DEFAULT 0,      -- 当前播放位置（秒）
    duration INTEGER,                    -- 视频总时长
    progress DECIMAL(5,2) DEFAULT 0,     -- 观看进度百分比
    
    -- 播放状态
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    
    -- 播放历史
    watch_sessions JSONB DEFAULT '[]',   -- [{start: 0, end: 120}, ...]
    
    -- 元数据
    playback_speed DECIMAL(3,2) DEFAULT 1.0,
    volume INTEGER DEFAULT 100,
    
    last_position TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- 创建索引
CREATE INDEX idx_course_videos_course ON app_course_videos(course_id);
CREATE INDEX idx_course_videos_chapter ON app_course_videos(chapter_id);
CREATE INDEX idx_video_progress_user ON app_video_progress(user_id);
CREATE INDEX idx_video_progress_video ON app_video_progress(video_id);
```

### 2.2 视频转码任务表（配合外部服务）

```sql
-- 视频处理任务表
CREATE TABLE IF NOT EXISTS app_video_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES app_course_videos(id) ON DELETE CASCADE,
    
    -- 任务信息
    job_type TEXT NOT NULL,              -- transcode/thumbnail/extract_audio
    status TEXT DEFAULT 'pending',       -- pending/processing/completed/failed
    
    -- 输入输出
    input_path TEXT NOT NULL,
    output_paths JSONB DEFAULT '{}',     -- {"1080p": "...", "720p": "..."}
    
    -- 处理参数
    params JSONB DEFAULT '{}',           -- 转码参数
    
    -- 结果
    result JSONB,                        -- 处理结果
    error_message TEXT,
    
    -- 时间戳
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. 前端上传实现

### 3.1 视频上传组件

```typescript
// components/VideoUploader.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Film, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface VideoUploaderProps {
  courseId: string;
  chapterId: string;
  onUploadComplete: (videoUrl: string) => void;
  onError?: (error: Error) => void;
}

interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  courseId,
  chapterId,
  onUploadComplete,
  onError
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0
  });
  const [videoInfo, setVideoInfo] = useState<{
    duration: number;
    width: number;
    height: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 获取视频信息
  const getVideoInfo = (file: File): Promise<{ duration: number; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          duration: Math.round(video.duration),
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      
      video.onerror = () => reject(new Error('无法读取视频信息'));
      video.src = URL.createObjectURL(file);
    });
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // 验证文件类型
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        error: '请上传 MP4、WebM 或 MOV 格式的视频'
      });
      return;
    }

    // 验证文件大小（最大 2GB）
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        error: '视频文件大小不能超过 2GB'
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      const info = await getVideoInfo(selectedFile);
      setVideoInfo(info);
    } catch (err) {
      console.error('获取视频信息失败:', err);
    }
  };

  // 上传视频
  const uploadVideo = async () => {
    if (!file) return;

    setUploadProgress({ status: 'uploading', progress: 0 });
    abortControllerRef.current = new AbortController();

    try {
      // 1. 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `raw/course-${courseId}/chapter-${chapterId}/${fileName}`;

      // 2. 上传到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(prev => ({
              ...prev,
              progress: Math.round(percent)
            }));
          }
        });

      if (uploadError) throw uploadError;

      // 3. 创建视频记录
      const { data: videoRecord, error: dbError } = await supabase
        .from('app_course_videos')
        .insert({
          course_id: courseId,
          chapter_id: chapterId,
          title: file.name,
          storage_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          duration: videoInfo?.duration,
          status: 'uploading',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress({ status: 'processing', progress: 100 });

      // 4. 触发视频处理（调用外部转码服务）
      await triggerVideoProcessing(videoRecord.id, filePath);

      setUploadProgress({ status: 'completed', progress: 100 });
      onUploadComplete(filePath);

    } catch (err: any) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        error: err.message || '上传失败'
      });
      onError?.(err);
    }
  };

  // 触发视频处理
  const triggerVideoProcessing = async (videoId: string, filePath: string) => {
    // 这里可以调用 Cloudflare Stream、AWS Elastic Transcoder 或自建服务
    // 示例：使用 Supabase Edge Function
    const { error } = await supabase.functions.invoke('process-video', {
      body: {
        videoId,
        filePath,
        qualities: ['1080p', '720p', '480p']
      }
    });

    if (error) {
      console.error('触发视频处理失败:', error);
      // 更新视频状态为错误
      await supabase
        .from('app_course_videos')
        .update({ status: 'error', processing_error: error.message })
        .eq('id', videoId);
    }
  };

  // 取消上传
  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setFile(null);
    setUploadProgress({ status: 'idle', progress: 0 });
    setVideoInfo(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">上传视频</h3>

      {/* 文件选择区域 */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <Film className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-2">点击或拖拽视频文件到这里</p>
          <p className="text-sm text-gray-400">支持 MP4、WebM、MOV 格式，最大 2GB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* 已选择文件 */}
      {file && uploadProgress.status !== 'completed' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Film className="text-blue-500" size={32} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
                {videoInfo && ` · ${Math.floor(videoInfo.duration / 60)}:${(videoInfo.duration % 60).toString().padStart(2, '0')}`}
              </p>
            </div>
            <button
              onClick={cancelUpload}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* 进度条 */}
          {uploadProgress.status === 'uploading' && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">上传中...</span>
                <span className="text-gray-900">{uploadProgress.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadProgress.status === 'processing' && (
            <div className="flex items-center gap-2 text-amber-600">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">视频处理中，请稍候...</span>
            </div>
          )}

          {uploadProgress.status === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              <span className="text-sm">{uploadProgress.error}</span>
            </div>
          )}

          {/* 上传按钮 */}
          {uploadProgress.status === 'idle' && (
            <button
              onClick={uploadVideo}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              开始上传
            </button>
          )}
        </div>
      )}

      {/* 上传完成 */}
      {uploadProgress.status === 'completed' && (
        <div className="text-center py-8">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
          <p className="font-medium text-gray-900">视频上传成功！</p>
          <p className="text-sm text-gray-500 mt-1">系统正在后台处理视频...</p>
          <button
            onClick={cancelUpload}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
          >
            上传更多视频
          </button>
        </div>
      )}
    </div>
  );
};
```

### 3.2 视频播放组件

```typescript
// components/VideoPlayer.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface VideoPlayerProps {
  videoId: string;
  courseId: string;
  poster?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  courseId,
  poster,
  onProgress,
  onComplete
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [quality, setQuality] = useState<'auto' | '1080p' | '720p' | '480p'>('auto');

  // 获取视频签名URL
  useEffect(() => {
    const getVideoUrl = async () => {
      const { data: videoData } = await supabase
        .from('app_course_videos')
        .select('storage_path')
        .eq('id', videoId)
        .single();

      if (videoData) {
        const { data: signedUrl } = await supabase.storage
          .from('course-videos')
          .createSignedUrl(videoData.storage_path, 3600); // 1小时有效期

        if (signedUrl) {
          setVideoUrl(signedUrl.signedUrl);
        }
      }
    };

    getVideoUrl();
  }, [videoId]);

  // 保存播放进度
  const saveProgress = async (time: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('app_video_progress').upsert({
      user_id: user.id,
      video_id: videoId,
      current_time: Math.floor(time),
      duration: Math.floor(duration),
      progress: Math.round((time / duration) * 100),
      last_position: new Date().toISOString()
    });
  };

  // 时间更新处理
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    onProgress?.(video.currentTime, video.duration);

    // 每5秒保存一次进度
    if (Math.floor(video.currentTime) % 5 === 0) {
      saveProgress(video.currentTime);
    }
  };

  // 播放完成处理
  const handleEnded = () => {
    setIsPlaying(false);
    saveProgress(duration);
    onComplete?.();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl">加载中...</div>;
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* 控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 进度条 */}
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer mb-4"
        />

        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-white hover:text-blue-400">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:text-blue-400"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setVolume(vol);
                if (videoRef.current) videoRef.current.volume = vol;
                setIsMuted(vol === 0);
              }}
              className="w-20 h-1 bg-white/30 rounded-full"
            />
          </div>

          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* 画质选择 */}
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as any)}
            className="bg-white/20 text-white text-sm rounded px-2 py-1"
          >
            <option value="auto">自动</option>
            <option value="1080p">1080P</option>
            <option value="720p">720P</option>
            <option value="480p">480P</option>
          </select>

          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="text-white hover:text-blue-400"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 4. Supabase Edge Function（视频处理）

```typescript
// supabase/functions/process-video/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { videoId, filePath, qualities } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // 更新状态为处理中
    await supabase
      .from('app_course_videos')
      .update({ status: 'processing' })
      .eq('id', videoId);

    // 这里可以调用外部转码服务
    // 例如：Cloudflare Stream、AWS Elemental MediaConvert、Mux 等
    
    // 示例：调用 Cloudflare Stream API
    const cloudflareResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/{account_id}/stream', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CLOUDFLARE_API_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://${Deno.env.get('SUPABASE_PROJECT_REF')}.supabase.co/storage/v1/object/authenticated/course-videos/${filePath}`,
        meta: { videoId }
      })
    });

    const cloudflareData = await cloudflareResponse.json();

    if (!cloudflareData.success) {
      throw new Error(cloudflareData.errors?.[0]?.message || '转码失败');
    }

    // 更新视频记录
    await supabase
      .from('app_course_videos')
      .update({
        status: 'ready',
        qualities,
        processing_result: cloudflareData.result
      })
      .eq('id', videoId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    await supabase
      .from('app_course_videos')
      .update({
        status: 'error',
        processing_error: error.message
      })
      .eq('id', videoId);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

## 5. 成本优化建议

| 策略 | 说明 | 预计节省 |
|------|------|---------|
| 分级存储 | 7天后转存到廉价存储 | 40% |
| CDN 缓存 | 配置长期缓存头 | 30% |
| 分辨率适配 | 根据设备提供不同分辨率 | 50% 带宽 |
| 预签名URL | 1小时有效期，避免盗链 | 安全 |

---

## 6. 部署检查清单

- [ ] 创建 `course-videos` 存储桶
- [ ] 配置 RLS 策略
- [ ] 创建数据库表
- [ ] 部署 Edge Function
- [ ] 配置 Cloudflare Stream API 密钥
- [ ] 测试上传流程
- [ ] 测试播放流程
- [ ] 配置监控告警
