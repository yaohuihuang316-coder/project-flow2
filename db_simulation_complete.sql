-- ==========================================
-- 10个完整模拟场景（使用jsonb_build_object避免引号问题）
-- ==========================================

-- 场景1: 项目危机处理
INSERT INTO app_simulation_scenarios (title, description, difficulty, category, cover_image, stages, learning_objectives, estimated_time, is_published)
VALUES (
    '项目危机处理：核心成员离职',
    '项目关键时期，核心技术负责人突然离职，项目面临延期风险。作为项目经理，你需要迅速做出决策。',
    'Hard',
    'Crisis Management',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    jsonb_build_array(
        jsonb_build_object(
            'id', 'stage-1',
            'title', '紧急评估',
            'description', '核心开发工程师突然提出离职，他负责关键模块开发，预计30天后离职。当前项目进度60%，按计划2个月后交付。',
            'context', '该工程师掌握关键业务逻辑，交接时间有限',
            'decisions', jsonb_build_array(
                jsonb_build_object('id', 'd1-1', 'text', '立即启动紧急招聘', 'description', '全力寻找替代人员', 'impact', jsonb_build_object('score', 10, 'resources', jsonb_build_object('budget', -20, 'time', -5), 'feedback', '招聘周期长，可能无法及时弥补')),
                jsonb_build_object('id', 'd1-2', 'text', '内部人员调配支援', 'description', '从其他项目抽调人手', 'impact', jsonb_build_object('score', 20, 'resources', jsonb_build_object('budget', -5, 'morale', -10), 'feedback', '快速响应，但可能影响其他项目', 'is_optimal', true)),
                jsonb_build_object('id', 'd1-3', 'text', '外包关键模块', 'description', '将关键模块外包给供应商', 'impact', jsonb_build_object('score', 15, 'resources', jsonb_build_object('budget', -15), 'feedback', '快速但成本较高，质量风险需要把控'))
            )
        ),
        jsonb_build_object(
            'id', 'stage-2',
            'title', '知识转移',
            'description', '离职员工开始交接，但时间紧迫，需要最大化知识转移效率。',
            'context', '只剩3周交接时间，关键知识需要完整传递',
            'decisions', jsonb_build_array(
                jsonb_build_object('id', 'd2-1', 'text', '全面文档化', 'description', '要求详细编写所有文档', 'impact', jsonb_build_object('score', 15, 'resources', jsonb_build_object('time', -3), 'feedback', '文档完整但耗时')),
                jsonb_build_object('id', 'd2-2', 'text', '结对编程交接', 'description', '安排接手人员结对工作', 'impact', jsonb_build_object('score', 25, 'resources', jsonb_build_object('budget', -10), 'feedback', '最有效但成本最高', 'is_optimal', true)),
                jsonb_build_object('id', 'd2-3', 'text', '录制视频教程', 'description', '录制关键操作视频', 'impact', jsonb_build_object('score', 12, 'resources', jsonb_build_object('time', -2), 'feedback', '便于回顾但不够深入'))
            )
        ),
        jsonb_build_object(
            'id', 'stage-3',
            'title', '进度压缩',
            'description', '为弥补人员变动损失，需要对剩余工作进行进度压缩。',
            'context', '客户不接受延期，必须在原日期交付',
            'decisions', jsonb_build_array(
                jsonb_build_object('id', 'd3-1', 'text', '快速跟进并行化', 'description', '将串行任务改为并行', 'impact', jsonb_build_object('score', 20, 'resources', jsonb_build_object('budget', -5, 'quality', -5), 'feedback', '标准进度压缩技术', 'is_optimal', true)),
                jsonb_build_object('id', 'd3-2', 'text', '加班赶工', 'description', '安排团队加班追赶进度', 'impact', jsonb_build_object('score', 8, 'resources', jsonb_build_object('budget', -10, 'morale', -20), 'feedback', '短期有效但长期代价大')),
                jsonb_build_object('id', 'd3-3', 'text', '削减非核心功能', 'description', '与客户协商延期部分功能', 'impact', jsonb_build_object('score', 15, 'resources', jsonb_build_object('morale', 5), 'feedback', '务实但需要客户同意'))
            )
        )
    ),
    jsonb_build_array('危机管理', '资源调配', '知识转移', '进度压缩'),
    20,
    true
);

