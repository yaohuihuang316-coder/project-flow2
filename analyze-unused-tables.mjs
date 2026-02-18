// 数据库中所有的表（从 Supabase 获取的）
const allTablesInDB = [
  'app_achievements', 'app_activity_logs', 'app_admin_logs', 'app_admins', 'app_ai_usage',
  'app_announcement_reads', 'app_announcements', 'app_assignments', 'app_attendance', 'app_banners',
  'app_case_history', 'app_case_questions', 'app_case_studies', 'app_class_events', 'app_class_questions',
  'app_class_sessions', 'app_class_stats', 'app_comments', 'app_community_posts', 'app_course_enrollments',
  'app_course_feedback', 'app_courses', 'app_cpm_projects', 'app_discussion_replies', 'app_discussions',
  'app_events', 'app_kanban_tasks', 'app_kb_edges', 'app_kb_edges_v2', 'app_kb_nodes',
  'app_kb_nodes_v2', 'app_learning_activities', 'app_learning_activity', 'app_learning_paths',
  'app_membership_plans', 'app_messages', 'app_notification_settings', 'app_notifications', 'app_okrs',
  'app_poll_votes', 'app_polls', 'app_post_topics', 'app_question_replies', 'app_questions',
  'app_recordings', 'app_reports', 'app_retros', 'app_simulation_progress', 'app_simulation_scenarios',
  'app_story_estimates', 'app_student_risk_alerts', 'app_student_submissions', 'app_system_configs',
  'app_teacher_announcements', 'app_teacher_courses', 'app_teacher_notes', 'app_teacher_verifications',
  'app_teaching_stats_daily', 'app_tools', 'app_topics', 'app_user_achievements', 'app_user_announcement_reads',
  'app_user_badges', 'app_user_follows', 'app_user_kb_mastery', 'app_user_knowledge_mastery',
  'app_user_likes', 'app_user_progress', 'app_user_skills', 'app_users', 'app_wbs_templates',
  'lab_ccpm_schedules', 'lab_evm_predictions', 'lab_fishbone_diagrams', 'lab_fmea_analyses',
  'lab_kanban_flow_data', 'lab_learning_curve_models', 'lab_monte_carlo_simulations', 'lab_okr_key_results',
  'lab_okr_objectives', 'lab_okr_periods', 'lab_planning_poker_sessions', 'lab_quality_cost_models',
  'lab_retro_boards', 'lab_retro_notes', 'lab_velocity_trackers', 'lab_wbs_nodes', 'lab_wbs_trees',
  'membership_codes', 'membership_subscriptions', 'payment_orders', 'user_course_stats',
  'v_assignment_stats', 'v_knowledge_graph', 'v_learnable_nodes', 'v_student_submission_details',
  'view_teacher_access'
];

// 代码中实际使用的表（从 Grep 搜索结果整理的）
const usedTables = [
  // 用户相关
  'app_users', 'app_user_progress', 'app_user_skills', 'app_user_achievements', 
  'app_user_kb_mastery', 'app_user_follows', 'app_user_likes', 'app_user_announcement_reads',
  'app_achievements', 'app_learning_activity', 'app_activity_logs',
  
  // 课程相关
  'app_courses', 'app_course_enrollments', 'app_course_feedback', 'app_teacher_courses',
  'user_course_stats',
  
  // 社区与互动
  'app_community_posts', 'app_comments', 'app_topics', 'app_post_topics',
  'app_class_questions', // 注意：使用了 app_class_questions 而不是 app_questions
  'app_question_replies', // 使用了回复表但可能没使用问题表
  'app_messages',
  
  // 通知与公告
  'app_announcements', 'app_user_announcement_reads', 'app_banners',
  'app_teacher_announcements', 'app_announcement_reads',
  'app_reports',
  
  // 课堂功能
  'app_class_sessions', 'app_attendance', 'app_assignments', 'app_student_submissions',
  'app_learning_activities',
  
  // 知识库与模拟
  'app_kb_nodes', 'app_kb_edges', 'app_kb_nodes_v2', 'app_kb_edges_v2',
  'app_cpm_projects', 'app_simulation_scenarios', 'app_simulation_progress',
  'app_tools',
  
  // 实验工具
  'lab_monte_carlo_simulations', 'lab_planning_poker_sessions', 'lab_kanban_flow_data',
  'lab_learning_curve_models', 'lab_evm_predictions', 'lab_quality_cost_models',
  'lab_ccpm_schedules', 'lab_fishbone_diagrams', 'lab_wbs_trees', 'lab_wbs_nodes',
  'lab_retro_boards', 'lab_retro_notes', 'lab_okr_periods', 'lab_okr_objectives', 'lab_okr_key_results',
  
  // 会员/支付
  'app_membership_plans', 'membership_codes', 'membership_subscriptions', 'payment_orders',
  'app_ai_usage',
  
  // 教师相关
  'app_teacher_verifications', 'app_admins', 'app_admin_logs',
  
  // 事件
  'app_events',
  
  // 视图
  'view_teacher_access'
];

