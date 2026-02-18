/**
 * 演示账号测试数据种子脚本
 * 为演示账号 (test-teacher-001) 创建课程、作业、课堂会话等数据
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('错误: 需要提供 SUPABASE_SERVICE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// 演示账号配置（来自 Login.tsx）
// ============================================
const DEMO_ACCOUNTS = {
  teacher: {
    id: 'test-teacher-001',
    email: 'teacher@test.com',
    name: '张老师',
    role: 'Teacher'
  },
  students: [
    { id: 'test-free-001', email: 'free@test.com', name: 'Free用户', role: 'Student' },
    { id: 'test-pro-001', email: 'pro@test.com', name: 'Pro用户', role: 'Student' },
    { id: 'test-pp-001', email: 'pp@test.com', name: 'ProPlus用户', role: 'Student' },
    { id: 'u-stu-01', email: 'zhangsan@test.com', name: '张三', role: 'Student' },
    { id: 'u-stu-02', email: 'lisi@test.com', name: '李四', role: 'Student' },
    { id: 'u-102', email: 'mike@test.com', name: 'Mike Ross', role: 'Student' }
  ]
};

const TEACHER_ID = DEMO_ACCOUNTS.teacher.id;
const STUDENT_IDS = DEMO_ACCOUNTS.students.map(s => s.id);

async function seedDemoData() {
  console.log('🚀 开始为演示账号插入测试数据...\n');
  console.log('👨‍🏫 教师账号:', DEMO_ACCOUNTS.teacher.name, `(${TEACHER_ID})`);
  console.log('👨‍🎓 学生账号:', STUDENT_IDS.length, '人\n');

  try {
    // 1. 确保演示账号存在于数据库
    console.log('📋 检查演示账号...');
    await ensureDemoUsersExist();

    // 2. 创建测试课程
    console.log('\n📚 创建测试课程...');
    const courses = await createCourses();

    // 3. 创建学生报名记录
    console.log('\n👥 创建学生报名记录...');
    await createEnrollments(courses);

    // 4. 创建课堂会话
    console.log('\n📅 创建课堂会话...');
    const sessions = await createClassSessions();

    // 5. 创建作业
    console.log('\n📝 创建作业...');
    await createAssignments(courses);

    // 6. 创建学生提交记录
    console.log('\n📤 创建学生提交记录...');
    await createSubmissions();

    // 7. 创建签到记录
    console.log('\n✅ 创建签到记录...');
    await createAttendance(sessions);

    console.log('\n✨ 演示数据插入完成！');
    console.log('\n📊 数据摘要：');
    console.log(`  - 课程: ${courses.length} 门`);
    console.log(`  - 学生: ${STUDENT_IDS.length} 人`);
    console.log(`  - 课堂会话: ${sessions.length} 个`);
    console.log(`  - 作业: 4 个`);

    console.log('\n🔑 演示账号登录信息：');
    console.log(`  教师: ${DEMO_ACCOUNTS.teacher.email}`);
    console.log(`  学生: ${DEMO_ACCOUNTS.students[0].email}`);

  } catch (error) {
    console.error('\n❌ 数据插入失败:', error);
    process.exit(1);
  }
}

// 确保演示账号存在
async function ensureDemoUsersExist() {
  const allUsers = [DEMO_ACCOUNTS.teacher, ...DEMO_ACCOUNTS.students];
  
  for (const user of allUsers) {
    const { data, error } = await supabase
      .from('app_users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (error || !data) {
      // 创建用户
      const { error: insertError } = await supabase
        .from('app_users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: '正常',
          created_at: new Date().toISOString(),
          subscription_tier: user.role === 'Teacher' ? 'pro_plus' : 'free'
        }, { onConflict: 'id' });
      
      if (insertError) {
        console.log(`  ⚠️ 创建用户失败 ${user.name}:`, insertError.message);
      } else {
        console.log(`  ✅ 创建用户: ${user.name}`);
      }
    } else {
      console.log(`  ✓ 用户已存在: ${user.name}`);
    }
  }
}

// 创建课程
async function createCourses() {
  const today = new Date();
  
  const courses = [
    {
      id: 'course_demo_001',
      teacher_id: TEACHER_ID,
      title: '敏捷项目管理实战',
      description: '学习敏捷开发方法论，掌握Scrum和Kanban框架的实际应用。本课程包含实际案例分析和团队协作练习。',
      category: 'Advanced',
      total_hours: 24,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      created_at: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'course_demo_002',
      teacher_id: TEACHER_ID,
      title: '项目管理基础入门',
      description: '从零开始学习项目管理基础知识，掌握PMBOK核心概念，为PMP考试打下坚实基础。',
      category: 'Foundation',
      total_hours: 16,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      created_at: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'course_demo_003',
      teacher_id: TEACHER_ID,
      title: '风险管理专题',
      description: '深入学习项目风险识别、评估和应对策略，通过真实案例掌握风险管理工具和技术。',
      category: 'Advanced',
      total_hours: 12,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800',
      created_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const course of courses) {
    const { error } = await supabase
      .from('app_courses')
      .upsert(course, { onConflict: 'id' });
    
    if (error) {
      console.error(`  ❌ 创建课程失败 ${course.title}:`, error.message);
    } else {
      console.log(`  ✅ 课程: ${course.title}`);
    }
  }

  return courses;
}

// 创建报名记录
async function createEnrollments(courses) {
  for (const course of courses) {
    for (const studentId of STUDENT_IDS) {
      const enrollment = {
        id: `enroll_${course.id}_${studentId}`,
        course_id: course.id,
        student_id: studentId,
        teacher_id: TEACHER_ID,
        status: 'active',
        enrolled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: Math.floor(Math.random() * 60) + 20
      };

      const { error } = await supabase
        .from('app_course_enrollments')
        .upsert(enrollment, { onConflict: 'id' });

      if (error && !error.message.includes('duplicate')) {
        // 忽略重复错误
      }
    }
    console.log(`  ✅ ${courses.find(c => c.id === course.id)?.title}: ${STUDENT_IDS.length} 名学生`);
  }
}

// 创建课堂会话
async function createClassSessions() {
  const today = new Date();
  const sessions = [];
  
  // 生成有效的UUID
  const uuid1 = crypto.randomUUID();
  const uuid2 = crypto.randomUUID();
  const uuid3 = crypto.randomUUID();
  
  // 今天的课程（进行中）- 用于演示签到功能
  sessions.push({
    id: uuid1,
    course_id: 'course_demo_001',
    teacher_id: TEACHER_ID,
    title: '敏捷项目管理实战 - 第5课：回顾与改进',
    description: '本节课将进行Sprint回顾会议模拟，学习如何持续改进团队流程。',
    scheduled_start: new Date(today.getTime() - 30 * 60 * 1000).toISOString(),
    duration: 90,
    classroom: 'A-301 教室',
    max_students: 30,
    status: 'in_progress',
    whiteboard_data: {
      check_in_code: '384729',
      check_in_expires_at: new Date(today.getTime() + 5 * 60 * 1000).toISOString(),
      updated_at: today.toISOString()
    }
  });

  // 明天的课程
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  sessions.push({
    id: uuid2,
    course_id: 'course_demo_002',
    teacher_id: TEACHER_ID,
    title: '项目管理基础 - 第3课：项目章程',
    scheduled_start: tomorrow.toISOString(),
    duration: 45,
    classroom: '线上课堂',
    max_students: 50,
    status: 'scheduled'
  });

  // 后天的课程
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(10, 0, 0, 0);
  sessions.push({
    id: uuid3,
    course_id: 'course_demo_003',
    teacher_id: TEACHER_ID,
    title: '风险管理 - 第1课：风险识别',
    scheduled_start: dayAfter.toISOString(),
    duration: 60,
    classroom: 'B-201 教室',
    max_students: 25,
    status: 'scheduled'
  });

  for (const session of sessions) {
    const { error } = await supabase
      .from('app_class_sessions')
      .upsert(session, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ 创建会话失败:`, error.message);
    } else {
      const date = new Date(session.scheduled_start).toLocaleDateString('zh-CN');
      console.log(`  ✅ ${session.title} (${date})`);
    }
  }

  return sessions;
}

// 创建作业
async function createAssignments(courses) {
  const today = new Date();
  
  // 生成UUIDs
  const a1 = crypto.randomUUID();
  const a2 = crypto.randomUUID();
  const a3 = crypto.randomUUID();
  const a4 = crypto.randomUUID();
  
  const assignments = [
    {
      id: a1,
      course_id: 'course_demo_001',
      title: '敏捷估算实践作业',
      content: '<h3>作业要求</h3><p>请根据提供的用户故事列表，使用<strong>故事点估算</strong>方法进行估算。</p><ul><li>阅读用户故事文档</li><li>使用Planning Poker方法</li><li>记录估算过程和结果</li><li>提交估算报告（500字以上）</li></ul>',
      deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      attachments: [],
      status: 'pending',
      created_at: today.toISOString()
    },
    {
      id: a2,
      course_id: 'course_demo_001',
      title: 'Sprint规划案例分析',
      content: '<h3>作业要求</h3><p>分析给定的Sprint规划案例，回答以下问题：</p><ol><li>Sprint目标是否清晰？为什么？</li><li>任务拆分是否合理？</li><li>容量规划是否准确？</li><li>如何改进规划过程？</li></ol><p>请提交一份Word文档或PDF。</p>',
      deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      attachments: ['https://example.com/case-study.pdf'],
      status: 'pending',
      created_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: a3,
      course_id: 'course_demo_002',
      title: '项目章程编写',
      content: '<p>请选择一个你熟悉的项目（可以是学习项目、工作项目或个人项目），编写一份完整的<strong>项目章程</strong>。</p><p>项目章程应包括：</p><ul><li>项目背景和目的</li><li>项目目标和成功标准</li><li>项目范围和边界</li><li>主要干系人</li><li>关键里程碑</li><li>预算和资源需求</li></ul>',
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      attachments: [],
      status: 'pending',
      created_at: today.toISOString()
    },
    {
      id: a4,
      course_id: 'course_demo_001',
      title: '回顾会议总结',
      content: '<p>参加今天的回顾会议后，请完成以下任务：</p><ul><li>记录3个做得好的方面（What went well）</li><li>记录3个需要改进的方面（What could be improved）</li><li>提出1个具体的改进行动计划（Action item）</li></ul><p>请认真思考并诚实记录，这将帮助你建立持续改进的思维。</p>',
      deadline: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 50,
      attachments: [],
      status: 'pending',
      created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const assignment of assignments) {
    const { error } = await supabase
      .from('app_assignments')
      .upsert(assignment, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ 创建作业失败:`, error.message);
    } else {
      const status = new Date(assignment.deadline) < today ? '【已过期】' : '';
      console.log(`  ✅ ${assignment.title} ${status}`);
    }
  }
}

// 创建提交记录
async function createSubmissions() {
  const today = new Date();
  
  // 查找已创建的作业
  const { data: assignments } = await supabase
    .from('app_assignments')
    .select('id, course_id, max_score')
    .limit(10);

  if (!assignments || assignments.length === 0) {
    console.log('  ⚠️ 没有找到作业，跳过创建提交记录');
    return;
  }

  const expiredAssignment = assignments.find(a => a.id.includes('_004')) || assignments[0];
  
  const submissions = [
    {
      assignment_id: expiredAssignment.id,
      student_id: STUDENT_IDS[0],
      content: '<p>这是我的回顾会议总结...</p><ol><li>团队协作很好，沟通及时</li><li>任务完成质量高</li><li>会议效率有提升</li></ol><p>需要改进的方面：</p><ol><li>时间管理还可以更好</li><li>需求变更控制需要加强</li><li>测试覆盖率需要提高</li></ol>',
      attachments: [],
      submitted_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'graded',
      score: 45,
      comment: '总结很全面，但可以更深入分析问题的根本原因。建议多使用具体数据支持观点。',
      graded_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      assignment_id: expiredAssignment.id,
      student_id: STUDENT_IDS[1],
      content: '<p>回顾会议收获很大，团队氛围很好...</p>',
      attachments: [],
      submitted_at: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'graded',
      score: 48,
      comment: '做得很好！分析深入，改进行动具体可行。',
      graded_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      assignment_id: expiredAssignment.id,
      student_id: STUDENT_IDS[2],
      content: '<p>通过回顾会议发现了很多可以改进的地方...</p>',
      attachments: [],
      submitted_at: new Date(today.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'submitted'
    }
  ];

  for (const submission of submissions) {
    // 使用UUID避免格式问题
    const submissionId = crypto.randomUUID();
    
    const { error } = await supabase
      .from('app_student_submissions')
      .upsert({
        id: submissionId,
        ...submission
      }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ 创建提交失败:`, error.message);
    } else {
      console.log(`  ✅ 学生提交: ${submission.student_id} - ${submission.status}`);
    }
  }
}

// 创建签到记录
async function createAttendance(sessions) {
  const today = new Date();
  const todaySession = sessions[0]; // 今天的课程
  
  if (!todaySession) return;

  const attendanceRecords = [
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[0],
      status: 'present',
      checked_in_at: new Date(today.getTime() - 25 * 60 * 1000).toISOString(),
      check_in_method: 'code'
    },
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[1],
      status: 'present',
      checked_in_at: new Date(today.getTime() - 28 * 60 * 1000).toISOString(),
      check_in_method: 'code'
    },
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[2],
      status: 'late',
      checked_in_at: new Date(today.getTime() - 5 * 60 * 1000).toISOString(),
      check_in_method: 'code'
    },
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[3],
      status: 'absent',
      check_in_method: 'code'
    }
  ];

  for (const record of attendanceRecords) {
    const recordId = crypto.randomUUID();
    
    const { error } = await supabase
      .from('app_attendance')
      .upsert({
        id: recordId,
        session_id: record.session_id,
        student_id: record.student_id,
        status: record.status,
        checked_in_at: record.checked_in_at
      }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ 创建签到失败:`, error.message);
    } else {
      console.log(`  ✅ 签到: ${record.student_id} - ${record.status}`);
    }
  }
}

// 执行
seedDemoData();
