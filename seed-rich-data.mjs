/**
 * 丰富的演示数据种子脚本
 * 创建更多课程、学生、作业、签到记录等数据
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

// 教师ID（与演示账号匹配）
const TEACHER_ID = '340f28b9-8557-4e6f-adbf-e2abb1543ec2';
const TEACHER_EMAIL = 'teacher@test.com';
const TEACHER_NAME = '张老师';

// 更多学生（共20人）
const STUDENTS = [
  { id: crypto.randomUUID(), name: '王小明', email: 'wangxm@student.com' },
  { id: crypto.randomUUID(), name: '李华', email: 'lihua@student.com' },
  { id: crypto.randomUUID(), name: '张伟', email: 'zhangwei@student.com' },
  { id: crypto.randomUUID(), name: '刘洋', email: 'liuyang@student.com' },
  { id: crypto.randomUUID(), name: '陈静', email: 'chenjing@student.com' },
  { id: crypto.randomUUID(), name: '杨帆', email: 'yangfan@student.com' },
  { id: crypto.randomUUID(), name: '赵雪', email: 'zhaoxue@student.com' },
  { id: crypto.randomUUID(), name: '黄磊', email: 'huanglei@student.com' },
  { id: crypto.randomUUID(), name: '周杰', email: 'zhoujie@student.com' },
  { id: crypto.randomUUID(), name: '吴倩', email: 'wuqian@student.com' },
  { id: crypto.randomUUID(), name: '徐鹏', email: 'xupeng@student.com' },
  { id: crypto.randomUUID(), name: '孙丽', email: 'sunli@student.com' },
  { id: crypto.randomUUID(), name: '马超', email: 'machao@student.com' },
  { id: crypto.randomUUID(), name: '朱婷', email: 'zhuting@student.com' },
  { id: crypto.randomUUID(), name: '胡军', email: 'hujun@student.com' },
  { id: crypto.randomUUID(), name: '郭敏', email: 'guomin@student.com' },
  { id: crypto.randomUUID(), name: '林峰', email: 'linfeng@student.com' },
  { id: crypto.randomUUID(), name: '何欣', email: 'hexin@student.com' },
  { id: crypto.randomUUID(), name: '高飞', email: 'gaofei@student.com' },
  { id: crypto.randomUUID(), name: '梁雨', email: 'liangyu@student.com' }
];

async function seedRichData() {
  console.log('🚀 开始插入丰富的演示数据...\n');

  try {
    // 1. 创建学生用户
    console.log('👨‍🎓 创建20名学生...');
    await createStudents();

    // 2. 创建更多课程（共8门）
    console.log('\n📚 创建8门课程...');
    const courses = await createMoreCourses();

    // 3. 为每门课程报名学生
    console.log('\n👥 为学生报名课程...');
    await createEnrollments(courses);

    // 4. 创建更多课堂会话
    console.log('\n📅 创建课堂会话...');
    const sessions = await createMoreSessions(courses);

    // 5. 创建大量作业
    console.log('\n📝 创建15个作业...');
    await createMoreAssignments(courses);

    // 6. 创建学生提交记录
    console.log('\n📤 创建学生提交...');
    await createMoreSubmissions(courses);

    // 7. 创建大量签到记录
    console.log('\n✅ 创建签到记录...');
    await createMoreAttendance(sessions);

    // 8. 创建课程公告
    console.log('\n📢 创建课程公告...');
    await createAnnouncements(courses);

    console.log('\n✨ 丰富数据插入完成！');
    console.log('\n📊 数据摘要：');
    console.log(`  - 学生: 20 人`);
    console.log(`  - 课程: ${courses.length} 门`);
    console.log(`  - 作业: 15 个`);
    console.log(`  - 课堂会话: ${sessions.length} 个`);
    console.log(`  - 签到记录: 大量`);

  } catch (error) {
    console.error('\n❌ 数据插入失败:', error);
    process.exit(1);
  }
}

async function createStudents() {
  for (const student of STUDENTS) {
    const { error } = await supabase
      .from('app_users')
      .upsert({
        id: student.id,
        email: student.email,
        name: student.name,
        role: 'Student',
        status: '正常',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_tier: 'free'
      }, { onConflict: 'id' });
    
    if (!error) {
      process.stdout.write('.');
    }
  }
  console.log(` ${STUDENTS.length}人`);
}

async function createMoreCourses() {
  const today = new Date();
  
  const courses = [
    {
      id: crypto.randomUUID(),
      title: '敏捷项目管理实战',
      description: '学习敏捷开发方法论，掌握Scrum和Kanban框架的实际应用。',
      category: 'Advanced',
      author: TEACHER_ID,
      duration: '24小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800'
    },
    {
      id: crypto.randomUUID(),
      title: '项目管理基础入门',
      description: '从零开始学习项目管理基础知识，掌握PMBOK核心概念。',
      category: 'Foundation',
      author: TEACHER_ID,
      duration: '16小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800'
    },
    {
      id: crypto.randomUUID(),
      title: '风险管理专题',
      description: '深入学习项目风险识别、评估和应对策略。',
      category: 'Advanced',
      author: TEACHER_ID,
      duration: '12小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800'
    },
    {
      id: crypto.randomUUID(),
      title: 'PMP认证考前冲刺',
      description: '针对PMP认证考试的强化训练，包含模拟题和考点解析。',
      category: 'Certification',
      author: TEACHER_ID,
      duration: '32小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
    },
    {
      id: crypto.randomUUID(),
      title: '项目沟通与团队管理',
      description: '学习有效的项目沟通技巧和团队管理方法。',
      category: 'SoftSkills',
      author: TEACHER_ID,
      duration: '18小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
    },
    {
      id: crypto.randomUUID(),
      title: '成本管理与控制',
      description: '项目预算编制、成本估算和控制的实用方法。',
      category: 'Advanced',
      author: TEACHER_ID,
      duration: '14小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800'
    },
    {
      id: crypto.randomUUID(),
      title: '项目管理工具实践',
      description: '掌握MS Project、Jira、Trello等项目管理工具的使用。',
      category: 'Tools',
      author: TEACHER_ID,
      duration: '20小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'
    },
    {
      id: crypto.randomUUID(),
      title: '项目案例分析与复盘',
      description: '通过真实项目案例学习项目管理的成功经验和失败教训。',
      category: 'CaseStudy',
      author: TEACHER_ID,
      duration: '16小时',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800'
    }
  ];

  for (const course of courses) {
    const { error } = await supabase
      .from('app_courses')
      .upsert({
        ...course,
        created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'id' });
    
    if (!error) {
      console.log(`  ✅ ${course.title}`);
    }
  }

  return courses;
}

async function createEnrollments(courses) {
  for (const course of courses) {
    // 每门课程15-20人报名
    const numStudents = 15 + Math.floor(Math.random() * 6);
    const shuffled = [...STUDENTS].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numStudents; i++) {
      const progress = {
        id: crypto.randomUUID(),
        user_id: shuffled[i].id,
        course_id: course.id,
        progress: Math.floor(Math.random() * 80) + 10,
        completed_chapters: Math.floor(Math.random() * 8),
        last_accessed: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        notes: Math.random() > 0.7 ? '已记录学习笔记' : null
      };

      await supabase.from('app_user_progress').upsert(progress, { onConflict: 'id' });
    }
    console.log(`  ✅ ${course.title}: ${numStudents}人`);
  }
}

async function createMoreSessions(courses) {
  const today = new Date();
  const sessions = [];

  // 为每门课程创建过去和未来的课堂
  for (const course of courses) {
    // 过去的课堂（已完成）
    for (let i = 0; i < 3; i++) {
      const sessionDate = new Date(today);
      sessionDate.setDate(sessionDate.getDate() - (i + 1) * 7);
      sessionDate.setHours(14, 0, 0, 0);

      sessions.push({
        id: crypto.randomUUID(),
        course_id: course.id,
        teacher_id: TEACHER_ID,
        title: `${course.title} - 第${4 - i}课`,
        scheduled_start: sessionDate.toISOString(),
        scheduled_end: new Date(sessionDate.getTime() + 90 * 60 * 1000).toISOString(),
        duration: 90,
        classroom: i % 2 === 0 ? 'A-301 教室' : '线上课堂',
        max_students: 30,
        status: 'completed',
        actual_start: sessionDate.toISOString(),
        actual_end: new Date(sessionDate.getTime() + 85 * 60 * 1000).toISOString()
      });
    }

    // 今天的课堂（进行中）- 只有第一门课
    if (course.title.includes('敏捷')) {
      const todaySession = new Date(today);
      todaySession.setHours(9, 0, 0, 0);
      
      sessions.push({
        id: crypto.randomUUID(),
        course_id: course.id,
        teacher_id: TEACHER_ID,
        title: `${course.title} - 第5课：回顾与改进`,
        description: '本节课将进行Sprint回顾会议模拟',
        scheduled_start: todaySession.toISOString(),
        scheduled_end: new Date(todaySession.getTime() + 90 * 60 * 1000).toISOString(),
        duration: 90,
        classroom: 'A-301 教室',
        max_students: 30,
        status: 'upcoming',
        whiteboard_data: {
          check_in_code: '384729',
          check_in_expires_at: new Date(today.getTime() + 5 * 60 * 1000).toISOString(),
          updated_at: today.toISOString()
        }
      });
    }

    // 未来的课堂
    for (let i = 0; i < 2; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + (i + 1) * 7);
      futureDate.setHours(14, 0, 0, 0);

      sessions.push({
        id: crypto.randomUUID(),
        course_id: course.id,
        teacher_id: TEACHER_ID,
        title: `${course.title} - 第${6 + i}课`,
        scheduled_start: futureDate.toISOString(),
        scheduled_end: new Date(futureDate.getTime() + 90 * 60 * 1000).toISOString(),
        duration: 90,
        classroom: 'A-301 教室',
        max_students: 30,
        status: 'upcoming'
      });
    }
  }

  for (const session of sessions) {
    const { error } = await supabase
      .from('app_class_sessions')
      .upsert(session, { onConflict: 'id' });
    
    if (!error) {
      process.stdout.write('.');
    }
  }
  console.log(` ${sessions.length}个`);

  return sessions;
}

async function createMoreAssignments(courses) {
  const today = new Date();
  
  const assignmentTemplates = [
    { title: '项目章程编写', content: '选择一个项目编写项目章程' },
    { title: 'WBS分解练习', content: '将给定项目分解为WBS' },
    { title: '甘特图制作', content: '使用工具制作项目甘特图' },
    { title: '风险登记册', content: '识别项目风险并制定应对策略' },
    { title: '干系人分析', content: '分析项目干系人并制定管理策略' },
    { title: '成本估算练习', content: '估算项目成本并制定预算' },
    { title: '变更管理案例', content: '分析变更管理案例' },
    { title: '质量检查清单', content: '制定项目质量检查清单' },
    { title: '沟通计划', content: '制定项目沟通管理计划' },
    { title: '项目复盘报告', content: '对已完成项目进行复盘' },
    { title: '敏捷估算', content: '使用故事点进行估算' },
    { title: 'Sprint规划', content: '制定Sprint规划' },
    { title: '回顾会议总结', content: '记录回顾会议要点' },
    { title: '看板设计', content: '设计团队看板' },
    { title: 'PMP模拟题', content: '完成PMP模拟题并分析' }
  ];

  let idx = 0;
  for (const course of courses) {
    // 每门课程2-3个作业
    const numAssignments = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numAssignments; i++) {
      const template = assignmentTemplates[idx % assignmentTemplates.length];
      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 14) - 3);

      const assignment = {
        id: crypto.randomUUID(),
        course_id: course.id,
        teacher_id: TEACHER_ID,
        title: template.title,
        content: `<h3>${template.title}</h3><p>${template.content}</p>`,
        deadline: deadline.toISOString(),
        max_score: 100,
        attachments: [],
        status: 'pending',
        created_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      await supabase.from('app_assignments').upsert(assignment, { onConflict: 'id' });
      idx++;
    }
  }
  console.log(`  ✅ 创建${idx}个作业`);
}

async function createMoreSubmissions(courses) {
  // 获取所有作业
  const { data: assignments } = await supabase
    .from('app_assignments')
    .select('id, course_id');

  if (!assignments) return;

  for (const assignment of assignments) {
    // 随机选择5-15人提交
    const numSubmissions = 5 + Math.floor(Math.random() * 11);
    const shuffled = [...STUDENTS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numSubmissions; i++) {
      const submitted = Math.random() > 0.3;
      if (!submitted) continue;

      const isGraded = Math.random() > 0.4;
      const score = isGraded ? Math.floor(Math.random() * 30) + 70 : null;

      const submission = {
        id: crypto.randomUUID(),
        assignment_id: assignment.id,
        student_id: shuffled[i].id,
        content: `<p>${shuffled[i].name}的作业提交...</p>`,
        attachments: [],
        submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: isGraded ? 'graded' : 'submitted',
        score: score,
        comment: isGraded ? '作业完成较好，继续保持！' : null
      };

      await supabase.from('app_student_submissions').upsert(submission, { onConflict: 'id' });
    }
  }
  console.log(`  ✅ 创建学生提交记录`);
}

async function createMoreAttendance(sessions) {
  const completedSessions = sessions.filter(s => s.status === 'completed');

  for (const session of completedSessions) {
    // 为每个完成的课堂创建15-20人的签到记录
    const numPresent = 15 + Math.floor(Math.random() * 6);
    const shuffled = [...STUDENTS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numPresent; i++) {
      const isLate = Math.random() > 0.85;
      const checkInTime = new Date(session.scheduled_start);
      checkInTime.setMinutes(checkInTime.getMinutes() + (isLate ? 15 : 0) - Math.floor(Math.random() * 10));

      const attendance = {
        id: crypto.randomUUID(),
        session_id: session.id,
        student_id: shuffled[i].id,
        status: isLate ? 'late' : 'present',
        check_in_time: checkInTime.toISOString()
      };

      await supabase.from('app_attendance').upsert(attendance, { onConflict: 'id' });
    }

    // 添加几个缺勤记录
    for (let i = numPresent; i < numPresent + 3; i++) {
      if (i >= shuffled.length) break;
      
      const attendance = {
        id: crypto.randomUUID(),
        session_id: session.id,
        student_id: shuffled[i].id,
        status: 'absent'
      };

      await supabase.from('app_attendance').upsert(attendance, { onConflict: 'id' });
    }
  }
  console.log(`  ✅ 为${completedSessions.length}个课堂创建签到记录`);
}

async function createAnnouncements(courses) {
  const announcements = [
    { title: '课程开始通知', content: '欢迎大家参加本课程的学习！' },
    { title: '作业提交通知', content: '请各位同学按时提交作业，逾期将扣分。' },
    { title: '课程调整通知', content: '下周的课程时间调整为周三下午2点。' },
    { title: '考试安排', content: '期中考试将于下月15日举行，请做好准备。' },
    { title: '学习资料分享', content: '新的学习资料已上传到课程资源区。' }
  ];

  for (const course of courses.slice(0, 4)) {
    for (const ann of announcements) {
      await supabase.from('app_announcements').upsert({
        id: crypto.randomUUID(),
        title: `${course.title} - ${ann.title}`,
        content: ann.content,
        type: 'course',
        target_id: course.id,
        author_id: TEACHER_ID,
        status: 'published',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'id' });
    }
  }
  console.log(`  ✅ 创建课程公告`);
}

// 执行
seedRichData();
