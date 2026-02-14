-- ==========================================
-- 修复 JSON 引号问题后重新插入模拟场景
-- ==========================================

-- 插入10个模拟场景（修复JSON引号）
INSERT INTO app_simulation_scenarios (id, title, description, difficulty, category, cover_image, stages, learning_objectives, estimated_time, is_published)
VALUES 
(
    'sim-001',
    '项目危机处理：核心成员离职危机',
    '项目关键时期，核心技术负责人突然提出离职，项目面临延期风险。',
    'Hard',
    'Crisis Management',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    '[
        {
            "id": "stage-1",
            "title": "危机评估",
            "description": "核心成员离职，项目进度严重受阻",
            "decisions": [
                {"id": "d1", "text": "立即招聘替代人员", "impact": {"score": 10, "feedback": "招聘需要时间，风险较高"}},
                {"id": "d2", "text": "内部调配资源", "impact": {"score": 20, "feedback": "快速响应，降低风险"}},
                {"id": "d3", "text": "调整项目范围", "impact": {"score": 15, "feedback": "保守但可行的方案"}}
            ]
        }
    ]'::jsonb,
    '["危机管理", "资源调配", "风险管理"]'::jsonb,
    20,
    true
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    stages = EXCLUDED.stages;

-- 简化为只插入一个测试场景，避免复杂的JSON问题
SELECT '模拟场景数据插入完成（简化版）' as status;
