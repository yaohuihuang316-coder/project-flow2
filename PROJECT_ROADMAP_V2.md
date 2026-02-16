# ProjectFlow 平台互联互通开发路线图 V2.0

## 项目愿景
构建一个完整互通的项目管理学习平台，实现学生端、教师端、管理后台三端数据无缝流转。

---

## 当前架构问题

### 1. 数据孤岛现象
- 学生端 `app_users` 与教师端数据分离
- 课程数据各自独立存储
- 作业提交数据未关联学生真实进度
- 公告、通知未按角色精准推送

### 2. 权限体系混乱
- 角色定义不统一（Editor/Teacher/Admin）
- 数据访问权限未做RLS细分
- 跨端数据查询无统一接口

### 3. 数据冗余
- 用户信息多处重复存储
- 课程信息学生端/教师端不一致
- 统计数据实时性不足

---

## 核心架构改造方案

### 第一阶段：数据模型统一（Week 1-2）

#### 1.1 用户体系统一
```sql
-- 统一用户角色枚举
CREATE TYPE user_role AS ENUM (
    'Student',      -- 学生
    'Teacher',      -- 教师（认证通过）
    'TeacherPending', -- 教师（待审核）
    'Admin',        -- 管理员
    'SuperAdmin'    -- 超级管理员
);

-- 扩展用户表
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS 
    teacher_status VARCHAR(20) DEFAULT NULL, -- pending/approved/rejected
    institution_name TEXT,
    institution_code TEXT,
    job_title TEXT,
    bio TEXT,
    teaching_hours INTEGER DEFAULT 0,
    student_count INTEGER DEFAULT 0,
    course_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 5.0;
```

#### 1.2 课程数据主从架构
```sql
-- 主课程表（唯一数据源）
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50), -- Foundation/Advanced/Implementation
    cover_image TEXT,
    total_hours INTEGER,
    status VARCHAR(20) DEFAULT 'draft', -- draft/published/archived
    created_by UUID REFERENCES app_users(id), -- 教师ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- 扩展字段
);

-- 学生课程关联表（进度追踪）
CREATE TABLE user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id),
    course_id UUID REFERENCES courses(id),
    progress INTEGER DEFAULT 0, -- 0-100
    status VARCHAR(20) DEFAULT 'enrolled', -- enrolled/in_progress/completed
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- 教师课程关联表
CREATE TABLE teacher_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES app_users(id),
    course_id UUID REFERENCES courses(id),
    role VARCHAR(20) DEFAULT 'primary', -- primary/assistant
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, course_id)
);
```

#### 1.3 作业数据统一
```sql
-- 作业主表
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id),
    teacher_id UUID REFERENCES app_users(id),
    title TEXT NOT NULL,
    description TEXT,
    max_score INTEGER DEFAULT 100,
    deadline TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'draft', -- draft/published/closed
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学生作业提交表
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id),
    student_id UUID REFERENCES app_users(id),
    content TEXT,
    attachments JSONB,
    score INTEGER,
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'submitted', -- submitted/graded/late
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES app_users(id)
);
```

#### 1.4 课堂数据实时同步
```sql
-- 课堂会话表
CREATE TABLE class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id),
    teacher_id UUID REFERENCES app_users(id),
    title TEXT,
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming/ongoing/completed
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    classroom TEXT, -- 教室/会议室号
    meeting_link TEXT, -- 在线会议链接
    recording_url TEXT -- 回放链接
);

-- 学生出勤表
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES class_sessions(id),
    student_id UUID REFERENCES app_users(id),
    status VARCHAR(20), -- present/absent/late
    check_in_at TIMESTAMPTZ,
    check_in_method VARCHAR(20) -- manual/auto/qrcode
);

-- 课堂提问表
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES class_sessions(id),
    student_id UUID REFERENCES app_users(id),
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_answered BOOLEAN DEFAULT false,
    answer TEXT,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课堂投票表
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES class_sessions(id),
    teacher_id UUID REFERENCES app_users(id),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- [{id, text}, ...]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 投票结果表
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id),
    student_id UUID REFERENCES app_users(id),
    option_id TEXT NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, student_id)
);
```

---

### 第二阶段：权限与RLS体系（Week 2-3）

