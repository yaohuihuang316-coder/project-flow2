import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ghhvdffsyvzkhbftifzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs'
);

async function main() {
  console.log('========================================');
  console.log('  创建 auth.users 用户并插入数据');
  console.log('========================================\n');

  // 1. 创建教师用户
  console.log('1. 创建教师用户到 auth.users...');
  const teachers = [
    { email: 'zhangwei@school.edu.cn', password: 'Teacher123!', name: '张伟' },
    { email: 'lina@school.edu.cn', password: 'Teacher123!', name: '李娜' },
    { email: 'wangfang@school.edu.cn', password: 'Teacher123!', name: '王芳' },
  ];

  const teacherIds = [];
  for (const t of teachers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: t.email,
      password: t.password,
      email_confirm: true,
      user_metadata: { name: t.name, role: 'Teacher' }
    });
    if (error) {
      console.log(`   ⚠ ${t.name}: ${error.message}`);
    } else {
      console.log(`   ✓ ${t.name}: ${data.user.id}`);
      teacherIds.push({ id: data.user.id, name: t.name });
    }
  }

  // 2. 创建学生用户
  console.log('\n2. 创建学生用户到 auth.users...');
  const students = [
    { email: 'student01@school.edu.cn', password: 'Student123!', name: '赵小明' },
    { email: 'student02@school.edu.cn', password: 'Student123!', name: '钱小红' },
    { email: 'student03@school.edu.cn', password: 'Student123!', name: '孙小华' },
    { email: 'student04@school.edu.cn', password: 'Student123!', name: '李小强' },
    { email: 'student05@school.edu.cn', password: 'Student123!', name: '周小丽' },
  ];

  const studentIds = [];
  for (const s of students) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: s.email,
      password: s.password,
      email_confirm: true,
      user_metadata: { name: s.name, role: 'Student' }
    });
    if (error) {
      console.log(`   ⚠ ${s.name}: ${error.message}`);
    } else {
      console.log(`   ✓ ${s.name}: ${data.user.id}`);
      studentIds.push({ id: data.user.id, name: s.name });
    }
  }

  if (teacherIds.length === 0) {
    console.log('\n无法创建用户，停止插入数据');
    return;
  }

  // 3. 获取课程ID
  console.log('\n3. 获取课程ID...');
  const { data: courses } = await supabase.from('app_courses').select('id, title').limit(5);
  console.log('课程:', courses?.map(c => ({ id: c.id, title: c.title.slice(0, 20) })));
  const courseIds = courses?.map(c => c.id) || [];

  // 4. 插入作业数据
  console.log('\n4. 插入作业数据...');
  const assignments = [
    {
      id: crypto.randomUUID(),
      title: '项目计划书撰写',
      content: '撰写一份完整的项目计划书',
      course_id: courseIds[0],
      teacher_id: teacherIds[0]?.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      status: 'pending',
      total_count: 5,
    },
    {
      id: crypto.randomUUID(),
      title: '敏捷看板设计',
      content: '设计一个敏捷开发团队的看板',
      course_id: courseIds[1],
      teacher_id: teacherIds[1]?.id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      status: 'pending',
      total_count: 5,
    },
    {
      id: crypto.randomUUID(),
      title: 'WBS分解练习',
      content: '对一个软件项目进行WBS分解',
      course_id: courseIds[2],
      teacher_id: teacherIds[2]?.id,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100,
      status: 'grading',
      total_count: 5,
    },
  ].filter(a => a.course_id && a.teacher_id);

  const { error: aError } = await supabase.from('app_assignments').insert(assignments);
  if (aError) {
    console.log('   ⚠ 作业插入错误:', aError.message);
  } else {
    console.log(`   ✓ 插入 ${assignments.length} 个作业`);
  }

  // 5. 插入课堂会话
  console.log('\n5. 插入课堂会话...');
  const sessions = [
    {
      id: crypto.randomUUID(),
      course_id: courseIds[0],
      teacher_id: teacherIds[0]?.id,
      title: '项目管理基础 - 第1讲',
      scheduled_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      max_students: 30,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseIds[1],
      teacher_id: teacherIds[1]?.id,
      title: '敏捷开发实践 - 第1讲',
      scheduled_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      max_students: 25,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseIds[0],
      teacher_id: teacherIds[0]?.id,
      title: '项目管理基础 - 第2讲',
      scheduled_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
      status: 'upcoming',
      max_students: 30,
    },
  ].filter(s => s.course_id && s.teacher_id);

  const { data: insertedSessions, error: sError } = await supabase.from('app_class_sessions').insert(sessions).select();
  if (sError) {
    console.log('   ⚠ 课堂插入错误:', sError.message);
  } else {
    console.log(`   ✓ 插入 ${sessions.length} 个课堂会话`);

    // 6. 插入考勤数据
    if (insertedSessions && insertedSessions.length > 0 && studentIds.length > 0) {
      console.log('\n6. 插入考勤数据...');
      const attendanceRecords = [];
      
      for (const session of insertedSessions.slice(0, 2)) {
        for (let i = 0; i < studentIds.length; i++) {
          attendanceRecords.push({
            session_id: session.id,
            student_id: studentIds[i].id,
            status: i < 4 ? 'present' : (i < 5 ? 'late' : 'absent'),
            check_in_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + Math.random() * 30 * 60 * 1000).toISOString(),
          });
        }
      }

      const { error: atError } = await supabase.from('app_attendance').insert(attendanceRecords);
      if (atError) {
        console.log('   ⚠ 考勤插入错误:', atError.message);
      } else {
        console.log(`   ✓ 插入 ${attendanceRecords.length} 条考勤记录`);
      }
    }
  }

  console.log('\n========================================');
  console.log('  ✅ 完成！');
  console.log('========================================');
}

main();