-- 场景2: 团队冲突调解
INSERT INTO app_simulation_scenarios (title, description, difficulty, category, cover_image, stages, learning_objectives, estimated_time, is_published)
VALUES (
    '团队冲突调解：技术路线之争',
    '团队内部对技术选型产生严重分歧，资深工程师各执己见，团队协作陷入僵局。',
    'Medium',
    'Team Management',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    jsonb_build_array(
        jsonb_build_object(
            'id', 'stage-1',
            'title', '冲突识别',
            'description', '架构师主张微服务架构，技术负责人坚持单体架构，双方争论不休。',
            'context', '项目已延期2周，技术选型必须尽快确定',
            'decisions', jsonb_build_array(
                jsonb_build_object('id', 'd1-1', 'text', '召开技术评审会', 'description', '组织全员讨论', 'impact', jsonb_build_object('score', 12, 'resources', jsonb_build_object('time', -2), 'feedback', '民主但可能加剧分歧')),
                jsonb_build_object('id', 'd1-2', 'text', '私下分别沟通', 'description', '单独了解各方顾虑', 'impact', jsonb_build_object('score', 22, 'resources', jsonb_build_object('morale', 10), 'feedback', '了解真实诉求，寻找折中方案', 'is_optimal', true)),
                jsonb_build_object('id', 'd1-3', 'text', '直接拍板决定', 'description', '项目经理强势决策', 'impact', jsonb_build_object('score', 8, 'resources', jsonb_build_object('morale', -15), 'feedback', '快速但可能伤害团队氛围'))
            )
        ),
        jsonb_build_object(
            'id', 'stage-2',
            'title', '方案制定',
            'description', '需要找到一个双方都能接受的技术方案。',
            'context', '双方都有合理诉求，需要平衡',
            'decisions', jsonb_build_array(
                jsonb_build_object('id', 'd2-1', 'text', '先单体后微服务', 'description', '渐进式演进策略', 'impact', jsonb_build_object('score', 25, 'resources', jsonb_build_object('budget', 0), 'feedback', '最佳折中，兼顾当前和未来', 'is_optimal', true)),
                jsonb_build_object('id', 'd2-2', 'text', '按业务拆分', 'description', '部分微服务部分单体', 'impact', jsonb_build_object('score', 18, 'resources', jsonb_build_object('budget', -10), 'feedback', '混合方案，复杂度较高')),
                jsonb_build_object('id', 'd2-3', 'text', '选择更简单方案', 'description', '选择团队更熟悉的技术', 'impact', jsonb_build_object('score', 10, 'resources', jsonb_build_object('time', 5), 'feedback', '稳妥但可能限制未来发展'))
            )
        )
    ),
    jsonb_build_array('冲突解决', '团队管理', '技术决策'),
    15,
    true
);