// 找出未使用的表
const unusedTables = allTablesInDB.filter(table => !usedTables.includes(table));

// 分类整理
console.log('\n' + '='.repeat(70));
console.log('📊 数据库表使用情况分析');
console.log('='.repeat(70));

console.log(`\n✅ 已使用的表: ${usedTables.length} 个`);
console.log(`❌ 未使用的表: ${unusedTables.length} 个`);
console.log(`📊 总计: ${allTablesInDB.length} 个`);

console.log('\n' + '='.repeat(70));
console.log('❌ 未在代码中使用的表（可以考虑删除）');
console.log('='.repeat(70));

// 按类别分组
const categories = {
  '社区互动类': ['app_questions', 'app_discussions', 'app_discussion_replies'],
  '课堂功能类': ['app_polls', 'app_poll_votes', 'app_class_stats', 'app_class_events', 'app_recordings', 'app_teaching_stats_daily', 'app_teacher_notes', 'app_student_risk_alerts'],
  '通知消息类': ['app_notifications', 'app_notification_settings'],
  '用户相关类': ['app_user_badges', 'app_user_knowledge_mastery'],
  '知识库类': ['app_learning_paths', 'app_wbs_templates', 'app_system_configs'],
  'OKR/敏捷类': ['app_okrs', 'app_retros', 'app_story_estimates', 'app_kanban_tasks'],
  '案例学习类': ['app_case_studies', 'app_case_questions', 'app_case_history'],
  '实验工具类': ['lab_fmea_analyses', 'lab_velocity_trackers'],
  '视图类': ['v_assignment_stats', 'v_knowledge_graph', 'v_learnable_nodes', 'v_student_submission_details']
};

let totalUnused = 0;
for (const [category, tables] of Object.entries(categories)) {
  const categoryUnused = tables.filter(t => unusedTables.includes(t));
  if (categoryUnused.length > 0) {
    console.log(`\n📁 ${category}:`);
    categoryUnused.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table}`);
      totalUnused++;
    });
  }
}

// 其他未分类的
const otherUnused = unusedTables.filter(t => !Object.values(categories).flat().includes(t));
if (otherUnused.length > 0) {
  console.log(`\n📁 其他未分类:`);
  otherUnused.forEach((table, i) => {
    console.log(`   ${i + 1}. ${table}`);
  });
}

console.log('\n' + '='.repeat(70));
console.log('⚠️ 重要提醒');
console.log('='.repeat(70));
console.log(`
1. 部分表虽然代码中没有直接引用，但可能通过外键关联或计划使用
2. 建议删除前先备份数据
3. 视图(v_*) 可以考虑保留，它们不影响性能
4. 以下是建议优先删除的表（确认无用后）:
`);

const priorityDelete = unusedTables.filter(t => !t.startsWith('v_') && !t.startsWith('view_'));
priorityDelete.forEach((table, i) => {
  console.log(`   ${i + 1}. ${table}`);
});

console.log('\n');
