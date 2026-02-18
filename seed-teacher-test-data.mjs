/**
 * 教师端测试数据种子脚本
 * 为教师端创建课程、课堂会话、作业等测试数据
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('错误: 需要提供 SUPABASE_SERVICE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 测试教师用户ID（需要已存在的教师用户）
const TEACHER_ID = process.env.TEACHER_ID || 'teacher_001';

// 测试学生用户IDs
const STUDENT_IDS = [
  'student_001',
  'student_002', 
  'student_003',
  'student_004',
  'student_005'
];

async function seedData() {
  console.log('🚀 开始插入教师端测试数据...\n');

  try {
    // 1. 创建测试课程
    console.log('📚 创建测试课程...');
    const courses = [
      {
        id: 'course_test_001',
        teacher_id: TEACHER_ID,
        title: '敏捷项目管理实战',
        description: '学习敏捷开发方法论，掌握Scrum和Kanban框架的实际应用',
        category: 'Advanced',
        total_hours: 24,
        status: 'published',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
        student_count: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 'course_test_002',
        teacher_id: TEACHER_ID,
        title: '项目管理基础入门',
        description: '从零开始学习项目管理基础知识，掌握PMBOK核心概念',
        category: 'Foundation',
        total_hours: 16,
        status: 'published',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
        student_count: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 'course_test_003',
        teacher_id: TEACHER_ID,
        title: '风险管理专题',
        description: '深入学习项目风险识别、评估和应对策略',
        category: 'Advanced',
        total_hours: 12,
        status: 'published',
        image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800',
        student_count: 5,
        created_at: new Date().toISOString()
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

    // 2. 创建学生报名记录
    console.log('\n👥 创建学生报名记录...');
    for (const course of courses) {
      for (const studentId of STUDENT_IDS) {
        const enrollment = {
          id: `enroll_${course.id}_${studentId}`,
          course_id: course.id,
          student_id: studentId,
          teacher_id: TEACHER_ID,
          status: 'active',
          enrolled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          progress: Math.floor(Math.random() * 60) + 20 // 20-80% 进度
        };

        const { error } = await supabase
          .from('app_course_enrollments')
          .upsert(enrollment, { onConflict: 'id' });

        if (error && !error.message.includes('duplicate')) {
          console.error(`  ❌ 报名失败: ${studentId} -> ${course.title}`);
        }
      }
      console.log(`  ✅ ${course.title}: ${STUDENT_IDS.length} 名学生`);
    }

    // 3. 创建课堂会话（今天和未来几天）
    console.log('\n📅 创建课堂会话...');
    const sessions = [];
    const today = new Date();
    
    // 今天的课程（进行中）
    sessions.push({
      id: 'session_today_001',
      course_id: 'course_test_001',
      teacher_id: TEACHER_ID,
      title: '敏捷项目管理实战 - 第5课',
      scheduled_start: new Date(today.getTime() - 30 * 60 * 1000).toISOString(), // 30分钟前开始
      duration: 90,
      classroom: 'A-301 教室',
      max_students: 30,
      status: 'in_progress',
      started_at: new Date(today.getTime() - 30 * 60 * 1000).toISOString()
    });

    // 明天的课程
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    sessions.push({
      id: 'session_tomorrow_001',
      course_id: 'course_test_002',
      teacher_id: TEACHER_ID,
      title: '项目管理基础 - 第3课',
      scheduled_start: tomorrow.toISOString(),
      duration: 45,
      classroom: '线上课堂',
      max_students: 50,
      status: 'scheduled'
    });

    // 后天的课程
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(10, 0, 0, 0);
    sessions.push({
      id: 'session_dayafter_001',
      course_id: 'course_test_003',
      teacher_id: TEACHER_ID,
      title: '风险管理 - 第1课',
      scheduled_start: dayAfterTomorrow.toISOString(),
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

    // 4. 创建作业
    console.log('\n📝 创建作业...');
    const assignments = [
      {
        id: 'assignment_001',
        course_id: 'course_test_001',
        title: '敏捷估算实践作业',
        content: '<h3>作业要求</h3><p>请根据提供的用户故事列表，使用<strong>故事点估算</strong>方法进行估算。</p><ul><li>阅读用户故事文档</li><li>使用Planning Poker方法</li><li>记录估算过程和结果</li><li>提交估算报告</li></ul>',
        deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        attachments: [],
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'assignment_002',
        course_id: 'course_test_001',
        title: 'Sprint规划案例分析',
        content: '<h3>作业要求</h3><p>分析给定的Sprint规划案例，回答以下问题：</p><ol><li>Sprint目标是否清晰？</li><li>任务拆分是否合理？</li><li>如何改进规划过程？</li></ol>',
        deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        attachments: ['https://example.com/case-study.pdf'],
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'assignment_003',
        course_id: 'course_test_002',
        title: '项目章程编写',
        content: '<p>请选择一个你熟悉的项目，编写一份完整的<strong>项目章程</strong>。</p><p>项目章程应包括：项目背景、目标、范围、干系人、里程碑等内容。</p>',
        deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        attachments: [],
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'assignment_004',
        course_id: 'course_test_001',
        title: '回顾会议总结',
        content: '<p>参加今天的回顾会议后，请完成以下任务：</p><ul><li>记录3个做得好的方面</li><li>记录3个需要改进的方面</li><li>提出1个改进行动计划</li></ul>',
        deadline: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 已过期
        max_score: 50,
        attachments: [],
        status: 'pending',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
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

    // 5. 创建一些已提交的作业记录
    console.log('\n📤 创建学生提交记录...');
    const submissions = [
      {
        id: 'submission_001',
        assignment_id: 'assignment_004',
        student_id: STUDENT_IDS[0],
        content: '<p>这是我的回顾会议总结...</p><ol><li>团队协作很好</li><li>沟通及时</li><li>任务完成质量高</li></ol>',
        attachments: [],
        submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'graded',
        score: 45,
        comment: '总结很全面，但可以更深入分析问题的根本原因。',
        graded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'submission_002',
        assignment_id: 'assignment_004',
        student_id: STUDENT_IDS[1],
        content: '<p>回顾会议收获很大...</p>',
        attachments: [],
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'graded',
        score: 48,
        comment: '做得很好！',
        graded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'submission_003',
        assignment_id: 'assignment_002',
        student_id: STUDENT_IDS[0],
        content: '<p>Sprint规划案例分析...</p>',
        attachments: ['https://example.com/analysis.pdf'],
        submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'submitted'
      }
    ];

    for (const submission of submissions) {
      const { error } = await supabase
        .from('app_student_submissions')
        .upsert(submission, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ 创建提交失败:`, error.message);
      } else {
        console.log(`  ✅ 学生提交: ${submission.id}`);
      }
    }

    // 6. 创建一些签到记录
    console.log('\n✅ 创建签到记录...');
    const attendanceRecords = [
      {
        id: 'attend_001',
        session_id: 'session_today_001',
        student_id: STUDENT_IDS[0],
        status: 'present',
        checked_in_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        check_in_method: 'code'
      },
      {
        id: 'attend_002',
        session_id: 'session_today_001',
        student_id: STUDENT_IDS[1],
        status: 'present',
        checked_in_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
        check_in_method: 'code'
      },
      {
        id: 'attend_003',
        session_id: 'session_today_001',
        student_id: STUDENT_IDS[2],
        status: 'late',
        checked_in_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        check_in_method: 'code'
      }
    ];

    for (const record of attendanceRecords) {
      const { error } = await supabase
        .from('app_attendance')
        .upsert(record, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ 创建签到失败:`, error.message);
      } else {
        console.log(`  ✅ 签到: ${record.student_id} - ${record.status}`);
      }
    }

    console.log('\n✨ 测试数据插入完成！');
    console.log('\n📊 数据摘要：');
    console.log(`  - 课程: ${courses.length} 门`);
    console.log(`  - 学生: ${STUDENT_IDS.length} 人`);
    console.log(`  - 课堂会话: ${sessions.length} 个`);
    console.log(`  - 作业: ${assignments.length} 个`);
    console.log(`  - 提交记录: ${submissions.length} 条`);
    console.log(`  - 签到记录: ${attendanceRecords.length} 条`);

  } catch (error) {
    console.error('\n❌ 数据插入失败:', error);
    process.exit(1);
  }
}

// 执行种子脚本
seedData();
