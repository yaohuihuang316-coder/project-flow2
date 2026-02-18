// 课程管理服务
import { supabase } from './supabaseClient';

export interface Course {
    id: string;
    title: string;
    description: string | null;
    category: 'Foundation' | 'Advanced' | 'Implementation';
    teacher_id: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    cover_image: string | null;
    student_count: number;
    total_hours: number;
    completed_hours: number;
    progress: number;
    completion_rate: number;
    rating: number;
    total_assignments: number;
    pending_assignments: number;
    created_at: string;
    updated_at: string;
}

export interface CourseFormData {
    title: string;
    description: string;
    category: 'Foundation' | 'Advanced' | 'Implementation';
    total_hours: number;
    cover_image?: string;
}

/**
 * 获取教师的课程列表
 */
export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
    const { data, error } = await supabase
        .from('app_courses')
        .select('*')
        .eq('author', teacherId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取课程列表失败:', error);
        throw error;
    }

    return data || [];
}

/**
 * 创建新课程
 */
export async function createCourse(teacherId: string, courseData: CourseFormData): Promise<Course> {
    const newCourse = {
        id: `course_${Date.now()}`,
        teacher_id: teacherId,
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        total_hours: courseData.total_hours,
        cover_image: courseData.cover_image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
        status: 'draft' as const,
        student_count: 0,
        completed_hours: 0,
        progress: 0,
        completion_rate: 0,
        rating: 0,
        total_assignments: 0,
        pending_assignments: 0,
    };

    const { data, error } = await supabase
        .from('app_courses')
        .insert(newCourse)
        .select()
        .single();

    if (error) {
        console.error('创建课程失败:', error);
        throw error;
    }

    return data;
}

/**
 * 更新课程
 */
export async function updateCourse(courseId: string, courseData: Partial<CourseFormData>): Promise<Course> {
    const { data, error } = await supabase
        .from('app_courses')
        .update(courseData)
        .eq('id', courseId)
        .select()
        .single();

    if (error) {
        console.error('更新课程失败:', error);
        throw error;
    }

    return data;
}

/**
 * 删除课程
 */
export async function deleteCourse(courseId: string): Promise<void> {
    const { error } = await supabase
        .from('app_courses')
        .delete()
        .eq('id', courseId);

    if (error) {
        console.error('删除课程失败:', error);
        throw error;
    }
}

/**
 * 归档/取消归档课程
 */
export async function toggleArchiveCourse(courseId: string, currentStatus: string): Promise<Course> {
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';

    const { data, error } = await supabase
        .from('app_courses')
        .update({ status: newStatus })
        .eq('id', courseId)
        .select()
        .single();

    if (error) {
        console.error('归档课程失败:', error);
        throw error;
    }

    return data;
}

/**
 * 获取课程统计信息
 */
export async function getCourseStats(teacherId: string) {
    const { data: courses, error } = await supabase
        .from('app_courses')
        .select('status, student_count, completion_rate')
        .eq('teacher_id', teacherId);

    if (error) {
        console.error('获取课程统计失败:', error);
        return {
            active: 0,
            completed: 0,
            draft: 0,
            archived: 0,
            totalStudents: 0,
            avgCompletion: 0,
        };
    }

    const stats = {
        active: courses.filter((c: any) => c.status === 'active').length,
        completed: courses.filter((c: any) => c.status === 'completed').length,
        draft: courses.filter((c: any) => c.status === 'draft').length,
        archived: courses.filter((c: any) => c.status === 'archived').length,
        totalStudents: courses.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0),
        avgCompletion: 0,
    };

    const activeCourses = courses.filter((c: any) => c.status === 'active');
    if (activeCourses.length > 0) {
        stats.avgCompletion = activeCourses.reduce((sum: number, c: any) => sum + (c.completion_rate || 0), 0) / activeCourses.length;
    }

    return stats;
}