#### 2.1 行级安全策略（RLS）
```sql
-- 课程表权限
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 学生查看已发布的课程
CREATE POLICY "Students view published courses" ON courses
    FOR SELECT TO authenticated
    USING (status = 'published' OR created_by = current_setting('app.current_user_id', true)::uuid);

-- 教师管理自己的课程
CREATE POLICY "Teachers manage own courses" ON courses
    FOR ALL TO authenticated
    USING (created_by = current_setting('app.current_user_id', true)::uuid)
    WITH CHECK (created_by = current_setting('app.current_user_id', true)::uuid);

-- 管理员管理所有课程
CREATE POLICY "Admins manage all courses" ON courses
    FOR ALL TO authenticated
    USING (current_setting('app.current_user_role', true) IN ('Admin', 'SuperAdmin'));

-- 作业表权限
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 学生查看自己课程的作业
CREATE POLICY "Students view course assignments" ON assignments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_courses 
            WHERE user_id = current_setting('app.current_user_id', true)::uuid 
            AND course_id = assignments.course_id
        )
        OR teacher_id = current_setting('app.current_user_id', true)::uuid
    );

-- 教师管理自己课程的作业
CREATE POLICY "Teachers manage assignments" ON assignments
    FOR ALL TO authenticated
    USING (teacher_id = current_setting('app.current_user_id', true)::uuid);

-- 提交表权限
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 学生查看/提交自己的作业
CREATE POLICY "Students own submissions" ON submissions
    FOR ALL TO authenticated
    USING (student_id = current_setting('app.current_user_id', true)::uuid);

-- 教师查看/批改自己课程的学生作业
CREATE POLICY "Teachers grade submissions" ON submissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM assignments 
            WHERE id = submissions.assignment_id 
            AND teacher_id = current_setting('app.current_user_id', true)::uuid
        )
    );
```

#### 2.2 统一权限中间件
```typescript
// lib/auth.ts
export const setUserContext = async (userId: string, role: string) => {
    await supabase.rpc('set_user_context', {
        user_id: userId,
        user_role: role
    });
};

// 每次请求前设置上下文
export const withAuth = async (callback: Function) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: profile } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    await setUserContext(user.id, profile?.role || 'Student');
    return callback();
};
```

---

### 第三阶段：API接口标准化（Week 3-4）

#### 3.1 统一API规范
```typescript
// types/api.ts
interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        total: number;
        page: number;
        perPage: number;
    }
}

// 课程API
interface CourseAPI {
    // 学生端
    getStudentCourses(): Promise<APIResponse<UserCourse[]>>;
    getCourseDetail(courseId: string): Promise<APIResponse<Course>>;
    enrollCourse(courseId: string): Promise<APIResponse<void>>;
    updateProgress(courseId: string, progress: number): Promise<APIResponse<void>>;
    
    // 教师端
    getTeacherCourses(): Promise<APIResponse<Course[]>>;
    createCourse(data: CreateCourseDTO): Promise<APIResponse<Course>>;
    updateCourse(courseId: string, data: UpdateCourseDTO): Promise<APIResponse<Course>>;
    getCourseStudents(courseId: string): Promise<APIResponse<Student[]>>;
    
    // 管理端
    getAllCourses(filters: CourseFilters): Promise<APIResponse<Course[]>>;
    approveCourse(courseId: string): Promise<APIResponse<void>>;
    featureCourse(courseId: string, featured: boolean): Promise<APIResponse<void>>;
}

// 作业API
interface AssignmentAPI {
    // 学生端
    getStudentAssignments(): Promise<APIResponse<AssignmentWithStatus[]>>;
    submitAssignment(assignmentId: string, data: SubmissionDTO): Promise<APIResponse<Submission>>;
    getSubmissionDetail(assignmentId: string): Promise<APIResponse<Submission>>;
    
    // 教师端
    getTeacherAssignments(courseId?: string): Promise<APIResponse<Assignment[]>>;
    createAssignment(data: CreateAssignmentDTO): Promise<APIResponse<Assignment>>;
    getSubmissions(assignmentId: string): Promise<APIResponse<Submission[]>>;
    gradeSubmission(submissionId: string, score: number, feedback: string): Promise<APIResponse<void>>;
    batchGrade(submissions: BatchGradeDTO[]): Promise<APIResponse<void>>;
    
    // 管理端
    getAllAssignments(): Promise<APIResponse<Assignment[]>>;
    getAssignmentStats(): Promise<APIResponse<AssignmentStats>>;
}

// 课堂API
interface ClassroomAPI {
    // 教师端
    createSession(data: CreateSessionDTO): Promise<APIResponse<ClassSession>>;
    startSession(sessionId: string): Promise<APIResponse<void>>;
    endSession(sessionId: string): Promise<APIResponse<void>>;
    getSessionStudents(sessionId: string): Promise<APIResponse<Attendance[]>>;
    createPoll(sessionId: string, data: CreatePollDTO): Promise<APIResponse<Poll>>;
    getPollResults(pollId: string): Promise<APIResponse<PollResult>>;
    answerQuestion(questionId: string, answer: string): Promise<APIResponse<void>>;
    
    // 学生端
    getSessionDetail(sessionId: string): Promise<APIResponse<ClassSession>>;
    checkIn(sessionId: string, method: string): Promise<APIResponse<void>>;
    askQuestion(sessionId: string, content: string, anonymous: boolean): Promise<APIResponse<Question>>;
    upvoteQuestion(questionId: string): Promise<APIResponse<void>>;
    votePoll(pollId: string, optionId: string): Promise<APIResponse<void>>;
    
    // 公共
    getSessionQuestions(sessionId: string): Promise<APIResponse<Question[]>>;
    getActivePoll(sessionId: string): Promise<APIResponse<Poll | null>>;
}
```

