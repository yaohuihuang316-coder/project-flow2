/**
 * 修复课程报名数据
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('错误: 需要提供 SUPABASE_SERVICE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TEACHER_ID = '340f28b9-8557-4e6f-adbf-e2abb1543ec2';

async function fixEnrollments() {
  console.log('🔄 修复报名数据...\n');
  
  // 1. 获取教师的所有课程
  const { data: courses, error: cErr } = await supabase
    .from('app_courses')
    .select('id, title')
    .eq('author', TEACHER_ID);
  
  if (cErr || !courses) {
    console.log('❌ 获取课程失败:', cErr?.message);
    return;
  }
  
  console.log('📚 找到课程:', courses.length, '门\n');
  
  // 2. 获取所有学生
  const { data: students, error: sErr } = await supabase
    .from('app_users')
    .select('id, name, email')
    .eq('role', 'Student');
  
  if (sErr || !students || students.length === 0) {
    console.log('❌ 获取学生失败:', sErr?.message);
    return;
  }
  
  console.log('👨‍🎓 找到学生:', students.length, '人\n');
  
  // 3. 为每门课程创建报名记录
  let totalEnrollments = 0;
  
  for (const course of courses) {
    // 每门课程随机12-18人报名
    const numEnrollments = 12 + Math.floor(Math.random() * 7);
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numEnrollments; i++) {
      const student = shuffled[i];
      const progress = Math.floor(Math.random() * 80) + 10;
      
      const { error } = await supabase
        .from('app_user_progress')
        .upsert({
          user_id: student.id,
          course_id: course.id,
          progress: progress,
          completed_chapters: ['intro', 'ch1', 'ch2'].slice(0, Math.floor(Math.random() * 3) + 1),
          last_accessed: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: progress > 90 ? 'Completed' : 'Started'
        }, { onConflict: 'user_id,course_id' });
      
      if (error) {
        console.log('  ⚠️ 插入失败:', error.message);
      } else {
        totalEnrollments++;
      }
    }
    console.log(`  ✅ ${course.title}: ${numEnrollments}人报名`);
  }
  
  console.log(`\n🎉 修复完成！共创建 ${totalEnrollments} 条报名记录`);
}

fixEnrollments().catch(console.error);
