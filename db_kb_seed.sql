-- ==========================================
-- 知识图谱示例数据
-- 包含18个知识节点和关联关系
-- ==========================================

-- 清空现有数据（如果需要重新初始化，取消下面注释）
-- TRUNCATE TABLE app_kb_edges, app_kb_nodes RESTART IDENTITY CASCADE;

-- ==========================================
-- 第一部分: 插入知识节点
-- 使用 ON CONFLICT DO NOTHING 避免重复插入错误
-- ==========================================

-- 基础概念类节点 (5个)
INSERT INTO app_kb_nodes (id, label, type, description, difficulty, estimated_hours, course_category, node_level, prerequisites) VALUES
(1, '项目管理概述', 'concept', '项目管理是指在有限的资源约束下，运用系统的观点、方法和理论，对项目涉及的全部工作进行有效地管理。从项目的投资决策开始到项目结束的全过程进行计划、组织、指挥、协调、控制和评价，以实现项目的目标。', 1, 5, '基础知识', 1, '[]'),
(2, '五大过程组', 'concept', '项目管理包含五个基本过程组：启动、规划、执行、监控和收尾。这五个过程组构成了项目管理的生命周期框架，是所有项目管理活动的基础组织结构。', 2, 8, '基础知识', 1, '[1]'),
(3, '十大知识领域', 'concept', 'PMBOK定义的十大知识领域包括：整合、范围、进度、成本、质量、资源、沟通、风险、采购和相关方管理。这些领域覆盖了项目管理需要关注的主要方面。', 2, 10, '基础知识', 1, '[1,2]'),
(4, '敏捷宣言', 'concept', '2001年发布的敏捷软件开发宣言提出了四个核心价值观：个体和互动高于流程和工具、工作的软件高于详尽的文档、客户合作高于合同谈判、响应变化高于遵循计划。', 2, 6, '基础知识', 1, '[1]'),
(5, 'WBS工作分解结构', 'concept', 'Work Breakdown Structure是将项目可交付成果和项目工作分解成较小的、更易管理的组件的层次结构。WBS是项目管理的基础工具，为规划、估算和控制提供了框架。', 2, 8, '基础知识', 2, '[2,3]')
ON CONFLICT DO NOTHING;

-- 进阶技能类节点 (8个)
INSERT INTO app_kb_nodes (id, label, type, description, difficulty, estimated_hours, course_category, node_level, prerequisites) VALUES
(6, '进度管理', 'skill', '进度管理是项目管理的核心知识领域之一，包括定义活动、排列活动顺序、估算活动持续时间、制定进度计划和控制进度等过程。确保项目按时完成是项目成功的关键因素。', 3, 20, '核心技能', 2, '[2,3,5]'),
(7, '成本管理', 'skill', '成本管理包括规划成本管理、估算成本、制定预算和控制成本等过程。挣值管理(EVM)是成本管理的重要工具，用于衡量项目绩效和进展。', 3, 18, '核心技能', 2, '[2,3]'),
(8, '风险管理', 'skill', '风险管理包括规划风险管理、识别风险、定性分析、定量分析、规划应对和实施应对等过程。有效的风险管理能够降低项目失败的可能性。', 4, 25, '核心技能', 2, '[2,3]'),
(9, '质量管理', 'skill', '质量管理包括质量规划、管理质量和控制质量三个过程。质量成本(COQ)是质量管理中的重要概念，包括预防成本、评估成本和失败成本。', 3, 15, '核心技能', 2, '[2,3]'),
(10, '沟通管理', 'skill', '沟通管理包括规划沟通管理、管理沟通和监督沟通等过程。项目经理90%的时间用于沟通，是项目经理最重要的软技能之一。', 3, 12, '核心技能', 2, '[2,3]'),
(11, '挣值管理', 'skill', 'EVM是一种集成范围、进度和资源的绩效测量方法。通过PV(计划价值)、EV(挣值)、AC(实际成本)等关键指标计算SV、CV、SPI、CPI，评估项目健康状况。', 4, 20, '高级技能', 3, '[6,7]'),
(12, '关键路径法', 'skill', 'CPM是网络计划技术，用于确定项目最短工期和关键活动。关键路径上的任何延误都会导致项目延期，是进度管理的核心技术。', 4, 18, '高级技能', 3, '[6]'),
(13, 'Scrum框架', 'skill', 'Scrum是最流行的敏捷框架，包含三个角色(PO、SM、Dev Team)、五个事件(Sprint、计划会、每日站会、评审会、回顾会)和三个工件(产品待办、Sprint待办、增量)。', 3, 25, '敏捷方法', 2, '[4]')
ON CONFLICT DO NOTHING;

-- 实战工具类节点 (5个)
INSERT INTO app_kb_nodes (id, label, type, description, difficulty, estimated_hours, course_category, node_level, prerequisites) VALUES
(14, 'Jira工具', 'tool', 'Jira是Atlassian公司开发的项目管理工具，广泛应用于敏捷开发团队。支持Scrum和Kanban看板，提供问题跟踪、敏捷报告、工作流自定义等强大功能。', 2, 15, '工具应用', 3, '[4,13]'),
(15, '项目管理软件', 'tool', '现代项目管理软件包括Microsoft Project、ProjectLibre、禅道、Teambition等工具。这些工具提供甘特图、资源管理、协作等功能，提高项目管理效率。', 2, 10, '工具应用', 2, '[1,5,6]'),
(16, '复盘改进', 'tool', '复盘是项目结束后对整个过程进行系统性回顾的方法，包括回顾目标、评估结果、分析原因、总结经验四个步骤。持续改进是组织级项目管理成熟度提升的关键。', 3, 8, '软技能', 3, '[1,2,3]'),
(17, '领导力', 'skill', '项目经理需要具备领导力来激励团队、影响相关方、解决冲突和推动变革。情境领导、变革型领导、服务型领导等理论为项目经理提供了领导框架。', 4, 30, '软技能', 2, '[1,10]'),
(18, 'PMP认证', 'certification', 'PMP(Project Management Professional)是由PMI颁发的国际项目管理专业人士认证。要求35小时培训+4500小时项目经验，考试覆盖人员、过程和商业环境三大领域。', 5, 200, '专业认证', 4, '[1,2,3,6,7,8,9,10]')
ON CONFLICT DO NOTHING;