#### 3.2 数据同步服务
```typescript
// lib/sync.ts
export class DataSyncService {
    // 实时订阅学生进度
    static subscribeStudentProgress(studentId: string, callback: Function) {
        return supabase
            .channel(`student-progress-${studentId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'user_courses', filter: `user_id=eq.${studentId}` },
                callback
            )
            .subscribe();
    }
    
    // 实时订阅课堂提问
    static subscribeSessionQuestions(sessionId: string, callback: Function) {
        return supabase
            .channel(`session-questions-${sessionId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'questions', filter: `session_id=eq.${sessionId}` },
                callback
            )
            .subscribe();
    }
    
    // 实时订阅投票结果
    static subscribePollResults(pollId: string, callback: Function) {
        return supabase
            .channel(`poll-results-${pollId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'poll_votes', filter: `poll_id=eq.${pollId}` },
                callback
            )
            .subscribe();
    }
    
    // 批量同步学生数据
    static async syncStudentData(studentIds: string[]) {
        const { data, error } = await supabase.rpc('get_students_summary', {
            student_ids: studentIds
        });
        return { data, error };
    }
}
```

---

### 第四阶段：前端数据层重构（Week 4-6）

#### 4.1 统一数据Store
```typescript
// stores/platformStore.ts
import { create } from 'zustand';

interface PlatformState {
    // 当前用户
    currentUser: UserProfile | null;
    setCurrentUser: (user: UserProfile | null) => void;
    
    // 课程数据（多端共享）
    courses: Course[];
    fetchCourses: (role: 'student' | 'teacher' | 'admin') => Promise<void>;
    
    // 作业数据
    assignments: Assignment[];
    fetchAssignments: (filters: AssignmentFilters) => Promise<void>;
    
    // 课堂数据
    activeSession: ClassSession | null;
    sessionStudents: Student[];
    sessionQuestions: Question[];
    setActiveSession: (session: ClassSession | null) => void;
    
    // 实时数据订阅
    subscriptions: (() => void)[];
    subscribeToSession: (sessionId: string) => void;
    unsubscribeAll: () => void;
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
    currentUser: null,
    courses: [],
    assignments: [],
    activeSession: null,
    sessionStudents: [],
    sessionQuestions: [],
    subscriptions: [],
    
    setCurrentUser: (user) => set({ currentUser: user }),
    
    fetchCourses: async (role) => {
        let query = supabase.from('courses').select('*');
        
        if (role === 'student') {
            query = query.eq('status', 'published');
        } else if (role === 'teacher') {
            const userId = get().currentUser?.id;
            query = query.eq('created_by', userId);
        }
        
        const { data } = await query;
        set({ courses: data || [] });
    },
    
