import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMoreSubmissions() {
  console.log('🚀 开始插入更多作业提交数据...\n');

  try {
    // 1. 获取现有作业
    const { data: assignments, error: assignmentsError } = await supabase
      .from('app_assignments')
      .select('id, title, teacher_id, status')
      .limit(5);

    if (assignmentsError) {
      console.error('❌ 获取作业失败:', assignmentsError.message);
      return;
    }

    console.log(`✅ 找到 ${assignments?.length || 0} 个作业`);

    // 2. 获取学生
    const { data: students, error: studentsError } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'Student')
      .limit(15);

    if (studentsError) {
      console.error('❌ 获取学生失败:', studentsError.message);
      return;
    }

    console.log(`✅ 找到 ${students?.length || 0} 个学生`);

    if (!assignments?.length || !students?.length) {
      console.log('⚠️ 没有足够的数据');
      return;
    }

    // 3. 准备多样化的提交内容
    const contents = [
      {
        text: '通过本次作业，我深入学习了项目管理中的关键路径法。我使用CPM技术分析了一个软件开发项目，识别出了关键路径为：需求分析→系统设计→编码实现→测试验收。项目的总工期预计为120天。同时我也识别出了3天的浮动时间，可以在资源调配时使用。',
        score: 85
      },
      {
        text: '本次作业完成了项目章程的编写。项目章程中明确了项目目标、范围、主要干系人、里程碑计划等内容。通过编写项目章程，我对项目的整体框架有了更清晰的认识。特别是在干系人分析部分，我识别出了5个关键干系人并制定了相应的管理策略。',
        score: 78
      },
      {
        text: '作业完成了WBS分解。我将项目分解为5个主要阶段：启动、规划、执行、监控和收尾。每个阶段又细分为具体的工作包，总共分解出25个工作包。通过WBS分解，我更好地理解了项目的整体结构和各部分的依赖关系。',
        score: 82
      },
      {
        text: '本次作业研究了敏捷开发中的Scrum框架。我详细描述了Scrum的三个角色（产品负责人、Scrum Master、开发团队）、五个事件（Sprint、Sprint计划会、每日站会、Sprint评审会、Sprint回顾会）和三个工件（产品待办列表、Sprint待办列表、产品增量）。',
        score: 88
      },
      {
        text: '完成了风险管理计划的编制。我识别出了项目中的8个主要风险，包括技术风险、进度风险、成本风险等。针对每个风险，我评估了其发生概率和影响程度，并制定了相应的应对策略。高风险项包括：核心技术难题、关键人员流失等。',
        score: 90
      },
      {
        text: '作业分析了项目沟通管理的重要性。我制定了项目沟通计划，明确了沟通对象、沟通内容、沟通频率和沟通方式。对于不同的干系人，采用了不同的沟通策略：对高层管理者采用月度汇报，对团队成员采用每日站会，对客户采用周例会。',
        score: 75
      },
      {
        text: '本次作业完成了项目成本估算。我使用了三点估算法对项目成本进行了估算，考虑了最乐观、最可能和最悲观三种情况。估算结果显示项目总成本约为150万元，其中人力成本占60%，设备成本占25%，其他成本占15%。',
        score: 80
      },
      {
        text: '研究了项目质量管理。我制定了质量管理计划，包括质量指标、质量控制流程和质量保证措施。通过建立检查表、进行同行评审和实施测试计划，确保项目交付物满足质量要求。同时建立了缺陷跟踪机制，对发现的问题进行记录和跟踪。',
        score: 86
      }
    ];

    // 4. 插入数据
    let insertedCount = 0;
    
    for (const assignment of assignments) {
      // 为每个作业随机选择 8-12 个学生提交
      const numSubmissions = Math.floor(Math.random() * 5) + 8;
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numSubmissions);

      for (let i = 0; i < shuffledStudents.length; i++) {
        const student = shuffledStudents[i];
        const contentData = contents[i % contents.length];
        const isGraded = Math.random() < 0.7; // 70% 已批改
        
        // 根据内容质量调整分数
        let score = contentData.score;
        if (Math.random() < 0.3) {
          // 30% 概率分数有波动
          score += Math.floor(Math.random() * 10) - 5;
        }
        score = Math.max(60, Math.min(100, score)); // 限制在60-100分
        
        const submissionData = {
          assignment_id: assignment.id,
          student_id: student.id,
          content: contentData.text,
          submitted_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: isGraded ? 'graded' : 'submitted',
          score: isGraded ? score : null,
        };

        const { error: insertError } = await supabase
          .from('app_assignment_submissions')
          .upsert(submissionData, {
            onConflict: 'assignment_id,student_id',
            ignoreDuplicates: true
          });

        if (insertError) {
          if (!insertError.message.includes('duplicate')) {
            console.error(`❌ 插入失败:`, insertError.message);
          }
        } else {
          insertedCount++;
          process.stdout.write(`\r✅ 已插入: ${insertedCount} 条`);
        }
      }
    }

    console.log(`\n\n✅ 总共插入: ${insertedCount} 条提交记录`);

    // 5. 更新作业统计
    console.log('\n📊 更新作业统计...');
    
    for (const assignment of assignments) {
      const { count: submittedCount } = await supabase
        .from('app_assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id);

      const { count: gradedCount } = await supabase
        .from('app_assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id)
        .eq('status', 'graded');

      await supabase
        .from('app_assignments')
        .update({
          submitted_count: submittedCount || 0,
          graded_count: gradedCount || 0,
          status: submittedCount > 0 ? 'grading' : assignment.status
        })
        .eq('id', assignment.id);
    }

    console.log('✅ 作业统计更新完成！');
    console.log('\n📈 现在可以测试AI批改功能了！');

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

insertMoreSubmissions();
