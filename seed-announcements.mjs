import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTI2NDQsImV4cCI6MjA4MjU4ODY0NH0.xVb2gaNftckCN-gbA19iwHc0S0OD1XAc0Hf22LNBAvE';

const supabase = createClient(supabaseUrl, supabaseKey);

const announcements = [
  // 系统公告
  {
    title: '🎉 欢迎使用 ProjectFlow 项目管理学习平台！',
    content: `亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：
• 学习专业的项目管理课程
• 使用强大的项目管理工具
• 参与社区讨论与经验分享
• 体验实战模拟场景

祝您学习愉快，技能精进！如有任何问题，请联系客服团队。`,
    type: 'success',
    priority: 10,
    target_audience: 'all',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: '📢 系统功能更新：全新仪表盘上线',
    content: `我们很高兴地宣布，全新的个人仪表盘功能已正式上线！

本次更新内容包括：
• 个性化学习进度展示
• 项目完成度可视化图表
• 快捷操作入口优化
• 学习数据深度分析

点击右上角头像进入「个人中心」即可体验。`,
    type: 'info',
    priority: 8,
    target_audience: 'all',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: '🔔 重要通知：系统维护公告',
    content: `尊敬的用户：

我们将于本周日凌晨 2:00-4:00 进行系统维护升级，期间部分功能可能无法使用。

维护内容：
• 数据库性能优化
• 安全补丁更新
• 新功能预发布

给您带来的不便，敬请谅解。`,
    type: 'warning',
    priority: 9,
    target_audience: 'all',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 课程公告
  {
    title: '📚 PMP 认证新课程已上线，快来学习吧！',
    content: `备受期待的《PMP 认证完整指南》课程现已正式上线！

课程亮点：
• 35小时专业PDU学时
• 覆盖全部考试知识领域
• 配套练习题库1000+
• 资深PMP讲师在线答疑

会员用户可免费学习全部内容！`,
    type: 'success',
    priority: 9,
    target_audience: 'students',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: '🚀 敏捷项目管理实战课程更新通知',
    content: `《敏捷项目管理实战》课程已完成内容升级！

更新内容：
• 新增Scrum框架深度解析章节
• 增加5个真实企业案例
• 补充看板(Kanban)实战演练
• 新增DevOps与敏捷结合模块

已报名的学员可直接免费学习更新内容。`,
    type: 'info',
    priority: 7,
    target_audience: 'students',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: '👨‍🏫 教师专属：课程创作工具升级',
    content: `各位讲师，课程创作工作台已进行全面升级！

新功能包括：
• 富文本编辑器增强，支持更多格式
• 视频章节自动分割功能
• 作业批改批量处理
• 学员学习数据导出

登录讲师后台即可体验新功能。`,
    type: 'info',
    priority: 6,
    target_audience: 'teachers',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 活动公告
  {
    title: '🎬 【直播预告】项目管理大咖分享会 - 第3期',
    content: `直播主题：《从初级PM到项目总监的成长之路》

直播时间：本周六晚 20:00-21:30

分享嘉宾：李明 - 某互联网大厂项目总监，15年项目管理经验

内容大纲：
• 项目管理职业发展路径
• 关键能力跃升技巧
• 面试与晋升经验分享
• 互动答疑环节

点击预约直播！`,
    type: 'warning',
    priority: 9,
    target_audience: 'all',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: '🏆 「30天项目管理挑战赛」开始报名！',
    content: `想要快速提升项目管理实战能力？加入我们的30天挑战赛！

活动形式：
• 每日学习任务打卡
• 真实项目案例分析
• 团队协作模拟练习
• 导师点评与指导

活动时间：下月1日-30日
报名截止：本月28日

完成挑战可获得：
✓ 官方认证证书
✓ 精美周边礼品
✓ Pro会员体验月卡

名额有限，立即报名！`,
    type: 'success',
    priority: 8,
    target_audience: 'students',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 会员专属
  {
    title: '💎 Pro会员专享：高级课程包已解锁',
    content: `尊敬的 Pro 会员：

您现在可以学习以下高级课程：
• 项目管理办公室(PMO)建设
• 项目组合管理(PfM)实战
• 敏捷规模化(SAFe)框架
• 项目风险管理高级技巧

感谢您对 ProjectFlow 的支持！`,
    type: 'success',
    priority: 7,
    target_audience: 'pro',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

async function seedAnnouncements() {
  console.log('🚀 开始插入公告数据...');
  
  try {
    // 先清空现有数据
    console.log('🧹 清空现有公告数据...');
    const { error: deleteError } = await supabase
      .from('app_announcements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('清空数据失败:', deleteError);
    } else {
      console.log('✅ 已清空现有数据');
    }

    // 插入新数据
    console.log('📥 插入新公告数据...');
    const { data, error } = await supabase
      .from('app_announcements')
      .insert(announcements)
      .select();

    if (error) {
      console.error('❌ 插入数据失败:', error);
      process.exit(1);
    }

    console.log(`✅ 成功插入 ${data.length} 条公告数据`);
    
    // 验证数据
    const { data: verifyData, error: verifyError } = await supabase
      .from('app_announcements')
      .select('id, title, type');
    
    if (verifyError) {
      console.error('验证数据失败:', verifyError);
    } else {
      console.log('\n📋 已插入的公告列表:');
      verifyData.forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.type}] ${a.title.substring(0, 40)}...`);
      });
    }

  } catch (err) {
    console.error('❌ 发生错误:', err);
    process.exit(1);
  }
}

seedAnnouncements();