-- 场景3-10 简要插入
INSERT INTO app_simulation_scenarios (title, description, difficulty, category, cover_image, stages, learning_objectives, estimated_time, is_published)
VALUES 
(
    '客户变更管理：需求频繁变更',
    '项目进行到一半，客户频繁提出需求变更，导致进度严重滞后。',
    'Hard',
    'Scope Management',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '变更评估', 'description', '客户提出第5次重大需求变更', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 'c1-1', 'text', '无条件接受', 'impact', jsonb_build_object('score', 5)),
            jsonb_build_object('id', 'c1-2', 'text', '评估影响后协商', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 'c1-3', 'text', '拒绝变更', 'impact', jsonb_build_object('score', 10))
        ))
    ),
    jsonb_build_array('变更管理', '范围控制', '客户沟通'),
    20,
    true
),
(
    '预算超支应对：资金危机',
    '项目进行到70%，发现预算已经用完，后续工作面临资金缺口。',
    'Expert',
    'Cost Management',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '成本审计', 'description', '分析预算超支原因', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 'b1-1', 'text', '申请追加预算', 'impact', jsonb_build_object('score', 15)),
            jsonb_build_object('id', 'b1-2', 'text', '削减范围保核心', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 'b1-3', 'text', '寻求外部融资', 'impact', jsonb_build_object('score', 10))
        ))
    ),
    jsonb_build_array('成本控制', '风险管理', '商业谈判'),
    25,
    true
),
(
    '进度延误恢复：关键路径受阻',
    '关键路径上的任务严重延期，影响整个项目交付时间。',
    'Medium',
    'Schedule Management',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '进度分析', 'description', '关键路径延误分析', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 's1-1', 'text', '增加资源投入', 'impact', jsonb_build_object('score', 18)),
            jsonb_build_object('id', 's1-2', 'text', '快速跟进并行', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 's1-3', 'text', '调整范围', 'impact', jsonb_build_object('score', 12))
        ))
    ),
    jsonb_build_array('进度管理', '关键路径', '资源优化'),
    15,
    true
),
(
    '质量问题处理：严重缺陷',
    '上线前一周发现严重质量缺陷，可能影响产品安全和用户体验。',
    'Hard',
    'Quality Management',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '质量评估', 'description', '评估缺陷影响范围和修复时间', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 'q1-1', 'text', '推迟上线修复', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 'q1-2', 'text', '上线后热修复', 'impact', jsonb_build_object('score', 10)),
            jsonb_build_object('id', 'q1-3', 'text', '降级上线', 'impact', jsonb_build_object('score', 15))
        ))
    ),
    jsonb_build_array('质量管理', '缺陷管理', '发布决策'),
    20,
    true
),
(
    '风险事件响应：生产故障',
    '系统上线后发生严重生产故障，影响大量用户，需要紧急响应。',
    'Expert',
    'Risk Management',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '应急响应', 'description', '生产环境发生P0级故障', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 'r1-1', 'text', '立即回滚', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 'r1-2', 'text', '现场修复', 'impact', jsonb_build_object('score', 10)),
            jsonb_build_object('id', 'r1-3', 'text', '降级服务', 'impact', jsonb_build_object('score', 15))
        ))
    ),
    jsonb_build_array('应急管理', '风险响应', '危机公关'),
    25,
    true
),
(
    '供应商管理：外包质量问题',
    '外包团队交付的代码质量不达标，距离交付日期仅剩2周。',
    'Medium',
    'Vendor Management',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '质量审查', 'description', '外包交付物质量不达标', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 'v1-1', 'text', '要求返工', 'impact', jsonb_build_object('score', 15)),
            jsonb_build_object('id', 'v1-2', 'text', '内部接手', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 'v1-3', 'text', '降低验收标准', 'impact', jsonb_build_object('score', 5))
        ))
    ),
    jsonb_build_array('供应商管理', '质量控制', '合同管理'),
    15,
    true
),
(
    '范围蔓延控制：需求蔓延',
    '项目过程中不断有新需求加入，导致项目范围失控。',
    'Medium',
    'Scope Management',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '范围评估', 'description', '项目范围持续扩大', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 'sc1-1', 'text', '接受新需求', 'impact', jsonb_build_object('score', 10)),
            jsonb_build_object('id', 'sc1-2', 'text', '启动变更流程', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 'sc1-3', 'text', '推迟到下一阶段', 'impact', jsonb_build_object('score', 15))
        ))
    ),
    jsonb_build_array('范围管理', '变更控制', '需求管理'),
    15,
    true
),
(
    '沟通障碍解决：跨部门协作',
    '产品、开发、测试部门之间沟通不畅，导致需求理解偏差。',
    'Easy',
    'Communication',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800',
    jsonb_build_array(
        jsonb_build_object('id', 'stage-1', 'title', '沟通诊断', 'description', '跨部门沟通存在障碍', 'decisions', jsonb_build_array(
            jsonb_build_object('id', 'co1-1', 'text', '增加会议频率', 'impact', jsonb_build_object('score', 15)),
            jsonb_build_object('id', 'co1-2', 'text', '建立统一文档', 'impact', jsonb_build_object('score', 20, 'is_optimal', true)),
            jsonb_build_object('id', 'co1-3', 'text', '指定专人对接', 'impact', jsonb_build_object('score', 18))
        ))
    ),
    jsonb_build_array('沟通管理', '跨部门协作', '文档管理'),
    10,
    true
);

SELECT '10个完整模拟场景已插入' as status;
