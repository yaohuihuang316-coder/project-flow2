-- ==========================================
-- 社区功能更新
-- 1. 添加置顶字段
-- 2. 添加演示账号关注关系
-- ==========================================

-- 1. 给帖子表添加置顶字段
ALTER TABLE app_community_posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 2. 给演示账号添加关注关系
-- 先清空现有关注数据避免冲突
DELETE FROM app_user_follows 
WHERE follower_id IN ('test-free-001', 'test-pro-001', 'test-pp-001', 'test-teacher-001');

-- 插入关注关系
INSERT INTO app_user_follows (follower_id, following_id, created_at) VALUES
-- Free用户关注其他人
('test-free-001', 'test-pro-001', '2026-01-10 10:00:00'),
('test-free-001', 'test-pp-001', '2026-01-15 14:30:00'),
('test-free-001', 'test-teacher-001', '2026-01-20 09:00:00'),

-- Pro用户关注其他人
('test-pro-001', 'test-pp-001', '2026-01-05 08:00:00'),
('test-pro-001', 'test-teacher-001', '2026-01-12 16:00:00'),
('test-pro-001', 'test-admin-001', '2026-01-08 11:00:00'),

-- ProPlus用户关注其他人
('test-pp-001', 'test-teacher-001', '2026-01-03 10:00:00'),
('test-pp-001', 'test-admin-001', '2026-01-01 00:00:00'),

-- 教师关注其他人
('test-teacher-001', 'test-admin-001', '2026-01-01 09:00:00'),
('test-teacher-001', 'test-pp-001', '2026-01-10 14:00:00');

-- 3. 设置几条置顶帖子（管理员的公告类帖子）
UPDATE app_community_posts 
SET is_pinned = TRUE 
WHERE user_id = 'test-admin-001' 
AND id IN (
    SELECT id FROM app_community_posts 
    WHERE user_id = 'test-admin-001' 
    ORDER BY created_at DESC 
    LIMIT 2
);

-- 4. 验证数据
SELECT '关注关系统计' as info;
SELECT follower_id, COUNT(*) as following_count 
FROM app_user_follows 
GROUP BY follower_id;

SELECT '置顶帖子' as info;
SELECT id, user_name, content, is_pinned 
FROM app_community_posts 
WHERE is_pinned = TRUE;