    subscribeToSession: (sessionId) => {
        // 订阅学生列表变化
        const studentsSub = DataSyncService.subscribeStudentProgress(sessionId, (payload) => {
            // 更新学生状态
        });
        
        // 订阅提问
        const questionsSub = DataSyncService.subscribeSessionQuestions(sessionId, (payload) => {
            set(state => ({
                sessionQuestions: [...state.sessionQuestions, payload.new]
            }));
        });
        
        set(state => ({
            subscriptions: [...state.subscriptions, studentsSub, questionsSub]
        }));
    },
    
    unsubscribeAll: () => {
        get().subscriptions.forEach(unsub => unsub());
        set({ subscriptions: [] });
    }
}));
```

#### 4.2 各端组件适配
```typescript
// 学生端课程卡片
const StudentCourseCard = ({ courseId }: { courseId: string }) => {
    const { courses, fetchCourseProgress } = usePlatformStore();
    const course = courses.find(c => c.id === courseId);
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
        fetchCourseProgress(courseId).then(setProgress);
    }, [courseId]);
    
    return (
        <Card>
            <Progress value={progress} />
            <Button onClick={() => continueLearning(courseId)}>继续学习</Button>
        </Card>
    );
};

// 教师端同一课程卡片
const TeacherCourseCard = ({ courseId }: { courseId: string }) => {
    const { courses, fetchCourseStudents } = usePlatformStore();
    const course = courses.find(c => c.id === courseId);
    const [students, setStudents] = useState<Student[]>([]);
    
    useEffect(() => {
        fetchCourseStudents(courseId).then(setStudents);
    }, [courseId]);
    
    return (
        <Card>
            <Stats students={students.length} avgProgress={calculateAvg(students)} />
            <Button onClick={() => manageCourse(courseId)}>管理课程</Button>
        </Card>
    );
};

// 管理端同一课程卡片
const AdminCourseCard = ({ courseId }: { courseId: string }) => {
    const { courses } = usePlatformStore();
    const course = courses.find(c => c.id === courseId);
    
    return (
        <Card>
            <Badge status={course.status} />
            <Actions>
                <Button onClick={() => approveCourse(courseId)}>审核通过</Button>
                <Button onClick={() => featureCourse(courseId)}>设为推荐</Button>
            </Actions>
        </Card>
    );
};
```

---

### 第五阶段：管理后台数据接入（Week 5-7）

#### 5.1 数据看板
```typescript
// pages/admin/Dashboard.tsx
const AdminDashboard = () => {
    const [stats, setStats] = useState<PlatformStats>({
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        activeSessions: 0,
        pendingAssignments: 0,
        todayLogins: 0
    });
    
    useEffect(() => {
        // 获取平台整体数据
        fetchPlatformStats().then(setStats);
        
        // 实时订阅关键指标
        const sub = supabase
            .channel('platform-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, 
                () => fetchPlatformStats().then(setStats)
            )
            .subscribe();
            
        return () => sub.unsubscribe();
    }, []);
    
    return (
        <DashboardLayout>
            <StatsCards stats={stats} />
            <Charts>
                <UserGrowthChart />
                <CourseEngagementChart />
                <AssignmentCompletionChart />
            </Charts>
            <RecentActivityFeed />
        </DashboardLayout>
    );
};
```

#### 5.2 教师管理
```typescript
// pages/admin/Teachers.tsx
const TeacherManagement = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
    
    const handleApprove = async (teacherId: string) => {
        await supabase.rpc('approve_teacher', { teacher_id: teacherId });
        // 刷新列表
    };
    
    const handleViewDetail = (teacherId: string) => {
        // 查看教师详情：课程、学生、评价
        navigate(`/admin/teachers/${teacherId}`);
    };
    
    return (
        <div>
            <PendingApprovalList 
                teachers={pendingTeachers} 
                onApprove={handleApprove} 
            />
            <TeacherList 
                teachers={teachers} 
                onViewDetail={handleViewDetail}
            />
        </div>
    );
};
```

#### 5.3 课程审核
```typescript
// pages/admin/Courses.tsx
const CourseManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    
    const handleReview = async (courseId: string, status: 'approved' | 'rejected') => {
        await supabase.from('courses').update({ status }).eq('id', courseId);
        
        // 发送通知给教师
        await sendNotification({
            userId: course.teacherId,
            type: 'course_reviewed',
            content: `您的课程《${course.title}》已${status === 'approved' ? '通过' : '未通过'}审核`
        });
    };
    
    return (
        <CourseReviewTable 
            courses={courses}
            onReview={handleReview}
            onPreview={(courseId) => window.open(`/preview/${courseId}`)}
        />
    );
};
```

---

### 第六阶段：数据迁移与测试（Week 7-8）

#### 6.1 数据迁移脚本
```sql
-- 迁移旧课程数据
INSERT INTO courses (id, title, description, category, created_by, created_at, status)
SELECT 
    c.id,
    c.title,
    c.description,
    c.category,
    u.id as created_by,
    c.created_at,
    'published' as status