-- 重置序列
SELECT setval('app_kb_nodes_id_seq', 18, true);

-- ==========================================
-- 第二部分: 插入知识边关系
-- ==========================================

-- 基础概念之间的关系
INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength, description) VALUES
(1, 2, 'prerequisite', 'depends_on', 3, '项目管理概述是理解五大过程组的基础'),
(1, 3, 'prerequisite', 'depends_on', 3, '项目管理概述是理解十大知识领域的基础'),
(1, 4, 'related', 'alternative', 2, '项目管理概述与敏捷宣言代表不同的管理哲学'),
(2, 3, 'related', 'part_of', 3, '五大过程组与十大知识领域构成交叉矩阵'),
(2, 5, 'prerequisite', 'depends_on', 3, '理解五大过程组有助于掌握WBS'),
(3, 5, 'prerequisite', 'depends_on', 3, '十大知识领域中范围管理与WBS直接相关')
ON CONFLICT DO NOTHING;

-- 基础概念到进阶技能的关系
INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength, description) VALUES
(2, 6, 'prerequisite', 'depends_on', 3, '规划过程组包含进度管理活动'),
(2, 7, 'prerequisite', 'depends_on', 3, '规划过程组包含成本管理活动'),
(2, 8, 'prerequisite', 'depends_on', 3, '规划过程组包含风险管理活动'),
(2, 9, 'prerequisite', 'depends_on', 3, '规划过程组包含质量管理活动'),
(2, 10, 'prerequisite', 'depends_on', 3, '五大过程组都需要沟通支持'),
(3, 6, 'related', 'part_of', 3, '进度管理是十大知识领域之一'),
(3, 7, 'related', 'part_of', 3, '成本管理是十大知识领域之一'),
(3, 8, 'related', 'part_of', 3, '风险管理是十大知识领域之一'),
(3, 9, 'related', 'part_of', 3, '质量管理是十大知识领域之一'),
(3, 10, 'related', 'part_of', 3, '沟通管理是十大知识领域之一'),
(4, 13, 'prerequisite', 'depends_on', 3, '敏捷宣言是Scrum框架的理论基础'),
(5, 6, 'prerequisite', 'depends_on', 3, 'WBS是进度管理的基础输入')
ON CONFLICT DO NOTHING;

-- 进阶技能之间的关系
INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength, description) VALUES
(6, 11, 'prerequisite', 'depends_on', 3, '进度管理是挣值管理的组成部分'),
(7, 11, 'prerequisite', 'depends_on', 3, '成本管理是挣值管理的组成部分'),
(6, 12, 'prerequisite', 'depends_on', 3, '关键路径法是进度管理的核心技术'),
(10, 17, 'prerequisite', 'depends_on', 2, '沟通管理是领导力的重要基础'),
(8, 17, 'related', 'enhances', 2, '风险管理能力增强领导力'),
(9, 17, 'related', 'enhances', 2, '质量管理能力增强领导力')
ON CONFLICT DO NOTHING;

-- 进阶技能到实战工具的关系
INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength, description) VALUES
(13, 14, 'related', 'uses', 3, 'Scrum框架使用Jira工具进行实践'),
(6, 15, 'related', 'uses', 2, '进度管理使用项目管理软件'),
(5, 15, 'related', 'uses', 2, 'WBS通过项目管理软件创建'),
(1, 16, 'related', 'enhances', 2, '复盘改进是项目管理的持续优化方法'),
(2, 16, 'related', 'enhances', 2, '五大过程组需要复盘来持续改进'),
(17, 16, 'related', 'enables', 2, '领导力推动团队复盘改进')
ON CONFLICT DO NOTHING;

-- 到PMP认证的关系
INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength, description) VALUES
(1, 18, 'prerequisite', 'required_for', 3, '项目管理概述是PMP考试基础内容'),
(2, 18, 'prerequisite', 'required_for', 3, '五大过程组是PMP考试核心内容'),
(3, 18, 'prerequisite', 'required_for', 3, '十大知识领域是PMP考试核心内容'),
(6, 18, 'prerequisite', 'required_for', 3, '进度管理是PMP考试重点'),
(7, 18, 'prerequisite', 'required_for', 3, '成本管理是PMP考试重点'),
(8, 18, 'prerequisite', 'required_for', 3, '风险管理是PMP考试重点'),
(9, 18, 'prerequisite', 'required_for', 3, '质量管理是PMP考试重点'),
(10, 18, 'prerequisite', 'required_for', 3, '沟通管理是PMP考试重点'),
(17, 18, 'related', 'enhances', 2, '领导力提升PMP认证价值'),
(11, 18, 'related', 'enhances', 2, '挣值管理是PMP考试计算题重点'),
(12, 18, 'related', 'enhances', 2, '关键路径法是PMP考试计算题重点')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 数据统计
-- ==========================================

-- 查询节点统计
SELECT 
    type,
    COUNT(*) as count,
    AVG(difficulty)::numeric(3,1) as avg_difficulty,
    SUM(estimated_hours) as total_hours
FROM app_kb_nodes
GROUP BY type
ORDER BY count DESC;
