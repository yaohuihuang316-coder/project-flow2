-- ==========================================
-- 模拟场景数据（简化版）- 避免JSON引号问题
-- ==========================================

-- 删除旧数据（可选）
-- DELETE FROM app_simulation_scenarios;

-- 插入10个模拟场景
INSERT INTO app_simulation_scenarios (title, description, difficulty, category, cover_image, stages, learning_objectives, estimated_time, is_published)
SELECT * FROM (VALUES
    ('项目危机处理', '项目关键时期核心成员离职', 'Hard', 'Crisis', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', '[]'::jsonb, '["危机管理"]'::jsonb, 20, true),
    ('团队冲突调解', '技术路线之争影响团队', 'Medium', 'Team', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', '[]'::jsonb, '["团队管理"]'::jsonb, 15, true),
    ('客户变更管理', '需求频繁变更', 'Hard', 'Scope', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800', '[]'::jsonb, '["范围管理"]'::jsonb, 20, true),
    ('预算超支应对', '项目资金不足', 'Expert', 'Cost', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', '[]'::jsonb, '["成本管理"]'::jsonb, 25, true),
    ('进度延误恢复', '关键路径受阻', 'Medium', 'Schedule', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800', '[]'::jsonb, '["进度管理"]'::jsonb, 15, true),
    ('质量问题处理', '上线前发现严重缺陷', 'Hard', 'Quality', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', '[]'::jsonb, '["质量管理"]'::jsonb, 20, true),
    ('风险事件响应', '生产环境故障', 'Expert', 'Risk', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', '[]'::jsonb, '["风险管理"]'::jsonb, 25, true),
    ('供应商管理', '外包交付质量差', 'Medium', 'Vendor', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800', '[]'::jsonb, '["采购管理"]'::jsonb, 15, true),
    ('范围蔓延控制', '需求不断增加', 'Medium', 'Scope', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', '[]'::jsonb, '["范围控制"]'::jsonb, 15, true),
    ('沟通障碍解决', '跨部门协作困难', 'Easy', 'Communication', 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800', '[]'::jsonb, '["沟通管理"]'::jsonb, 10, true)
) AS v(title, description, difficulty, category, cover_image, stages, learning_objectives, estimated_time, is_published)
WHERE NOT EXISTS (SELECT 1 FROM app_simulation_scenarios WHERE title = v.title);

SELECT '10个模拟场景已插入（stages为空，请通过后台添加详细内容）' as status;
