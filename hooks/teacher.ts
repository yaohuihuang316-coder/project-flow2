// 教师端数据获取 Hooks
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  TeacherStats, 
  TodayClass, 
  TeacherCourse, 
  Assignment,
  TodoItem 
} from '../types/teacher';

// ==========================================
// 统计数据 Hook
// ==========================================

export function useTeacherStats(teacherId?: string) {
  const [stats, setStats] = useState<TeacherStats>({
    courseCount: 0,
    studentCount: 0,
    pendingGrading: 0,
    weekHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      // 1. 获取课程数
      const { count: courseCount } = await supabase
        .from('app_courses')
        .select('*', { count: 'exact', head: true });

      // 2. 获取总学生数（去重）
      const { data: enrollments } = await supabase
        .from('app_course_enrollments')
        .select('student_id');
      const uniqueStudents = new Set(enrollments?.map(e => e.student_id));

      // 3. 获取待批改作业数
      const { count: pendingGrading } = await supabase
        .from('app_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('status', 'grading');

      // 4. 获取本周课时
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekSessions } = await supabase
        .from('app_class_sessions')
        .select('duration')
        .eq('teacher_id', teacherId)
        .gte('scheduled_start', weekStart.toISOString());
      const weekHours = (weekSessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0) / 3600;

      setStats({
        courseCount: courseCount || 0,
        studentCount: uniqueStudents.size,
        pendingGrading: pendingGrading || 0,
        weekHours: Math.round(weekHours * 10) / 10
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// ==========================================
// 今日课程 Hook
// ==========================================

export function useTodayClasses(teacherId?: string) {
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: sessions, error } = await supabase
        .from('app_class_sessions')
        .select('*, app_courses(title)')
        .eq('teacher_id', teacherId)
        .gte('scheduled_start', today.toISOString())
        .lt('scheduled_start', tomorrow.toISOString())
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      const formattedClasses: TodayClass[] = (sessions || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        time: new Date(s.scheduled_start).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        duration: s.duration ? `${Math.round(s.duration / 60)}分钟` : '45分钟',
        classroom: s.classroom || '线上课堂',
        studentCount: s.max_students || 30,
        status: s.status === 'ongoing' ? 'ongoing' : s.status === 'completed' ? 'completed' : 'upcoming'
      }));

      setClasses(formattedClasses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return { classes, loading, error, refetch: fetchClasses };
}

// ==========================================
// 课程列表 Hook
// ==========================================

export function useTeacherCourses(teacherId?: string, limit: number = 10) {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from('app_courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // 获取每个课程的学生数和作业数
      const coursesWithStats = await Promise.all(
        (coursesData || []).map(async (course: any) => {
          // 获取学生数
          const { count: studentCount } = await supabase
            .from('app_user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // 获取作业数
          const { count: totalAssignments } = await supabase
            .from('app_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // 获取待批改作业数
          const { count: pendingAssignments } = await supabase
            .from('app_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('status', 'grading');

          return {
            id: course.id,
            title: course.title,
            category: course.category || 'Foundation',
            description: course.description || '',
            studentCount: studentCount || 0,
            totalHours: course.total_hours || 20,
            completedHours: course.completed_hours || 0,
            progress: course.progress || Math.floor(Math.random() * 40) + 50,
            completionRate: course.completion_rate || 0,
            image: course.image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
            status: course.status || 'active',
            nextClass: course.next_class || '待定',
            rating: course.rating || 4.5,
            createdAt: course.created_at,
            totalAssignments: totalAssignments || 0,
            pendingAssignments: pendingAssignments || 0
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId, limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

// ==========================================
// 作业列表 Hook
// ==========================================

export function useTeacherAssignments(teacherId?: string, limit: number = 10) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      const { data: assignmentsData, error } = await supabase
        .from('app_assignments')
        .select('*, app_courses(title)')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedAssignments: Assignment[] = (assignmentsData || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        courseId: a.course_id,
        courseName: a.app_courses?.title || '未知课程',
        content: a.content || '',
        deadline: new Date(a.deadline).toLocaleDateString('zh-CN'),
        createdAt: a.created_at,
        submittedCount: a.submitted_count || 0,
        totalCount: a.total_count || 0,
        status: a.status as 'pending' | 'grading' | 'completed',
        maxScore: a.max_score || 100,
        attachments: a.attachments || []
      }));

      setAssignments(formattedAssignments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId, limit]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, loading, error, refetch: fetchAssignments };
}

// ==========================================
// 待办事项 Hook
// ==========================================

export function useTeacherTodos(teacherId?: string) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      const todoItems: TodoItem[] = [];

      // 1. 待批改作业
      const { count: pendingHomework } = await supabase
        .from('app_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('status', 'grading');

      if (pendingHomework && pendingHomework > 0) {
        todoItems.push({
          id: 't1',
          type: 'homework',
          title: '待批改作业',
          count: pendingHomework,
          urgent: true
        });
      }

      // 2. 未回复提问
      todoItems.push({
        id: 't2',
        type: 'question',
        title: '学生提问',
        count: 0
      });

      // 3. 课程通知
      todoItems.push({
        id: 't3',
        type: 'notice',
        title: '课程通知',
        count: 0
      });

      setTodos(todoItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return { todos, loading, error, refetch: fetchTodos };
}
