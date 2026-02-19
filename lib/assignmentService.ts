import { supabase } from './supabaseClient';

// 作业接口
export interface Assignment {
    id: string;
    title: string;
    course_id: string;
    content: string;
    deadline: string;
    created_at: string;
    max_score: number;
    attachments?: string[];
    status: 'pending' | 'grading' | 'completed';
    submitted_count?: number;
    total_count?: number;
}

// 学生提交接口
export interface StudentSubmission {
    id: string;
    assignment_id: string;
    student_id: string;
    submitted_at: string;
    content: string;
    attachments?: string[];
    score?: number;
    comment?: string;
    status: 'submitted' | 'graded' | 'late';
    // 关联学生信息
    student?: {
        id: string;
        name: string;
        avatar?: string;
    };
}

// 作业表单数据
export interface AssignmentFormData {
    title: string;
    course_id: string;
    content: string;
    deadline: string;
    max_score: number;
    attachments?: string[];
}

/**
 * 获取教师的所有作业
 */
export async function getTeacherAssignments(teacherId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
        .from('app_assignments')
        .select(`
      *,
      app_courses!inner(author)
    `)
        .eq('app_courses.author', teacherId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取作业列表失败:', error);
        throw error;
    }

    return data || [];
}

/**
 * 根据课程ID获取作业
 */
export async function getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
        .from('app_assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取课程作业失败:', error);
        throw error;
    }

    return data || [];
}

/**
 * 创建新作业
 */
export async function createAssignment(assignmentData: AssignmentFormData): Promise<Assignment> {
    const newAssignment = {
        id: `assignment_${Date.now()}`,
        title: assignmentData.title,
        course_id: assignmentData.course_id,
        content: assignmentData.content,
        deadline: assignmentData.deadline,
        max_score: assignmentData.max_score,
        attachments: assignmentData.attachments || [],
        status: 'pending' as const,
    };

    const { data, error } = await supabase
        .from('app_assignments')
        .insert(newAssignment)
        .select()
        .single();

    if (error) {
        console.error('创建作业失败:', error);
        throw error;
    }

    return data;
}

/**
 * 更新作业
 */
export async function updateAssignment(
    assignmentId: string,
    assignmentData: Partial<AssignmentFormData>
): Promise<Assignment> {
    const { data, error } = await supabase
        .from('app_assignments')
        .update(assignmentData)
        .eq('id', assignmentId)
        .select()
        .single();

    if (error) {
        console.error('更新作业失败:', error);
        throw error;
    }

    return data;
}

/**
 * 删除作业
 */
export async function deleteAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
        .from('app_assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) {
        console.error('删除作业失败:', error);
        throw error;
    }
}

/**
 * 获取作业的所有提交
 */
export async function getAssignmentSubmissions(assignmentId: string): Promise<StudentSubmission[]> {
    // 首先获取提交数据
    const { data: submissionsData, error: submissionsError } = await supabase
        .from('app_assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

    if (submissionsError) {
        console.error('获取作业提交失败:', submissionsError);
        throw submissionsError;
    }

    if (!submissionsData || submissionsData.length === 0) {
        return [];
    }

    // 获取所有学生ID
    const studentIds = [...new Set(submissionsData.map((item: any) => item.student_id))];

    // 批量查询学生信息（如果失败则使用默认值）
    let studentsData: any[] = [];
    try {
        const { data, error } = await supabase
            .from('app_users')
            .select('id, name, avatar')
            .in('id', studentIds);
        
        if (!error && data) {
            studentsData = data;
        }
    } catch (e) {
        console.warn('无法获取学生信息，使用默认值');
    }

    // 创建学生信息映射
    const studentMap = new Map();
    studentsData.forEach((student: any) => {
        studentMap.set(student.id, student);
    });

    // 格式化数据
    const submissions = submissionsData.map((item: any) => ({
        id: item.id,
        assignment_id: item.assignment_id,
        student_id: item.student_id,
        submitted_at: item.submitted_at,
        content: item.content,
        attachments: item.attachments || [],
        score: item.score,
        comment: item.comment,
        status: item.status,
        student: studentMap.get(item.student_id) || {
            id: item.student_id,
            name: '未知学生',
            avatar: `https://i.pravatar.cc/150?u=${item.student_id}`,
        },
    }));

    return submissions;
}

/**
 * 批改作业
 */
export async function gradeSubmission(
    submissionId: string,
    score: number,
    comment: string
): Promise<StudentSubmission> {
    const { data, error } = await supabase
        .from('app_assignment_submissions')
        .update({
            score,
            comment,
            status: 'graded',
            graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

    if (error) {
        console.error('批改作业失败:', error);
        throw error;
    }

    return data;
}

/**
 * 批量批改作业
 */
export async function batchGradeSubmissions(
    submissionIds: string[],
    score: number,
    comment?: string
): Promise<void> {
    const { error } = await supabase
        .from('app_student_submissions')
        .update({
            score,
            comment: comment || '批量批改',
            status: 'graded',
            graded_at: new Date().toISOString(),
        })
        .in('id', submissionIds);

    if (error) {
        console.error('批量批改失败:', error);
        throw error;
    }
}

/**
 * 获取作业统计信息
 */
export async function getAssignmentStats(assignmentId: string) {
    // 获取提交统计
    const { data: submissions, error } = await supabase
        .from('app_student_submissions')
        .select('status, score')
        .eq('assignment_id', assignmentId);

    if (error) {
        console.error('获取作业统计失败:', error);
        throw error;
    }

    const stats = {
        total: submissions?.length || 0,
        submitted: submissions?.filter((s: any) => s.status !== 'pending').length || 0,
        graded: submissions?.filter((s: any) => s.status === 'graded').length || 0,
        avgScore: 0,
    };

    const gradedSubmissions = submissions?.filter((s: any) => s.score !== null) || [];
    if (gradedSubmissions.length > 0) {
        stats.avgScore = gradedSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / gradedSubmissions.length;
    }

    return stats;
}