FROM old_courses c
JOIN app_users u ON c.teacher_email = u.email;

-- 迁移学生课程关联
INSERT INTO user_courses (user_id, course_id, progress, status)
SELECT 
    user_id,
    course_id,
    progress,
    CASE 
        WHEN progress = 100 THEN 'completed'
        WHEN progress > 0 THEN 'in_progress'
        ELSE 'enrolled'
    END as status
FROM old_user_courses;

-- 迁移作业数据
INSERT INTO assignments (id, course_id, teacher_id, title, description, max_score, deadline)
SELECT 
    a.id,
    a.course_id,
    c.created_by as teacher_id,
    a.title,
    a.description,
    a.max_score,
    a.deadline
FROM old_assignments a
JOIN courses c ON a.course_id = c.id;
```

#### 6.2 测试策略
```typescript
// 集成测试
describe('Platform Integration', () => {
    test('Student enrolls → Teacher sees student in course', async () => {
        const student = await createTestUser('Student');
        const teacher = await createTestUser('Teacher');
        const course = await createCourse(teacher.id);
        
        // 学生报名
        await enrollCourse(student.id, course.id);
        
        // 教师查看课程学生列表
        const students = await getCourseStudents(teacher.id, course.id);
        expect(students).toContainEqual(expect.objectContaining({ id: student.id }));
    });
    
    test('Teacher creates assignment → Student sees in list', async () => {
        const assignment = await createAssignment(teacher.id, course.id);
        
        const studentAssignments = await getStudentAssignments(student.id);
        expect(studentAssignments).toContainEqual(expect.objectContaining({ id: assignment.id }));
    });
    
    test('Student submits → Teacher sees in grading queue', async () => {
        const submission = await submitAssignment(student.id, assignment.id);
        
        const pendingSubmissions = await getPendingSubmissions(teacher.id);
        expect(pendingSubmissions).toContainEqual(expect.objectContaining({ id: submission.id }));
    });
});
```

---

## 实施时间表

| 周次 | 阶段 | 主要任务 | 交付物 |
|------|------|----------|--------|
| Week 1 | 数据模型统一 | 设计新schema，创建migration脚本 | SQL migration files |
| Week 2 | 权限体系 | RLS策略，权限中间件 | auth.ts, RLS policies |
| Week 3 | API标准化 | 接口定义，Supabase functions | API specs, edge functions |
| Week 4 | 前端Store | Zustand store，数据订阅 | platformStore.ts |
| Week 5 | 学生端适配 | 课程/作业/课堂数据接入 | Student pages v2 |
| Week 6 | 教师端适配 | 学生管理/批改/课堂数据 | Teacher pages v2 |
| Week 7 | 管理后台 | Dashboard/审核/数据看板 | Admin pages v2 |
| Week 8 | 测试上线 | 数据迁移，集成测试，部署 | Test reports, deployed app |

---

## 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 数据迁移丢失 | 高 | 备份原数据，渐进式迁移，回滚方案 |
| 权限配置错误 | 高 | 完整测试所有角色数据访问，审计日志 |
| 实时订阅性能 | 中 | 分页加载，防抖处理，订阅清理 |
| 多端数据不一致 | 中 | 统一数据源，乐观更新，错误重试 |

---

## 后续迭代计划

### Phase 3（8周后）
- AI智能批改
- 学习路径推荐
- 数据大屏可视化
- 移动端APP

### Phase 4（12周后）
- 第三方LMS集成
- API开放平台
- 多语言支持
- 企业版定制

---

*文档版本: v2.0*
*制定日期: 2026-02-17*
*预计周期: 8周*
