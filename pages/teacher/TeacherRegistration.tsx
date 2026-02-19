import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Building2, 
  CheckCircle, AlertCircle, ArrowRight, Loader2, ArrowLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Page } from '../../types';

interface RegistrationForm {
  institutionName: string;
  institutionCode: string;
  jobTitle: string;
  licenseFile: File | null;
}

interface TeacherRegistrationProps {
  onNavigate?: (page: Page, param?: string) => void;
}

export default function TeacherRegistration({ onNavigate }: TeacherRegistrationProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState<RegistrationForm>({
    institutionName: '',
    institutionCode: '',
    jobTitle: '',
    licenseFile: null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('文件大小不能超过10MB');
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setErrorMessage('只支持 PDF、JPG、PNG 格式');
        return;
      }
      setForm(prev => ({ ...prev, licenseFile: file }));
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    if (!form.institutionName || !form.jobTitle || !form.licenseFile) {
      setErrorMessage('请填写所有必填项并上传资质文件');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('请先登录');
      }

      // 上传资质文件
      const fileExt = form.licenseFile.name.split('.').pop();
      const fileName = `teacher-licenses/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, form.licenseFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error('文件上传失败: ' + uploadError.message);
      }

      // 获取文件URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // 创建审核记录
      const { error: insertError } = await supabase
        .from('app_teacher_verifications')
        .upsert({
          teacher_id: user.id,
          license_url: publicUrl,
          institution_name: form.institutionName,
          institution_code: form.institutionCode || null,
          job_title: form.jobTitle,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }, {
          onConflict: 'teacher_id'
        });

      if (insertError) {
        throw new Error('提交审核失败: ' + insertError.message);
      }

      // 更新用户信息
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          institution_name: form.institutionName,
          institution_code: form.institutionCode || null,
          job_title: form.jobTitle,
          teacher_license_url: publicUrl
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('更新用户信息失败: ' + updateError.message);
      }

      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 成功状态
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">提交成功！</h2>
          <p className="text-slate-600 mb-6">
            您的教师资质认证申请已提交，我们将在 1-3 个工作日内完成审核。
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              审核期间您可以先浏览平台内容
            </p>
          </div>
          <button
            onClick={() => onNavigate?.(Page.TEACHER_PROFILE)}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
          >
            返回教师中心
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate?.(Page.TEACHER_PROFILE)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
        </div>

        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">教师认证</h1>
          <p className="text-slate-600">提交资质信息，成为认证教师</p>
        </div>

        {/* 进度指示 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
              1
            </div>
            <div className="w-20 h-1 bg-indigo-600"></div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
              2
            </div>
            <div className="w-20 h-1 bg-slate-200"></div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-medium">
              3
            </div>
          </div>
        </div>
        <div className="flex justify-center text-sm text-slate-500 mb-8 -mt-4">
          <span className="w-20 text-center">填写信息</span>
          <span className="w-20 text-center text-indigo-600">资质审核</span>
          <span className="w-20 text-center">开始使用</span>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <Building2 className="w-6 h-6 text-indigo-600 mr-2" />
            机构信息
          </h2>

          {/* 机构名称 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              教育机构名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.institutionName}
              onChange={(e) => setForm(prev => ({ ...prev, institutionName: e.target.value }))}
              placeholder="请输入您的学校或机构名称"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* 机构代码 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              统一社会信用代码
              <span className="text-slate-400 font-normal ml-1">(选填)</span>
            </label>
            <input
              type="text"
              value={form.institutionCode}
              onChange={(e) => setForm(prev => ({ ...prev, institutionCode: e.target.value }))}
              placeholder="请输入机构统一社会信用代码"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* 职位 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              职位/职称 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.jobTitle}
              onChange={(e) => setForm(prev => ({ ...prev, jobTitle: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">请选择职位</option>
              <option value="教授">教授</option>
              <option value="副教授">副教授</option>
              <option value="讲师">讲师</option>
              <option value="助教">助教</option>
              <option value="高级教师">高级教师</option>
              <option value="中级教师">中级教师</option>
              <option value="初级教师">初级教师</option>
              <option value="企业培训师">企业培训师</option>
              <option value="项目经理">项目经理</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <hr className="border-slate-100 my-6" />

          {/* 资质文件上传 */}
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <FileText className="w-6 h-6 text-indigo-600 mr-2" />
            资质证明
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              上传教师资格证或工作证明 <span className="text-red-500">*</span>
            </label>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                form.licenseFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {form.licenseFile ? (
                <div className="flex items-center justify-center text-green-700">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  <span className="font-medium">{form.licenseFile.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-1">点击或拖拽上传文件</p>
                  <p className="text-slate-400 text-sm">支持 PDF、JPG、PNG，最大 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="text-blue-800 font-medium mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              审核说明
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 审核时间：1-3 个工作日</li>
              <li>• 审核通过后将开通教师端全部功能</li>
              <li>• 请确保上传的证件清晰可见</li>
            </ul>
          </div>

          {/* 错误提示 */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-lg hover:shadow-lg transition-shadow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                提交审核
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>

          <p className="text-center text-slate-500 text-sm mt-4">
            提交即表示您同意我们的
            <a href="#" className="text-indigo-600 hover:underline">教师服务协议</a>
          </p>
        </div>
      </div>
    </div>
  );
}
