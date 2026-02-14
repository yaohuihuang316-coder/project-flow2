-- ==========================================
-- 实战模拟场景数据 - 10个完整场景
-- 包含: 项目危机处理、团队冲突调解、客户变更管理等
-- ==========================================

-- 清空现有场景数据（可选，如果需要保留现有数据请注释掉）
-- DELETE FROM app_simulation_scenarios WHERE is_published = true;

-- 插入10个完整的模拟场景
INSERT INTO app_simulation_scenarios (
    id,
    title, 
    description, 
    difficulty, 
    category, 
    cover_image,
    stages, 
    learning_objectives,
    estimated_time,
    completion_count,
    is_published,
    created_at
) VALUES 
-- ==========================================
-- 场景1: 项目危机处理
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440001',
    '项目危机处理：核心成员离职危机',
    '项目关键阶段，核心开发人员突然离职，你需要在资源紧张的情况下确保项目按时交付。',
    'Hard',
    'Crisis Management',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-1-1",
            "title": "紧急评估",
            "description": "核心开发工程师突然离职，他负责的关键模块还未完成，你该怎么办？",
            "context": "距离项目交付还有3周，核心开发工程师小李突然提出离职，他负责的用户认证模块和支付模块只完成了60%，且缺乏详细文档。",
            "decisions": [
                {
                    "id": "dec-1-1a",
                    "text": "立即招聘新人接手",
                    "description": "启动紧急招聘流程，希望能在1周内找到替代者",
                    "impact": {"score": 5, "resources": {"budget": -30, "time": -5, "morale": -10}, "feedback": "招聘需要时间，新人熟悉代码至少需要2周，风险很大。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-1-1b",
                    "text": "内部调配资深开发",
                    "description": "从其他项目组借调资深工程师接手",
                    "impact": {"score": 15, "resources": {"budget": -10, "time": -2, "morale": 5}, "feedback": "不错的选择，内部调配可以快速响应，且资深工程师学习能力强。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-1-1c",
                    "text": "安排离职交接+外聘顾问",
                    "description": "要求小李完成交接文档，同时聘请外部技术顾问协助",
                    "impact": {"score": 25, "resources": {"budget": -15, "time": 0, "morale": 10}, "feedback": "最优方案！确保知识传递的同时获得专业支持，风险可控。"},
                    "is_optimal": true
                }
            ],
            "resources": {"budget": 100, "time": 21, "morale": 70, "quality": 85}
        },
        {
            "id": "stage-1-2",
            "title": "进度调整",
            "description": "接手团队评估后发现工作量比预期大，需要重新规划",
            "context": "新接手的工程师评估发现代码质量较差，需要重构部分逻辑，预计要多花1周时间。",
            "decisions": [
                {
                    "id": "dec-1-2a",
                    "text": "申请延期交付",
                    "description": "与客户沟通，申请延期1周上线",
                    "impact": {"score": 20, "resources": {"time": 7, "morale": 15, "quality": 10}, "feedback": "勇敢的决定！承认现实并保证质量，客户通常能理解合理的延期。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-1-2b",
                    "text": "简化功能范围",
                    "description": "砍掉非核心功能，保证主体功能按时上线",
                    "impact": {"score": 15, "resources": {"time": 0, "quality": 5}, "feedback": "务实的选择，优先保障核心价值和交付承诺。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-1-2c",
                    "text": "强制按原计划执行",
                    "description": "要求团队加班赶工，不惜一切代价按时交付",
                    "impact": {"score": -10, "resources": {"time": 0, "morale": -25, "quality": -20}, "feedback": "过于激进！强制加班会导致团队 burnout，代码质量难以保证。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-1-3",
            "title": "质量把控",
            "description": "项目临近交付，测试发现多个严重bug，如何平衡质量与时间？",
            "context": "QA团队在回归测试中发现3个严重级别的bug，修复估计需要3天时间，但距离原定交付日只剩2天。",
            "decisions": [
                {
                    "id": "dec-1-3a",
                    "text": "修复所有bug后交付",
                    "description": "推迟上线，确保所有严重bug都修复完成",
                    "impact": {"score": 20, "resources": {"time": 3, "quality": 15}, "feedback": "质量第一！宁可延期也不让有严重缺陷的产品上线。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-1-3b",
                    "text": "先上线后修复",
                    "description": "按原计划上线，通过热修复方式后续解决bug",
                    "impact": {"score": -15, "resources": {"time": 0, "quality": -25}, "feedback": "风险极高！严重bug可能导致系统故障，影响用户信任和业务。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-1-3c",
                    "text": "选择性修复",
                    "description": "只修复影响最大的1个bug，其他后续处理",
                    "impact": {"score": 10, "resources": {"time": 1, "quality": 0}, "feedback": "权衡之计，修复关键问题后上线，但需要与客户充分沟通已知问题。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["危机应对与决策", "资源重新配置", "风险管理", "干系人沟通", "质量与进度平衡"]'::jsonb,
    20,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景2: 团队冲突调解
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440002',
    '团队冲突调解：技术路线之争',
    '团队内部对技术选型产生严重分歧，你需要化解冲突并统一团队方向。',
    'Medium',
    'Team Management',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-2-1",
            "title": "冲突初现",
            "description": "技术负责人和架构师在技术选型上产生激烈争执，团队氛围紧张",
            "context": "技术负责人主张使用React+Node.js全栈方案，而资深架构师坚持采用Java Spring Boot微服务架构。两人各执己见，团队开始分裂成两派。",
            "decisions": [
                {
                    "id": "dec-2-1a",
                    "text": "支持技术负责人的方案",
                    "description": "作为项目经理，力挺技术负责人的选择",
                    "impact": {"score": -5, "resources": {"morale": -20}, "feedback": "偏袒一方会加剧冲突，架构师可能消极配合甚至离职。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-2-1b",
                    "text": "组织技术评审会议",
                    "description": "召集核心团队，让双方充分阐述方案优劣",
                    "impact": {"score": 20, "resources": {"time": -2, "morale": 10}, "feedback": "优秀的做法！让事实和数据说话，给予每个人表达的机会。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-2-1c",
                    "text": "各自退让，混合方案",
                    "description": "前端用React，后端用Java，试图两全其美",
                    "impact": {"score": 5, "resources": {"budget": -10}, "feedback": "折中方案看似公平，但可能增加系统复杂度，需要评估维护成本。"},
                    "is_optimal": false
                }
            ],
            "resources": {"budget": 100, "time": 30, "morale": 60, "quality": 80}
        },
        {
            "id": "stage-2-2",
            "title": "评估与决策",
            "description": "技术评审后发现两个方案各有优劣，如何做出最终决策？",
            "context": "React方案开发效率高、招人容易，但长期维护成本高；Java方案稳定可靠、适合大型系统，但开发周期长、团队需要学习成本。",
            "decisions": [
                {
                    "id": "dec-2-2a",
                    "text": "根据项目需求选择",
                    "description": "基于项目时间、团队技能等因素做出技术决策",
                    "impact": {"score": 25, "resources": {"morale": 15, "quality": 5}, "feedback": "明智之举！以项目成功为导向做决策，而非个人偏好。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-2-2b",
                    "text": "让CTO做最终决定",
                    "description": "将决策权上交，让CTO拍板",
                    "impact": {"score": 10, "resources": {"morale": 0}, "feedback": "可以执行，但可能让团队觉得项目经理缺乏决断力。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-2-2c",
                    "text": "投票表决",
                    "description": "让团队投票决定使用哪个技术栈",
                    "impact": {"score": 5, "resources": {"morale": 5}, "feedback": "技术决策不应该简单投票，专业问题需要专业判断。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-2-3",
            "title": "执行与安抚",
            "description": "技术选型已定，如何安抚未获支持的派系并推动执行？",
            "context": "最终决定采用React方案，架构师感到失望，态度消极，开始考虑离职。",
            "decisions": [
                {
                    "id": "dec-2-3a",
                    "text": "坦诚沟通，委以重任",
                    "description": "与架构师一对一沟通，让他在新架构设计中发挥主导作用",
                    "impact": {"score": 25, "resources": {"morale": 20, "quality": 10}, "feedback": "高情商处理！让架构师感受到被尊重和信任，化危为机。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-2-3b",
                    "text": "强调组织纪律",
                    "description": "要求所有人服从决策，不配合者调离项目组",
                    "impact": {"score": -15, "resources": {"morale": -30}, "feedback": "过于强硬！可能导致核心人才流失，团队士气受重创。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-2-3c",
                    "text": "冷处理，让时间化解",
                    "description": "不再提及此事，让团队自然接受现实",
                    "impact": {"score": 0, "resources": {"morale": -10}, "feedback": "消极应对，负面情绪可能持续发酵影响项目执行。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["冲突识别与管理", "团队沟通技巧", "技术决策方法论", "情绪智力", "干系人管理"]'::jsonb,
    18,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景3: 客户变更管理
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440003',
    '客户变更管理：需求大改风波',
    '项目进行到一半，客户提出重大需求变更，要求重新设计核心功能。',
    'Hard',
    'Scope Management',
    'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-3-1",
            "title": "变更评估",
            "description": "客户要求将B2B系统改为支持B2C，核心架构需要重构",
            "context": "项目已进行3个月，完成了60%的功能开发。客户CEO参观竞品后，突然要求将系统从纯B2B模式改为同时支持B2C，这意味着核心订单系统和用户体系需要大幅调整。",
            "decisions": [
                {
                    "id": "dec-3-1a",
                    "text": "直接拒绝变更",
                    "description": "告知客户这属于重大变更，超出原合同范围",
                    "impact": {"score": -10, "resources": {"morale": 5}, "feedback": "过于生硬！虽然守住了范围，但可能损害客户关系。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-3-1b",
                    "text": "无条件接受",
                    "description": "承诺满足客户需求，全力配合修改",
                    "impact": {"score": 0, "resources": {"budget": -50, "time": -30, "morale": -20}, "feedback": "盲目承诺！会导致项目严重超支延期，团队也可能 burnout。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-3-1c",
                    "text": "影响分析+商务谈判",
                    "description": "详细评估变更影响，准备两套方案与客户协商",
                    "impact": {"score": 25, "resources": {"time": -2}, "feedback": "专业做法！用数据和方案说话，为商务谈判争取主动。"},
                    "is_optimal": true
                }
            ],
            "resources": {"budget": 100, "time": 60, "morale": 75, "quality": 85}
        },
        {
            "id": "stage-3-2",
            "title": "方案设计",
            "description": "客户坚持要变更，你需要提出可行的实施方案",
            "context": "客户认可变更的影响，愿意讨论如何实施。他们希望在6个月内看到B2C功能上线。",
            "decisions": [
                {
                    "id": "dec-3-2a",
                    "text": "推倒重来",
                    "description": "停止当前开发，重新设计和开发新架构",
                    "impact": {"score": -5, "resources": {"budget": -80, "time": -60, "quality": -10}, "feedback": "代价太大！前期投入全部浪费，且无法保证新方案成功。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-3-2b",
                    "text": "渐进式改造",
                    "description": "保留现有架构，通过扩展模块支持B2C",
                    "impact": {"score": 20, "resources": {"budget": -30, "time": -20, "morale": 5}, "feedback": "务实的选择！在现有基础上演进，风险可控，成本合理。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-3-2c",
                    "text": "分两期交付",
                    "description": "先完成原B2B系统上线，二期开发B2C功能",
                    "impact": {"score": 15, "resources": {"budget": -40, "time": 0}, "feedback": "合理规划，但需要客户同意分阶段交付，且团队要承受连续作战压力。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-3-3",
            "title": "合同与期望管理",
            "description": "变更方案确定后，如何完善合同并管理客户期望？",
            "context": "双方同意采用渐进式改造方案，预计增加40万预算和2个月时间。客户希望尽快开始实施。",
            "decisions": [
                {
                    "id": "dec-3-3a",
                    "text": "口头承诺立即开工",
                    "description": "先开工再补合同，展示合作诚意",
                    "impact": {"score": -15, "resources": {"budget": -20}, "feedback": "风险巨大！没有合同保护，后续付款和执行都缺乏保障。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-3-3b",
                    "text": "签订变更补充协议",
                    "description": "明确变更范围、预算、时间，签署正式补充协议",
                    "impact": {"score": 25, "resources": {"time": -3}, "feedback": "专业的项目管理！用法律文件保护双方权益，避免后续纠纷。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-3-3c",
                    "text": "简化流程，邮件确认",
                    "description": "用邮件往来确认变更，快速启动项目",
                    "impact": {"score": 10, "resources": {"time": -1}, "feedback": "比口头承诺好，但法律效力有限，大项目还是应该走正式流程。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["变更控制流程", "范围蔓延管理", "商务谈判技巧", "干系人期望管理", "合同与法务基础"]'::jsonb,
    22,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景4: 预算超支应对
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440004',
    '预算超支应对：项目面临资金危机',
    '项目进行到中期，发现预算已经使用了70%，但进度只有40%。',
    'Expert',
    'Cost Management',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-4-1",
            "title": "诊断分析",
            "description": "预算严重超支，需要找出根本原因",
            "context": "项目执行4个月，原计划8个月完成。目前预算已花掉70%，但交付物只完成40%。财务部门发出预警，要求立即整改。",
            "decisions": [
                {
                    "id": "dec-4-1a",
                    "text": "全面审计",
                    "description": "聘请外部审计公司彻查所有支出",
                    "impact": {"score": 5, "resources": {"budget": -10, "time": -5}, "feedback": "审计有助发现问题，但耗时耗钱，可能错过整改窗口期。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-4-1b",
                    "text": "快速内部分析",
                    "description": "召集核心团队，基于数据快速分析超支原因",
                    "impact": {"score": 25, "resources": {"time": -2}, "feedback": "高效行动！快速定位问题，节省时间成本，展现领导力。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-4-1c",
                    "text": "立即削减开支",
                    "description": "停止所有非必要支出，冻结招聘和采购",
                    "impact": {"score": 10, "resources": {"morale": -15}, "feedback": "止血有必要，但盲目削减可能影响项目正常推进，治标不治本。"},
                    "is_optimal": false
                }
            ],
            "resources": {"budget": 30, "time": 120, "morale": 70, "quality": 80}
        },
        {
            "id": "stage-4-2",
            "title": "原因分析",
            "description": "分析发现多个成本超支因素，需要优先处理",
            "context": "分析结果显示：1）需求频繁变更导致返工；2）外包成本远超预期；3）技术债务导致效率低下；4）人员配置过剩。",
            "decisions": [
                {
                    "id": "dec-4-2a",
                    "text": "严控变更",
                    "description": "建立严格的变更控制流程，拒绝非必要变更",
                    "impact": {"score": 20, "resources": {"budget": 20, "morale": 5}, "feedback": "关键措施！控制变更是遏制成本继续超支的首要任务。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-4-2b",
                    "text": "优化外包策略",
                    "description": "重新谈判外包合同，部分工作收回内部",
                    "impact": {"score": 15, "resources": {"budget": 15}, "feedback": "有效手段，但需要法务和商务配合，谈判周期较长。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-4-2c",
                    "text": "裁员减支",
                    "description": "裁减冗余人员，降低人力成本",
                    "impact": {"score": -5, "resources": {"budget": 25, "morale": -40, "quality": -10}, "feedback": "虽然能快速降低成本，但会严重打击团队士气，关键人员流失风险大。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-4-3",
            "title": "资源调配",
            "description": "控制成本的同时，如何重新规划资源确保项目完成？",
            "context": "通过前期措施，预计后续成本可以降低30%。但剩余预算仍然紧张，需要精打细算。",
            "decisions": [
                {
                    "id": "dec-4-3a",
                    "text": "申请追加预算",
                    "description": "向管理层申请追加50%预算",
                    "impact": {"score": 10, "resources": {"budget": 50}, "feedback": "可以缓解燃眉之急，但暴露了项目管理问题，影响你的职业信誉。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-4-3b",
                    "text": "调整范围+追赶进度",
                    "description": "与客户协商削减非核心功能，同时优化流程追赶进度",
                    "impact": {"score": 20, "resources": {"budget": 10, "time": 10}, "feedback": "主动出击！通过价值工程优化项目，既省钱又保证核心价值。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-4-3c",
                    "text": "引入投资分摊风险",
                    "description": "寻找合作伙伴共同投资项目，分担成本",
                    "impact": {"score": 5, "resources": {"budget": 30}, "feedback": "创新思路，但寻找合作伙伴需要时间，且会稀释项目控制权。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["成本控制与挣值管理", "根本原因分析", "变更控制", "商务谈判与合同管理", "资源优化"]'::jsonb,
    25,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景5: 进度延误恢复
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440005',
    '进度延误恢复：关键路径受阻',
    '项目关键路径上的核心任务严重延误，威胁到整体交付时间。',
    'Medium',
    'Schedule Management',
    'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-5-1",
            "title": "延误识别",
            "description": "第三方接口开发严重延误，影响多个后续任务",
            "context": "依赖外部供应商的支付接口原定本周交付，但对方通知要延期3周。这会导致支付模块开发、集成测试、UAT等后续任务全部顺延。",
            "decisions": [
                {
                    "id": "dec-5-1a",
                    "text": "等待供应商",
                    "description": "相信供应商的承诺，继续等待",
                    "impact": {"score": -15, "resources": {"time": -21, "morale": -10}, "feedback": "被动等待！将项目命运交给他人，风险完全不可控。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-5-1b",
                    "text": "寻找替代方案",
                    "description": "评估其他支付供应商或自研方案",
                    "impact": {"score": 20, "resources": {"budget": -15, "time": -5}, "feedback": "积极主动！不把鸡蛋放在一个篮子里，降低外部依赖风险。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-5-1c",
                    "text": "高层介入施压",
                    "description": "让高管出面与供应商高层沟通",
                    "impact": {"score": 10, "resources": {"time": -5}, "feedback": "有助于解决问题，但频繁动用高层资源会削弱你的管理权威。"},
                    "is_optimal": false
                }
            ],
            "resources": {"budget": 100, "time": 60, "morale": 80, "quality": 85}
        },
        {
            "id": "stage-5-2",
            "title": "进度压缩",
            "description": "即使更换供应商，预计仍会延误1周，需要压缩进度",
            "context": "备选供应商可以2周内提供接口，比原计划延误1周。需要想办法把延误影响降到最低。",
            "decisions": [
                {
                    "id": "dec-5-2a",
                    "text": "快速跟进",
                    "description": "让测试团队提前准备测试用例，设计Mock接口先行开发",
                    "impact": {"score": 25, "resources": {"budget": -5, "time": 5, "morale": 5}, "feedback": "专业操作！通过快速跟进和并行作业抢回时间，经典的项目恢复技术。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-5-2b",
                    "text": "赶工",
                    "description": "增加开发人员，延长工作时间追赶进度",
                    "impact": {"score": 10, "resources": {"budget": -20, "morale": -15, "quality": -5}, "feedback": "传统赶工手段，效果有限且成本高，可能影响质量。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-5-2c",
                    "text": "申请延期",
                    "description": "如实向客户汇报情况，申请延期1周",
                    "impact": {"score": 15, "resources": {"time": 7}, "feedback": "诚实沟通值得肯定，1周延期通常在可接受范围内，但应同时展示补救措施。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-5-3",
            "title": "风险预防",
            "description": "如何避免类似的外部依赖风险再次发生？",
            "context": "项目虽然回到正轨，但你意识到还有其他外部依赖（如云服务商、短信通道等）存在类似风险。",
            "decisions": [
                {
                    "id": "dec-5-3a",
                    "text": "建立备用供应商名单",
                    "description": "为每个关键外部依赖准备备选方案",
                    "impact": {"score": 20, "resources": {"time": -3}, "feedback": "完善的风险管理！提前准备Plan B，增强项目韧性。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-5-3b",
                    "text": "加强供应商管理",
                    "description": "每周与供应商召开同步会，密切跟踪进度",
                    "impact": {"score": 15, "resources": {"time": -2}, "feedback": "有效的监控措施，增加沟通频次可以及早发现问题。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-5-3c",
                    "text": "减少外部依赖",
                    "description": "评估自研替代方案，降低对外部供应商的依赖",
                    "impact": {"score": 10, "resources": {"budget": -30}, "feedback": "长期战略选择，但会增加项目复杂度和成本，需要权衡。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["关键路径管理", "进度压缩技术", "供应商管理", "风险应对策略", "项目恢复技术"]'::jsonb,
    18,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景6: 质量问题处理
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440006',
    '质量问题处理：上线前发现严重缺陷',
    '系统上线前夕，QA在回归测试中发现严重影响核心功能的bug。',
    'Hard',
    'Quality Management',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-6-1",
            "title": "问题评估",
            "description": "发现订单计算逻辑存在错误，可能影响财务数据",
            "context": "QA在测试中发现，当订单包含多种优惠叠加时，计算逻辑会出现精度问题，导致订单金额偏差。已有3个生产环境订单出现异常。",
            "decisions": [
                {
                    "id": "dec-6-1a",
                    "text": "立即修复并重新测试",
                    "description": "推迟上线，彻底修复并全面回归测试",
                    "impact": {"score": 20, "resources": {"time": -7, "quality": 15}, "feedback": "质量第一！涉及财务数据的问题绝不可掉以轻心。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-6-1b",
                    "text": "限制场景上线",
                    "description": "临时禁止叠加优惠，简化场景先行上线",
                    "impact": {"score": 10, "resources": {"time": -1}, "feedback": "权宜之计，但会影响用户体验和业务目标，需尽快修复。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-6-1c",
                    "text": "按计划上线，后续修复",
                    "description": "这个问题概率较低，可以上线后通过热修复解决",
                    "impact": {"score": -20, "resources": {"time": 0, "quality": -30, "morale": -10}, "feedback": "严重错误！财务相关bug可能导致严重后果，绝对不可以带病上线。"},
                    "is_optimal": false
                }
            ],
            "resources": {"budget": 100, "time": 14, "morale": 75, "quality": 70}
        },
        {
            "id": "stage-6-2",
            "title": "根因分析",
            "description": "为什么这个bug在开发阶段没有被发现？",
            "context": "修复bug后发现，根本原因是需求文档中缺少对多优惠叠加的详细规则说明，开发同学按照简单场景实现。",
            "decisions": [
                {
                    "id": "dec-6-2a",
                    "text": "完善测试用例",
                    "description": "增加边界条件和组合场景的测试覆盖",
                    "impact": {"score": 15, "resources": {"time": -3, "quality": 10}, "feedback": "必要的改进，但测试用例只能发现bug，不能预防bug。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-6-2b",
                    "text": "加强需求评审",
                    "description": "建立更严格的需求评审机制，确保场景完整性",
                    "impact": {"score": 20, "resources": {"time": -2, "quality": 15}, "feedback": "治本之策！从源头把控需求质量，避免开发走偏。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-6-2c",
                    "text": "增加代码审查",
                    "description": "强制要求复杂的业务逻辑必须经资深工程师review",
                    "impact": {"score": 15, "resources": {"time": -2, "quality": 10}, "feedback": "有效手段，但会略微增加开发周期，需要平衡。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-6-3",
            "title": "客户沟通",
            "description": "需要向客户说明情况并争取延期，如何沟通？",
            "context": "原定的上线日期需要推迟1周，客户市场部已经安排了推广计划，延期会影响他们的市场活动。",
            "decisions": [
                {
                    "id": "dec-6-3a",
                    "text": "坦诚说明问题严重性",
                    "description": "如实汇报发现的财务计算bug，争取客户理解",
                    "impact": {"score": 20, "resources": {"morale": 10}, "feedback": "诚实负责的态度！客户虽然失望但会尊重你的专业判断。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-6-3b",
                    "text": "强调预防成本",
                    "description": "解释现在修复的成本远低于上线后修复的成本",
                    "impact": {"score": 15, "resources": {"morale": 5}, "feedback": "用数据说话，帮助客户从商业角度理解决策的合理性。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-6-3c",
                    "text": "承诺额外服务补偿",
                    "description": "提供免费运维服务作为延期补偿",
                    "impact": {"score": 10, "resources": {"budget": -15}, "feedback": "善意之举，但不应成为标准做法，可能让客户形成错误预期。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["质量管理体系", "缺陷管理流程", "测试策略设计", "需求工程", "质量与进度权衡"]'::jsonb,
    20,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景7: 风险事件响应
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440007',
    '风险事件响应：生产环境故障',
    '系统上线后遭遇重大生产事故，你需要带领团队紧急响应。',
    'Expert',
    'Risk Management',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-7-1",
            "title": "紧急响应",
            "description": "生产环境数据库性能骤降，系统响应缓慢，大量用户投诉",
            "context": "上线第3天，监控告警显示数据库CPU使用率飙升至95%，查询响应时间从100ms增加到10s以上，客服热线被打爆。",
            "decisions": [
                {
                    "id": "dec-7-1a",
                    "text": "立即回滚版本",
                    "description": "快速回滚到上一版本，先恢复服务",
                    "impact": {"score": 10, "resources": {"morale": 5}, "feedback": "快速止损，但可能丢失新功能的数据，且需要确定是版本问题。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-7-1b",
                    "text": "紧急扩容",
                    "description": "临时增加数据库服务器资源",
                    "impact": {"score": 15, "resources": {"budget": -20}, "feedback": "可以缓解症状，但如果没有定位根本原因，问题可能再次出现。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-7-1c",
                    "text": "启动应急响应流程",
                    "description": "召集技术骨干成立应急小组，分工定位问题",
                    "impact": {"score": 25, "resources": {"morale": 10}, "feedback": "专业做法！系统性地应对危机，既治标又治本，还能维护团队士气。"},
                    "is_optimal": true
                }
            ],
            "resources": {"budget": 100, "time": 24, "morale": 70, "quality": 75}
        },
        {
            "id": "stage-7-2",
            "title": "问题定位",
            "description": "排查发现慢查询和连接池配置问题",
            "context": "经过分析，发现两个问题：1）新版本有一个未优化的慢查询；2）连接池配置在压力下不足。",
            "decisions": [
                {
                    "id": "dec-7-2a",
                    "text": "修复慢查询+优化配置",
                    "description": "立即修复慢查询并调整连接池参数",
                    "impact": {"score": 25, "resources": {"time": -4, "quality": 10}, "feedback": "直击要害！同时解决两个根本问题，确保系统稳定。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-7-2b",
                    "text": "只优化连接池",
                    "description": "先扩大连接池缓解问题，慢查询后续优化",
                    "impact": {"score": 10, "resources": {"time": -1}, "feedback": "短期缓解，但慢查询仍是定时炸弹，可能引发新问题。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-7-2c",
                    "text": "增加缓存层",
                    "description": "引入Redis缓存减轻数据库压力",
                    "impact": {"score": 5, "resources": {"budget": -15, "time": -8}, "feedback": "架构优化思路正确，但实施周期长，不能解决当前紧急问题。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-7-3",
            "title": "事后复盘",
            "description": "问题解决后，如何进行复盘防止类似事件？",
            "context": "系统恢复正常，业务影响控制在最小范围。管理层要求提交事故报告并制定预防措施。",
            "decisions": [
                {
                    "id": "dec-7-3a",
                    "text": "追责到人",
                    "description": "追究开发人员的代码质量问题",
                    "impact": {"score": -10, "resources": {"morale": -30}, "feedback": "过度追责会营造恐惧文化，导致团队保守推诿，不利于长期发展。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-7-3b",
                    "text": "建立 blameless 复盘机制",
                    "description": "聚焦系统性改进，不追究个人责任",
                    "impact": {"score": 25, "resources": {"morale": 15, "quality": 10}, "feedback": "先进实践！从系统角度找根因，鼓励透明和学习，建立高信任团队。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-7-3c",
                    "text": "完善监控告警",
                    "description": "加强系统监控，提前发现性能问题",
                    "impact": {"score": 15, "resources": {"budget": -10, "quality": 5}, "feedback": "必要的改进，但监控只能发现问题，不能预防问题发生。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["风险识别与评估", "应急响应管理", "危机沟通", "事后复盘", "持续改进"]'::jsonb,
    22,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景8: 供应商管理
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440008',
    '供应商管理：外包团队交付质量不达标',
    '外包供应商交付的代码质量差，临近交付节点无法验收。',
    'Medium',
    'Vendor Management',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-8-1",
            "title": "质量评估",
            "description": "外包交付的模块代码质量差，bug率高，文档缺失",
            "context": "外包供应商负责的用户管理模块交付，代码审查发现代码重复率高、缺乏单元测试、接口文档不完整。距离项目集成只剩2周。",
            "decisions": [
                {
                    "id": "dec-8-1a",
                    "text": "要求供应商返工",
                    "description": "明确要求供应商在1周内修复所有问题",
                    "impact": {"score": 15, "resources": {"time": -7}, "feedback": "合理要求，但供应商可能无法按时完成，需要有备选方案。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-8-1b",
                    "text": "自行接手修复",
                    "description": "让内部团队接手重构代码",
                    "impact": {"score": 10, "resources": {"budget": -25, "time": -5, "morale": -10}, "feedback": "可以确保质量，但增加内部成本，且影响其他任务进度。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-8-1c",
                    "text": "混合模式：核心重构+外包辅助",
                    "description": "内部团队负责架构重构，外包配合做简单修复",
                    "impact": {"score": 25, "resources": {"budget": -15, "time": -3}, "feedback": "聪明分配！让专业的人做专业的事，平衡质量和进度。"},
                    "is_optimal": true
                }
            ],
            "resources": {"budget": 100, "time": 14, "morale": 75, "quality": 60}
        },
        {
            "id": "stage-8-2",
            "title": "合同谈判",
            "description": "质量问题导致额外成本，如何与供应商协商承担？",
            "context": "返工增加了15天工作量，按照合同条款，供应商应该承担部分责任。但供应商以需求变更为由推诿。",
            "decisions": [
                {
                    "id": "dec-8-2a",
                    "text": "严格按合同执行",
                    "description": "扣减当期付款并要求赔偿",
                    "impact": {"score": 5, "resources": {"budget": 20}, "feedback": "虽然合法，但可能激化矛盾，影响后续合作，甚至导致法律纠纷。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-8-2b",
                    "text": "协商分担",
                    "description": "各承担50%额外成本，换取供应商承诺改进",
                    "impact": {"score": 20, "resources": {"budget": -5, "morale": 5}, "feedback": "务实合作！维护商业关系的同时传递质量要求，为未来合作奠定基础。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-8-2c",
                    "text": "完全自己承担",
                    "description": "不与供应商计较，按时付款维持关系",
                    "impact": {"score": -10, "resources": {"budget": -25}, "feedback": "过于软弱！会传递错误信号，供应商可能继续敷衍了事。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-8-3",
            "title": "预防机制",
            "description": "如何避免未来外包项目再出现质量问题？",
            "context": "这次事件暴露了外包管理的漏洞，需要建立长效机制防止再次发生。",
            "decisions": [
                {
                    "id": "dec-8-3a",
                    "text": "加强过程管控",
                    "description": "要求每周代码提交，增加里程碑评审节点",
                    "impact": {"score": 20, "resources": {"time": -3}, "feedback": "有效的过程管理！早发现早纠正，避免最后时刻被动。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-8-3b",
                    "text": "更换供应商",
                    "description": "终止合作，寻找更可靠的外包伙伴",
                    "impact": {"score": 5, "resources": {"time": -10}, "feedback": "激进做法，新供应商也有不确定性，频繁更换成本高。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-8-3c",
                    "text": "增加验收标准",
                    "description": "制定详细的交付检查清单，不合格不付款",
                    "impact": {"score": 15, "resources": {"time": -1}, "feedback": "把好最后一关很重要，但过程管控比结果管控更有效。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["供应商选择与评估", "合同管理", "外包治理", "质量控制", "商务谈判"]'::jsonb,
    18,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景9: 范围蔓延控制
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440009',
    '范围蔓延控制："镀金"需求泛滥',
    '客户和业务部门不断提出"小改动"，项目范围持续膨胀。',
    'Medium',
    'Scope Management',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-9-1",
            "title": "识别蔓延",
            "description": "发现需求清单比立项时增加了40%，团队疲于应付",
            "context": "项目进行到中期，你发现需求文档已经历了20多次"小调整"，累计新增功能点30多个。团队开始抱怨工作量大，进度落后。",
            "decisions": [
                {
                    "id": "dec-9-1a",
                    "text": "继续接受变更",
                    "description": "满足客户需求，维护良好关系",
                    "impact": {"score": -15, "resources": {"budget": -30, "time": -20, "morale": -20}, "feedback": "纵容蔓延！项目必然延期超支，团队 burnout 风险极高。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-9-1b",
                    "text": "全面暂停变更",
                    "description": "宣布即日起不再接受任何新需求",
                    "impact": {"score": 5, "resources": {"morale": 10}, "feedback": "可以止损，但可能错失合理的业务需求，影响客户满意度。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-9-1c",
                    "text": "建立变更控制流程",
                    "description": "设立变更委员会，评估每个变更的价值和影响",
                    "impact": {"score": 25, "resources": {"time": -2, "morale": 5}, "feedback": "专业管理！用流程过滤噪音，确保变更是必要且值得的。"},
                    "is_optimal": true
                }
            ],
            "resources": {"budget": 80, "time": 90, "morale": 65, "quality": 80}
        },
        {
            "id": "stage-9-2",
            "title": "价值评估",
            "description": "客户又提出一个"紧急"需求，需要评估其价值",
            "context": "销售总监要求在系统中增加一个复杂的客户画像分析功能，说"对销售很重要"。但这个功能原计划在二期开发。",
            "decisions": [
                {
                    "id": "dec-9-2a",
                    "text": "无条件接受",
                    "description": "销售是核心业务，优先满足",
                    "impact": {"score": -10, "resources": {"budget": -20, "time": -15, "morale": -10}, "feedback": "再次陷入蔓延陷阱！所有需求都说重要，必须评估ROI。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-9-2b",
                    "text": "数据驱动决策",
                    "description": "要求提供预期收益数据，评估投入产出比",
                    "impact": {"score": 20, "resources": {"time": -2}, "feedback": "理性分析！用数据说话，避免被"感觉重要"误导。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-9-2c",
                    "text": "妥协折中",
                    "description": "简化功能，做最小可用版本",
                    "impact": {"score": 15, "resources": {"budget": -10, "time": -7}, "feedback": "务实的方案，但需要评估是否会累积技术债务。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-9-3",
            "title": "干系人管理",
            "description": "销售总监对变更被拒绝不满，向你的上级投诉",
            "context": "销售总监向CTO投诉你"不配合业务"，CTO要求你解释情况。",
            "decisions": [
                {
                    "id": "dec-9-3a",
                    "text": "退让接受需求",
                    "description": "为避免冲突，同意开发该功能",
                    "impact": {"score": -15, "resources": {"budget": -20, "time": -15}, "feedback": "原则性退让！开一个坏先例，以后类似情况更难处理。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-9-3b",
                    "text": "准备数据汇报",
                    "description": "用数据和事实向CTO说明项目状况",
                    "impact": {"score": 20, "resources": {"time": -1}, "feedback": "专业沟通！用客观数据争取支持，维护项目管理权威。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-9-3c",
                    "text": "寻求妥协",
                    "description": "提议将该功能作为快速跟进的二期项目",
                    "impact": {"score": 15, "resources": {"time": -1}, "feedback": "建设性方案，既保护了当前项目，又尊重了业务需求。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["范围管理基础", "变更控制流程", "价值工程", "干系人影响", "项目边界设定"]'::jsonb,
    16,
    0,
    true,
    NOW()
),

-- ==========================================
-- 场景10: 沟通障碍解决
-- ==========================================
(
    '550e8400-e29b-41d4-a716-446655440010',
    '沟通障碍解决：跨部门协作僵局',
    '技术部与产品部沟通断裂，互相指责，项目推进受阻。',
    'Easy',
    'Communication',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800',
    '[
        {
            "id": "stage-10-1",
            "title": "问题诊断",
            "description": "技术与产品团队互相抱怨，项目会议变成"批斗大会"",
            "context": "最近的项目会议上，技术团队抱怨需求"拍脑袋"、变更频繁；产品团队抱怨技术"不配合"、总是说"做不了"。双方情绪对立，会议效率极低。",
            "decisions": [
                {
                    "id": "dec-10-1a",
                    "text": "组织团建活动",
                    "description": "安排团队聚餐增进感情",
                    "impact": {"score": 5, "resources": {"budget": -5, "morale": 5}, "feedback": "有助缓解气氛，但不能解决根本问题，很快会复发。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-10-1b",
                    "text": "分别听取双方意见",
                    "description": "单独与两边负责人沟通，了解真实想法",
                    "impact": {"score": 20, "resources": {"time": -2, "morale": 5}, "feedback": "好的开始！倾听是理解的前提，有助于找到问题根源。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-10-1c",
                    "text": "强制执行决定",
                    "description": "作为项目经理，明确拍板结束争论",
                    "impact": {"score": 0, "resources": {"morale": -10}, "feedback": "压制了表面矛盾，但没有解决根本问题，可能激化冲突。"},
                    "is_optimal": false
                }
            ],
            "resources": {"budget": 100, "time": 30, "morale": 55, "quality": 80}
        },
        {
            "id": "stage-10-2",
            "title": "根因分析",
            "description": "深入了解后发现沟通机制存在根本问题",
            "context": "单独沟通后发现：1）产品不懂技术约束，提需求时没有技术预研；2）技术不理解业务价值，习惯于直接说"不行"；3）缺乏共同语言。",
            "decisions": [
                {
                    "id": "dec-10-2a",
                    "text": "建立技术预研机制",
                    "description": "大功能需技术预评估后再纳入规划",
                    "impact": {"score": 20, "resources": {"time": -2}, "feedback": "解决信息不对称！让技术尽早介入，避免后期被动。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-10-2b",
                    "text": "开展业务培训",
                    "description": "让技术团队学习产品思维和业务知识",
                    "impact": {"score": 15, "resources": {"time": -3, "morale": 5}, "feedback": "长期有益，但见效慢，不能解决当前的沟通问题。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-10-2c",
                    "text": "更换对接人",
                    "description": "调整两边负责人，换沟通能力强的人对接",
                    "impact": {"score": 10, "resources": {"morale": -5}, "feedback": "换人可以暂时缓解，但问题在机制不在人，新对接人也会遇到同样问题。"},
                    "is_optimal": false
                }
            ]
        },
        {
            "id": "stage-10-3",
            "title": "机制建设",
            "description": "建立长效协作机制，防止问题复发",
            "context": "短期措施见效，但需要从机制上防止类似问题再次发生。",
            "decisions": [
                {
                    "id": "dec-10-3a",
                    "text": "建立联合需求评审",
                    "description": "需求必须经过产品和技术的联合评审才能进入开发",
                    "impact": {"score": 20, "resources": {"time": -1, "morale": 10}, "feedback": "制度保障！通过流程确保双方充分沟通，形成协作文化。"},
                    "is_optimal": true
                },
                {
                    "id": "dec-10-3b",
                    "text": "引入共同KPI",
                    "description": "让两个团队共享项目成功的指标",
                    "impact": {"score": 15, "resources": {"morale": 10}, "feedback": "目标对齐！让双方成为利益共同体，促进协作。"},
                    "is_optimal": false
                },
                {
                    "id": "dec-10-3c",
                    "text": "设立缓冲对接人",
                    "description": "指定项目经理作为中间人，过滤双方沟通",
                    "impact": {"score": 5, "resources": {"time": -5}, "feedback": "短期缓解，但增加沟通成本，不是根本解决方案。"},
                    "is_optimal": false
                }
            ]
        }
    ]'::jsonb,
    '["沟通理论与模型", "冲突解决技巧", "跨部门协作", "干系人管理", "组织行为学"]'::jsonb,
    15,
    0,
    true,
    NOW()
)

ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    category = EXCLUDED.category,
    cover_image = EXCLUDED.cover_image,
    stages = EXCLUDED.stages,
    learning_objectives = EXCLUDED.learning_objectives,
    estimated_time = EXCLUDED.estimated_time,
    is_published = EXCLUDED.is_published,
    updated_at = NOW();

-- ==========================================
-- 输出插入结果
-- ==========================================
SELECT '成功插入/更新 10个模拟场景' as result;

SELECT 
    title,
    difficulty,
    category,
    estimated_time,
    is_published
FROM app_simulation_scenarios 
ORDER BY created_at DESC;
