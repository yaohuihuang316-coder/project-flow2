import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ghhvdffsyvzkhbftifzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs'
);

const TEACHER_IDS = [
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005',
];

const STUDENT_IDS = [
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000006',
  '20000000-0000-0000-0000-000000000007',
  '20000000-0000-0000-0000-000000000008',
  '20000000-0000-0000-0000-000000000009',
  '20000000-0000-0000-0000-000000000010',
];

const COURSE_IDS = [
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000005',
];

const ASSIGNMENT_IDS = [
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000004',
  '40000000-0000-0000-0000-000000000005',
];

const SESSION_IDS = [
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-000000000005',
];

async function main() {
  console.log('========================================');
  console.log('  插入作业和考勤数据');
  console.log('========================================\n');

  try {
    // 1. 插入作业数据
    console.log('1. 插入作业数据到 app_assignments...');
    const assignments = [
      {
        id: ASSIGNMENT_IDS[0],
        title: '项目计划书撰写',
        content: '根据所学知识，撰写一份完整的项目计划书，包括项目背景、目标、WBS、进度计划等内容。',
        course_id: COURSE_IDS[0],
        teacher_id: TEACHER_IDS[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        status: 'pending',
        total_count: 8,
      },
      {
        id: ASSIGNMENT_IDS[1],
        title: '敏捷看板设计',
        content: '设计一个敏捷开发团队的看板，说明各个列的含义和使用规则。',
        course_id: COURSE_IDS[1],
        teacher_id: TEACHER_IDS[1],
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        status: 'pending',
        total_count: 7,
      },
      {
        id: ASSIGNMENT_IDS[2],
        title: 'WBS分解练习',
        content: '对一个软件项目进行WBS分解，至少分解到第三层。',
        course_id: COURSE_IDS[2],
        teacher_id: TEACHER_IDS[2],
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        status: 'grading',
        total_count: 9,
      },
      {
        id: ASSIGNMENT_IDS[3],
        title: '风险识别报告',
        content: '识别项目中的潜在风险并制定应对策略。',
        course_id: COURSE_IDS[3],
        teacher_id: TEACHER_IDS[0],
        deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        status: 'completed',
        total_count: 10,
      },
      {
        id: ASSIGNMENT_IDS[4],
        title: '团队沟通案例分析',
        content: '分析一个团队沟通失败的案例，提出改进建议。',
        course_id: COURSE_IDS[0],
        teacher_id: TEACHER_IDS[0],
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 50,
        status: 'pending',
        total_count: 8,
      },
    ];

    const { error: assignmentError } = await supabase
      .from('app_assignments')
      .upsert(assignments, { onConflict: 'id' });
    
    if (assignmentError) {
      console.log('   ⚠ 作业插入错误:', assignmentError.message);
    } else {
      console.log(`   ✓ 插入 ${assignments.length} 个作业\n`);
    }

    // 2. 插入课堂会话数据
    console.log('2. 插入课堂会话数据到 app_class_sessions...');
    const sessions = [
      {
        id: SESSION_IDS[0],
        course_id: COURSE_IDS[0],
        teacher_id: TEACHER_IDS[0],
        title: '项目管理基础 - 第1讲',
        description: '介绍项目管理的基本概念和五大过程组',
        scheduled_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        actual_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
        actual_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        max_students: 30,
        checkin_code: 'PM001',
        attendance_count: 28,
      },
      {
        id: SESSION_IDS[1],
        course_id: COURSE_IDS[1],
        teacher_id: TEACHER_IDS[1],
        title: '敏捷开发实践 - 第1讲',
        description: 'Scrum框架介绍和敏捷宣言解读',
        scheduled_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
        actual_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
        actual_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        max_students: 25,
        checkin_code: 'AG001',
        attendance_count: 22,
      },
      {
        id: SESSION_IDS[2],
        course_id: COURSE_IDS[2],
        teacher_id: TEACHER_IDS[2],
        title: 'WBS工作分解 - 第1讲',
        description: '工作分解结构的创建方法和最佳实践',
        scheduled_start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        max_students: 20,
        checkin_code: 'WBS01',
      },
      {
        id: SESSION_IDS[3],
        course_id: COURSE_IDS[0],
        teacher_id: TEACHER_IDS[0],
        title: '项目管理基础 - 第2讲',
        description: '十大知识领域详解',
        scheduled_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        max_students: 30,
        checkin_code: 'PM002',
      },
      {
        id: SESSION_IDS[4],
        course_id: COURSE_IDS[3],
        teacher_id: TEACHER_IDS[0],
        title: '风险管理 - 第1讲',
        description: '风险识别与评估方法',
        scheduled_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        max_students: 25,
        checkin_code: 'RSK01',
      },
    ];

    const { error: sessionError } = await supabase
      .from('app_class_sessions')
      .upsert(sessions, { onConflict: 'id' });
    
    if (sessionError) {
      console.log('   ⚠ 课堂插入错误:', sessionError.message);
    } else {
      console.log(`   ✓ 插入 ${sessions.length} 个课堂会话\n`);
    }

    // 3. 插入考勤数据
    console.log('3. 插入考勤数据到 app_attendance...');
    const attendanceRecords = [];
    
    // 为第一个已完成的课堂添加考勤记录
    for (let i = 0; i < STUDENT_IDS.length; i++) {
      attendanceRecords.push({
        session_id: SESSION_IDS[0],
        student_id: STUDENT_IDS[i],
        status: i < 8 ? 'present' : (i < 9 ? 'late' : 'absent'),
        check_in_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + Math.random() * 30 * 60 * 1000).toISOString(),
      });
    }
    
    // 为第二个已完成的课堂添加考勤记录
    for (let i = 0; i < STUDENT_IDS.length - 2; i++) {
      attendanceRecords.push({
        session_id: SESSION_IDS[1],
        student_id: STUDENT_IDS[i],
        status: i < 7 ? 'present' : (i < 8 ? 'late' : 'absent'),
        check_in_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + Math.random() * 25 * 60 * 1000).toISOString(),
      });
    }

    const { error: attendanceError } = await supabase
      .from('app_attendance')
      .upsert(attendanceRecords, { onConflict: 'session_id,student_id' });
    
    if (attendanceError) {
      console.log('   ⚠ 考勤插入错误:', attendanceError.message);
    } else {
      console.log(`   ✓ 插入 ${attendanceRecords.length} 条考勤记录\n`);
    }

    console.log('========================================');
    console.log('  ✅ 数据插入完成！');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

main();
