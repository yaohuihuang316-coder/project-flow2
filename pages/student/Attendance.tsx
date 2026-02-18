import React, { useState, useEffect } from 'react';
import {
  QrCode, Clock, CheckCircle2, ArrowLeft,
  Loader2, MapPin, Calendar, History, AlertCircle
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface StudentAttendanceProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
}

// 签到记录
interface AttendanceRecord {
  id: string;
  session_id: string;
  course_name: string;
  teacher_name: string;
  status: 'present' | 'late' | 'absent';
  check_in_time?: string;
  check_in_method: 'code' | 'manual' | 'auto';
  scheduled_date: string;
}

// 当前课程
interface CurrentClass {
  id: string;
  session_id: string;
  course_name: string;
  teacher_name: string;
  teacher_avatar?: string;
  start_time: string;
  end_time: string;
  classroom: string;
  status: 'ongoing' | 'upcoming' | 'ended';
}

const StudentAttendance: React.FC<StudentAttendanceProps> = ({
  currentUser,
  onNavigate
}) => {
  const [checkInCode, setCheckInCode] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  const [currentClasses, setCurrentClasses] = useState<CurrentClass[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checkin' | 'history'>('checkin');

  // 加载数据
  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const loadData = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      // 1. 获取学生报名的课程
      const { data: enrollments, error: enrollError } = await supabase
        .from('app_course_enrollments')
        .select('course_id')
        .eq('student_id', currentUser.id);
      
      if (enrollError) throw enrollError;
      
      const courseIds = enrollments?.map(e => e.course_id) || [];
      
      // 2. 获取当前进行中的课程
      if (courseIds.length > 0) {
        const { data: sessions, error: sessionError } = await supabase
          .from('app_class_sessions')
          .select(`
            *,
            course:course_id (title, teacher_id),
            teacher:teacher_id (name, avatar)
          `)
          .in('course_id', courseIds)
          .gte('scheduled_start', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // 2小时内开始或正在进行
          .lte('scheduled_start', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()) // 24小时内
          .order('scheduled_start', { ascending: true });
        
        if (!sessionError && sessions) {
          const formattedClasses: CurrentClass[] = sessions.map((session: any) => {
            const startTime = new Date(session.scheduled_start);
            const endTime = new Date(startTime.getTime() + (session.duration || 45) * 60 * 1000);
            const now = new Date();
            
            let status: CurrentClass['status'] = 'upcoming';
            if (now >= startTime && now <= endTime) {
              status = 'ongoing';
            } else if (now > endTime || session.status === 'completed') {
              status = 'ended';
            }
            
            return {
              id: session.id,
              session_id: session.id,
              course_name: session.course?.title || session.title || '未命名课程',
              teacher_name: session.teacher?.name || '未知教师',
              teacher_avatar: session.teacher?.avatar,
              start_time: session.scheduled_start,
              end_time: endTime.toISOString(),
              classroom: session.classroom || '在线课堂',
              status
            };
          });
          setCurrentClasses(formattedClasses);
        }
      }

      // 3. 获取签到历史
      const { data: attendanceData, error: attendError } = await supabase
        .from('app_attendance')
        .select(`
          *,
          session:session_id (
            scheduled_start,
            course:course_id (title)
          )
        `)
        .eq('student_id', currentUser.id)
        .order('checked_in_at', { ascending: false })
        .limit(50);
      
      if (!attendError && attendanceData) {
        const formattedHistory: AttendanceRecord[] = attendanceData.map((record: any) => ({
          id: record.id,
          session_id: record.session_id,
          course_name: record.session?.course?.title || '未知课程',
          teacher_name: record.teacher_name || '未知教师',
          status: record.status,
          check_in_time: record.checked_in_at,
          check_in_method: record.check_in_method || 'code',
          scheduled_date: record.session?.scheduled_start
        }));
        setAttendanceHistory(formattedHistory);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理签到
  const handleCheckIn = async () => {
    if (!checkInCode.trim() || !currentUser?.id) return;
    
    setIsCheckingIn(true);
    setCheckInResult(null);
    
    try {
      // 1. 查找匹配的签到码
      const { data: sessions, error: sessionError } = await supabase
        .from('app_class_sessions')
        .select(`
          *,
          course:course_id (title)
        `)
        .not('whiteboard_data', 'is', null)
        .gte('scheduled_start', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
        .lte('scheduled_start', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());
      
      if (sessionError) throw sessionError;
      
      // 查找匹配的会话
      const matchedSession = sessions?.find((s: any) => 
        s.whiteboard_data?.check_in_code === checkInCode.trim()
      );
      
      if (!matchedSession) {
        setCheckInResult({
          success: false,
          message: '签到码无效或已过期，请检查输入或联系教师'
        });
        return;
      }
      
      // 检查签到码是否过期
      const expiryTime = new Date(matchedSession.whiteboard_data?.check_in_expires_at);
      if (expiryTime < new Date()) {
        setCheckInResult({
          success: false,
          message: '签到码已过期，请联系教师重新生成'
        });
        return;
      }
      
      // 2. 检查是否已签到
      const { data: existingRecord } = await supabase
        .from('app_attendance')
        .select('*')
        .eq('session_id', matchedSession.id)
        .eq('student_id', currentUser.id)
        .single();
      
      if (existingRecord) {
        setCheckInResult({
          success: true,
          message: `您已成功签到！课程: ${matchedSession.course?.title || '未命名课程'}`
        });
        // 刷新数据
        await loadData();
        return;
      }
      
      // 3. 创建签到记录
      const scheduledStart = new Date(matchedSession.scheduled_start);
      const now2 = new Date();
      const isLate = now2.getTime() - scheduledStart.getTime() > 15 * 60 * 1000; // 15分钟后算迟到
      
      const { error: insertError } = await supabase
        .from('app_attendance')
        .insert({
          session_id: matchedSession.id,
          student_id: currentUser.id,
          status: isLate ? 'late' : 'present',
          checked_in_at: now2.toISOString(),
          check_in_method: 'code'
        });
      
      if (insertError) throw insertError;
      
      setCheckInResult({
        success: true,
        message: `签到成功！${isLate ? '（迟到）' : ''}课程: ${matchedSession.course?.title || '未命名课程'}`
      });
      
      // 刷新数据
      await loadData();
      setCheckInCode('');
      
    } catch (error: any) {
      console.error('签到失败:', error);
      setCheckInResult({
        success: false,
        message: '签到失败，请重试或联系教师'
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 快速签到（针对当前课程）
  const quickCheckIn = async (sessionId: string) => {
    if (!currentUser?.id) return;
    
    setIsCheckingIn(true);
    try {
      // 1. 获取课程的签到码
      const { data: session, error: sessionError } = await supabase
        .from('app_class_sessions')
        .select('whiteboard_data, course:course_id (title), scheduled_start')
        .eq('id', sessionId)
        .single();
      
      if (sessionError || !session?.whiteboard_data?.check_in_code) {
        alert('该课程暂未开放签到');
        return;
      }
      
      // 2. 自动填充签到码并签到
      setCheckInCode(session.whiteboard_data.check_in_code);
      await handleCheckIn();
      
    } catch (error) {
      console.error('快速签到失败:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 获取状态样式
  const getStatusStyle = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-600';
      case 'late':
        return 'bg-yellow-100 text-yellow-600';
      case 'absent':
        return 'bg-red-100 text-red-600';
    }
  };

  const getStatusText = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return '出勤';
      case 'late':
        return '迟到';
      case 'absent':
        return '缺勤';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.(Page.DASHBOARD)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">课堂签到</h1>
              <p className="text-sm text-gray-500">输入签到码完成签到</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'checkin'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            签到
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            历史记录
          </button>
        </div>

        {activeTab === 'checkin' ? (
          <div className="space-y-4">
            {/* 签到输入区 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode size={40} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">输入签到码</h2>
                <p className="text-sm text-gray-500">请输入教师提供的6位签到码</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                />

                {checkInResult && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    checkInResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {checkInResult.success ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                    <p className="text-sm">{checkInResult.message}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckIn}
                  disabled={checkInCode.length !== 6 || isCheckingIn}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      签到中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      确认签到
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 当前课程 */}
            {currentClasses.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  当前课程
                </h3>
                <div className="space-y-3">
                  {currentClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-4 rounded-xl border ${
                        cls.status === 'ongoing'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{cls.course_name}</h4>
                          <p className="text-sm text-gray-500">{cls.teacher_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cls.status === 'ongoing'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {cls.status === 'ongoing' ? '进行中' : '即将开始'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(cls.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          -{new Date(cls.end_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {cls.classroom}
                        </span>
                      </div>
                      {cls.status === 'ongoing' && (
                        <button
                          onClick={() => quickCheckIn(cls.session_id)}
                          disabled={isCheckingIn}
                          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          快速签到
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 签到统计 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-green-600">
                  {attendanceHistory.filter(r => r.status === 'present').length}
                </p>
                <p className="text-xs text-gray-500">出勤</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-yellow-600">
                  {attendanceHistory.filter(r => r.status === 'late').length}
                </p>
                <p className="text-xs text-gray-500">迟到</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-red-600">
                  {attendanceHistory.filter(r => r.status === 'absent').length}
                </p>
                <p className="text-xs text-gray-500">缺勤</p>
              </div>
            </div>

            {/* 历史记录 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <History size={18} className="text-blue-500" />
                签到记录
              </h3>
              {attendanceHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                  <p>暂无签到记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{record.course_name}</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(record.scheduled_date).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                        {record.check_in_time && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(record.check_in_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
