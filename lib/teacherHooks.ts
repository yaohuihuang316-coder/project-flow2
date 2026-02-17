// 教师端通用 Hooks
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

// 获取教师的课程列表
export function useTeacherCourses(teacherId?: string) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_courses')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

// 获取课堂会话
export function useClassSessions(courseId?: string) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('app_class_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('scheduled_start', { ascending: false });
      setSessions(data || []);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
}

// 实时订阅签到
export function useAttendanceRealtime(sessionId?: string) {
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    // 初始加载
    const loadAttendance = async () => {
      const { data } = await supabase
        .from('app_attendance')
        .select('*')
        .eq('session_id', sessionId);
      setAttendance(data || []);
    };
    loadAttendance();

    // 实时订阅
    const subscription = supabase
      .channel(`attendance:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_attendance',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAttendance(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setAttendance(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  return attendance;
}

// 获取作业列表
export function useAssignments(teacherId?: string) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    
    const fetchAssignments = async () => {
      const { data } = await supabase
        .from('app_assignments')
        .select(`
          *,
          course:course_id (title)
        `)
        .eq('teacher_id', teacherId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      setAssignments(data || []);
      setLoading(false);
    };
    
    fetchAssignments();
  }, [teacherId]);

  return { assignments, loading };
}

// 获取学生提交
export function useSubmissions(assignmentId?: string) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    
    const fetchSubmissions = async () => {
      const { data } = await supabase
        .from('app_student_submissions')
        .select(`
          *,
          student:student_id (name, avatar)
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });
      setSubmissions(data || []);
      setLoading(false);
    };
    
    fetchSubmissions();
  }, [assignmentId]);

  return { submissions, loading };
}

// 创建课堂会话
export async function createClassSession(sessionData: any) {
  const { data, error } = await supabase
    .from('app_class_sessions')
    .insert(sessionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// 创建作业
export async function createAssignment(assignmentData: any) {
  const { data, error } = await supabase
    .from('app_assignments')
    .insert(assignmentData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// 批改作业
export async function gradeSubmission(submissionId: string, gradeData: any) {
  const { data, error } = await supabase
    .from('app_student_submissions')
    .update({
      ...gradeData,
      status: 'graded',
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
