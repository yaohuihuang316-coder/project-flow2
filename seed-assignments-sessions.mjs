/**
 * 插入教师作业和课堂考勤示例数据
 * 用法: node seed-assignments-sessions.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('🚀 开始插入示例数据...\n');

  try {
    // 1. 获取教师 ID (Manager 或 SuperAdmin 角色)
    console.log('📌 步骤 1: 获取教师用户...');
    const { data: teachers, error: teacherError } = await supabase
      .from('app_users')
      .select('id, name, role')
      .in('role', ['Manager', 'SuperAdmin', 'Editor'])
      .limit(1);

    if (teacherError || !teachers || teachers.length === 0) {
      console.error('❌ 未找到教师用户，请先创建用户');
      console.error('错误:', teacherError?.message);
      return;
    }
    const teacherId = teachers[0].id;
    console.log(`✅ 找到教师: ${teachers[0].name} (${teachers[0].role})\n`);

    // 2. 获取课程 ID
    console.log('📌 步骤 2: 获取课程...');
    const { data: courses, error: courseError } = await supabase
      .from('app_courses')
      .select('id, title')
      .limit(5);

    if (courseError || !courses || courses.length === 0) {
      console.error('❌ 未找到课程，请先创建课程');
      console.error('错误:', courseError?.message);
      return;
    }
    console.log(`✅ 找到 ${courses.length} 门课程`);
    courses.forEach((c, i) => console.log(`   ${i + 1}. ${c.title}`));
    console.log();

    // 3. 获取学生 ID
    console.log('📌 步骤 3: 获取学生...');
    const { data: students, error: studentError } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'Student')
      .limit(5);

    if (studentError || !students) {
      console.log('⚠️ 未找到学生用户:', studentError?.message);
    } else {
      console.log(`✅ 找到 ${students.length} 名学生\n`);
    }

    // 4. 插入作业数据
    console.log('📌 步骤 4: 插入作业数据...');
    const assignmentsData = [
      {
        title: '项目章程编写练习',
        content: '根据给定的项目背景资料，编写一份完整的项目章程文档。要求包含项目目的、范围、关键干系人、里程碑等内容。',
        course_id: courses[0]?.id,
        teacher_id: teacherId,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        status: 'pending',
        submitted_count: 0,
        total_count: students?.length || 0
      },
      {
        title: 'WBS分解作业',
        content: '选择一个你熟悉的项目，绘制其工作分解结构(WBS)，要求至少分解到第三层，并说明每个工作包的可交付成果。',
        course_id: courses[0]?.id,
        teacher_id: teacherId,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        status: 'grading',
        submitted_count: Math.floor(Math.random() * (students?.length || 5)),
        total_count: students?.length || 0
      },
      {
        title: '敏捷估算实践',
        content: '使用故事点法对给定的用户故事进行估算，并解释你的估算思路。要求使用计划扑克方法进行团队估算。',
        course_id: courses[1]?.id || courses[0]?.id,
        teacher_id: teacherId,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 50,
        status: 'completed',
        submitted_count: students?.length || 0,
        total_count: students?.length || 0
      },
      {
        title: 'Sprint规划模拟',
        content: '根据提供的产品待办列表，制定一个为期两周的Sprint计划。包括Sprint目标、选定的用户故事、任务分解等。',
        course_id: courses[1]?.id || courses[0]?.id,
        teacher_id: teacherId,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 80,
        status: 'pending',
        submitted_count: 0,
        total_count: students?.length || 0
      },
      {
        title: '项目风险管理计划',
        content: '为你的项目识别至少10个风险，使用风险登记册进行记录，并制定相应的应对策略。',
        course_id: courses[2]?.id || courses[0]?.id,
        teacher_id: teacherId,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 100,
        status: 'pending',
        submitted_count: 0,
        total_count: students?.length || 0
      },
      {
        title: '干系人分析表',
        content: '为你的项目识别关键干系人，并使用权力/利益矩阵进行分类，制定相应的管理策略。',
        course_id: courses[2]?.id || courses[0]?.id,
        teacher_id: teacherId,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_score: 60,
        status: 'grading',
        submitted_count: Math.floor(Math.random() * (students?.length || 5)),
        total_count: students?.length || 0
      }
    ].filter(a => a.course_id); // 过滤掉没有 course_id 的

    // 先检查是否已有数据
    const { data: existingAssignments } = await supabase
      .from('app_assignments')
      .select('id')
      .limit(1);

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('⚠️ 作业表已有数据，跳过插入作业\n');
    } else {
      const { error: assignError } = await supabase
        .from('app_assignments')
        .insert(assignmentsData);

      if (assignError) {
        console.error('❌ 插入作业失败:', assignError.message);
      } else {
        console.log(`✅ 成功插入 ${assignmentsData.length} 条作业数据\n`);
      }
    }

    // 5. 插入课堂数据
    console.log('📌 步骤 5: 插入课堂数据...');
    const sessionsData = [
      {
        course_id: courses[0]?.id,
        teacher_id: teacherId,
        title: '项目整合管理精讲',
        description: '深入讲解项目整合管理的核心概念和实践方法，包括项目章程、项目管理计划等关键文档的编制。',
        scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        location: '线上直播',
        max_students: 50,
        checkin_code: 'PM101'
      },
      {
        course_id: courses[1]?.id || courses[0]?.id,
        teacher_id: teacherId,
        title: 'Scrum框架实战演练',
        description: '通过实际案例学习Scrum框架的应用，包括Sprint规划、每日站会、评审会和回顾会。',
        scheduled_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        location: 'A101教室',
        max_students: 30,
        checkin_code: 'AG202'
      },
      {
        course_id: courses[0]?.id,
        teacher_id: teacherId,
        title: '项目范围管理专题',
        description: '学习如何定义项目范围、创建工作分解结构(WBS)以及进行范围确认和控制。',
        scheduled_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        actual_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        actual_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        location: '线上直播',
        max_students: 50,
        checkin_code: 'PM303'
      },
      {
        course_id: courses[1]?.id || courses[0]?.id,
        teacher_id: teacherId,
        title: '看板方法实践',
        description: '学习看板方法的原理和实践，包括WIP限制、流程优化等核心概念。',
        scheduled_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        actual_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ongoing',
        location: 'B202教室',
        max_students: 25,
        checkin_code: 'KB404'
      }
    ].filter(s => s.course_id);

    // 先检查是否已有数据
    const { data: existingSessions } = await supabase
      .from('app_class_sessions')
      .select('id')
      .limit(1);

    let sessionIds = [];
    if (existingSessions && existingSessions.length > 0) {
      console.log('⚠️ 课堂表已有数据，跳过插入课堂\n');
      // 获取现有课堂ID用于考勤
      const { data: existingSessionData } = await supabase
        .from('app_class_sessions')
        .select('id')
        .limit(2);
      sessionIds = existingSessionData?.map(s => s.id) || [];
    } else {
      const { data: insertedSessions, error: sessionError } = await supabase
        .from('app_class_sessions')
        .insert(sessionsData)
        .select('id');

      if (sessionError) {
        console.error('❌ 插入课堂失败:', sessionError.message);
      } else {
        console.log(`✅ 成功插入 ${sessionsData.length} 条课堂数据\n`);
        sessionIds = insertedSessions?.map(s => s.id) || [];
      }
    }

    // 6. 插入考勤数据
    if (students && students.length > 0 && sessionIds.length > 0) {
      console.log('📌 步骤 6: 插入考勤数据...');
      
      const attendanceData = [];
      sessionIds.forEach((sessionId, sessionIdx) => {
        students.forEach((student, studentIdx) => {
          const statuses = ['present', 'present', 'present', 'late', 'absent'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          attendanceData.push({
            session_id: sessionId,
            student_id: student.id,
            status: status,
            check_in_time: status !== 'absent' 
              ? new Date(Date.now() - sessionIdx * 24 * 60 * 60 * 1000 + studentIdx * 5 * 60 * 1000).toISOString()
              : null
          });
        });
      });

      // 先检查是否已有数据
      const { data: existingAttendance } = await supabase
        .from('app_attendance')
        .select('id')
        .limit(1);

      if (existingAttendance && existingAttendance.length > 0) {
        console.log('⚠️ 考勤表已有数据，跳过插入考勤\n');
      } else {
        const { error: attendError } = await supabase
          .from('app_attendance')
          .insert(attendanceData);

        if (attendError) {
          console.error('❌ 插入考勤失败:', attendError.message);
        } else {
          console.log(`✅ 成功插入 ${attendanceData.length} 条考勤数据\n`);
        }
      }
    }

    console.log('🎉 数据插入完成！');
    console.log('\n📊 插入的数据统计：');
    console.log(`   - 作业: ${assignmentsData.length} 条`);
    console.log(`   - 课堂: ${sessionsData.length} 条`);
    console.log(`   - 考勤: ${students?.length * sessionIds.length || 0} 条`);

  } catch (err) {
    console.error('❌ 执行失败:', err);
    process.exit(1);
  }
}

seedData();
