/**
 * 演示账号测试数据种子脚本 V2
 * 为演示账号 (test-teacher-001) 创建课程、作业、课堂会话等数据
 * 适配实际数据库表结构
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
// 注意：数据库使用UUID格式，所以我们需要生成UUID格式的演示账号
// 使用数据库中已存在的教师ID（外键约束要求）
const TEACHER_UUID = '340f28b9-8557-4e6f-adbf-e2abb1543ec2';
const STUDENT_UUIDS = [
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'd4e5f6a7-b8c9-0123-defa-456789012345',
  'e5f6a7b8-c9d0-1234-efab-567890123456',
  'f6a7b8c9-d0e1-2345-fabc-678901234567',
  'a7b8c9d0-e1f2-3456-abcd-789012345678'
];

const DEMO_ACCOUNTS = {
  teacher: {
    id: TEACHER_UUID,
    email: 'teacher@test.com',
    name: '张老师',
    role: 'Teacher'
  },
  students: [
    { id: STUDENT_UUIDS[0], email: 'free@test.com', name: 'Free用户', role: 'Student' },
    { id: STUDENT_UUIDS[1], email: 'pro@test.com', name: 'Pro用户', role: 'Student' },
    { id: STUDENT_UUIDS[2], email: 'pp@test.com', name: 'ProPlus用户', role: 'Student' },
    { id: STUDENT_UUIDS[3], email: 'zhangsan@test.com', name: '张三', role: 'Student' },
    { id: STUDENT_UUIDS[4], email: 'lisi@test.com', name: '李四', role: 'Student' },
    { id: STUDENT_UUIDS[5], email: 'mike@test.com', name: 'Mike Ross', role: 'Student' }
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
    const sessions = await createClassSessions(courses);

    // 5. 创建作业
    console.log('\n📝 创建作业...');
    await createAssignments(courses);

    // 6. 创建签到记录
    console.log('\n✅ 创建签到记录...');
    await createAttendance(sessions);

    console.log('\n✨ 演示数据插入完成！');
    console.log('\n📊 数据摘要：');
    console.log(`  - 课程: ${courses.length} 门`);
    console.log(`  - 学生: ${STUDENT_IDS.length} 人`);
    console.log(`  - 课堂会话: ${sessions.length} 个`);

    console.log('\n🔑 演示账号登录信息：');
    console.log(`  教师: ${DEMO_ACCOUNTS.teacher.email}`);
    console.log(`  学生: ${DEMO_ACCOUNTS.students[0].email}`);
    console.log(`\n📝 提示：使用"一键演示登录"按钮快速登录`);

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
      const { error: insertError } = await supabase
        .from('app_users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role === 'Teacher' ? 'Editor' : 'Student',
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
      id: crypto.randomUUID(),
      title: '敏捷项目管理实战',
      description: '学习敏捷开发方法论，掌握Scrum和Kanban框架的实际应用。本课程包含实际案例分析和团队协作练习。',
      category: 'Advanced',
      author: TEACHER_ID,
      duration: '24小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      created_at: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: '项目管理基础入门',
      description: '从零开始学习项目管理基础知识，掌握PMBOK核心概念，为PMP考试打下坚实基础。',
      category: 'Foundation',
      author: TEACHER_ID,
      duration: '16小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      created_at: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: '风险管理专题',
      description: '深入学习项目风险识别、评估和应对策略，通过真实案例掌握风险管理工具和技术。',
      category: 'Advanced',
      author: TEACHER_ID,
      duration: '12小时',
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

// 创建报名记录（使用 app_user_progress 表）
async function createEnrollments(courses) {
  for (const course of courses) {
    for (const studentId of STUDENT_IDS) {
      const progress = {
        id: crypto.randomUUID(),
        user_id: studentId,
        course_id: course.id,
        progress: Math.floor(Math.random() * 60) + 20,
        completed_chapters: Math.floor(Math.random() * 5),
        last_accessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('app_user_progress')
        .upsert(progress, { onConflict: 'id' });
    }
    console.log(`  ✅ ${course.title}: ${STUDENT_IDS.length} 名学生`);
  }
}

// 创建课堂会话
async function createClassSessions(courses) {
  const today = new Date();
  const sessions = [];
  
  const agileCourse = courses.find(c => c.title.includes('敏捷'));
  
  // 今天的课程（进行中）- 用于演示签到功能
  sessions.push({
    id: crypto.randomUUID(),
    course_id: agileCourse?.id || courses[0].id,
    teacher_id: TEACHER_ID,
    title: '敏捷项目管理实战 - 第5课：回顾与改进',
    description: '本节课将进行Sprint回顾会议模拟，学习如何持续改进团队流程。',
    scheduled_start: new Date(today.getTime() - 30 * 60 * 1000).toISOString(),
    scheduled_end: new Date(today.getTime() + 60 * 60 * 1000).toISOString(),
    duration: 90,
    classroom: 'A-301 教室',
    max_students: 30,
    status: 'upcoming',
    actual_start: new Date(today.getTime() - 30 * 60 * 1000).toISOString(),
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
    id: crypto.randomUUID(),
    course_id: courses[1]?.id || courses[0].id,
    teacher_id: TEACHER_ID,
    title: '项目管理基础 - 第3课：项目章程',
    scheduled_start: tomorrow.toISOString(),
    scheduled_end: new Date(tomorrow.getTime() + 45 * 60 * 1000).toISOString(),
    duration: 45,
    classroom: '线上课堂',
    max_students: 50,
    status: 'upcoming'
  });

  // 后天的课程
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(10, 0, 0, 0);
  sessions.push({
    id: crypto.randomUUID(),
    course_id: courses[2]?.id || courses[0].id,
    teacher_id: TEACHER_ID,
    title: '风险管理 - 第1课：风险识别',
    scheduled_start: dayAfter.toISOString(),
    scheduled_end: new Date(dayAfter.getTime() + 60 * 60 * 1000).toISOString(),
    duration: 60,
    classroom: 'B-201 教室',
    max_students: 25,
    status: 'upcoming'
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
  
  const agileCourse = courses.find(c => c.title.includes('敏捷'));
  const basicCourse = courses.find(c => c.title.includes('基础'));
  
  const assignments = [
    {
      id: crypto.randomUUID(),
      course_id: agileCourse?.id,
      teacher_id: TEACHER_ID,
      title: '敏捷估算实践作业',
      content: '<h3>作业要求</h3><p>请根据提供的用户故事列表，使用<strong>故事点估算</strong>方法进行估算。</p><ul><li>阅读用户故事文档</li><li>使用Planning Poker方法</li><li>记录估算过程和结果</li><li>提交估算报告（500字以上）</li></ul>',
      deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      attachments: [],
      status: 'pending',
      created_at: today.toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: agileCourse?.id,
      teacher_id: TEACHER_ID,
      title: 'Sprint规划案例分析',
      content: '<h3>作业要求</h3><p>分析给定的Sprint规划案例，回答以下问题：</p><ol><li>Sprint目标是否清晰？为什么？</li><li>任务拆分是否合理？</li><li>容量规划是否准确？</li><li>如何改进规划过程？</li></ol>',
      deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      attachments: [],
      status: 'pending',
      created_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: basicCourse?.id,
      teacher_id: TEACHER_ID,
      title: '项目章程编写',
      content: '<p>请选择一个你熟悉的项目，编写一份完整的<strong>项目章程</strong>。</p>',
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      attachments: [],
      status: 'pending',
      created_at: today.toISOString()
    },
    {
      id: crypto.randomUUID(),
      course_id: agileCourse?.id,
      teacher_id: TEACHER_ID,
      title: '回顾会议总结',
      content: '<p>参加今天的回顾会议后，请完成以下任务...</p>',
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

// 创建签到记录
async function createAttendance(sessions) {
  const today = new Date();
  const todaySession = sessions[0];
  
  if (!todaySession) return;

  const attendanceRecords = [
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[0],
      status: 'present',
      check_in_time: new Date(today.getTime() - 25 * 60 * 1000).toISOString()
    },
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[1],
      status: 'present',
      check_in_time: new Date(today.getTime() - 28 * 60 * 1000).toISOString()
    },
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[2],
      status: 'late',
      check_in_time: new Date(today.getTime() - 5 * 60 * 1000).toISOString()
    },
    {
      session_id: todaySession.id,
      student_id: STUDENT_IDS[3],
      status: 'absent'
    }
  ];

  for (const record of attendanceRecords) {
    const { error } = await supabase
      .from('app_attendance')
      .upsert({
        id: crypto.randomUUID(),
        ...record
      }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ 创建签到失败:`, error.message);
    } else {
      console.log(`  ✅ 签到: ${record.student_id.substring(0, 10)}... - ${record.status}`);
    }
  }
}

// 执行
seedDemoData();
