# ProjectFlow 演示环境搭建指南

## 1. 数据库初始化

### 1.1 执行完整 SQL 脚本
```bash
# 在 Supabase SQL Editor 中执行 db_complete.sql
```

### 1.2 添加 RPC 函数
在 Supabase 中执行 `db_functions.sql`：

```sql
-- 兑换码兑换函数
CREATE OR REPLACE FUNCTION redeem_membership_code(...)

-- 未读公告数
CREATE OR REPLACE FUNCTION get_unread_announcement_count(...)

-- 标记已读
CREATE OR REPLACE FUNCTION mark_announcement_read(...)
```

### 1.3 验证表结构
```sql
-- 检查所有表是否创建成功
SELECT table_name 
FROM information.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'app_%';

-- 应该返回 25 张表
```

---

## 2. 前端配置

### 2.1 环境变量
创建 `.env` 文件:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 2.2 安装依赖
```bash
npm install
```

### 2.3 启动开发服务器
```bash
npm run dev
```

---

## 3. 路由映射表

| 路由 | 页面组件 | 功能描述 | 权限要求 |
|------|----------|----------|----------|
| `/` | Login | 登录页 | 公开 |
| `/dashboard` | Dashboard | 个人仪表盘 | 登录用户 |
| `/learning` | LearningHub | 课程中心 | 登录用户 |
| `/classroom/:id` | Classroom | 课程学习 | 登录用户 |
| `/community` | Community | 社区 | 登录用户 |
| `/knowledge-graph` | KnowledgeGraph | 知识图谱 | 登录用户 |
| `/ai-assistant` | AIAssistant | AI助手 | 登录用户 |
| `/tools-lab` | ToolsLab | 工具实验室 | Pro+ |
| `/simulation` | Simulation | 实战模拟 | Pro+ |
| `/membership` | Membership | 会员中心 | 登录用户 |
| `/profile` | Profile | 个人资料 | 登录用户 |
| `/schedule` | Schedule | 日程 | 登录用户 |

### 管理后台路由
| 路由 | 页面组件 | 功能描述 | 权限要求 |
|------|----------|----------|----------|
| `/admin` | AdminDashboard | 管理仪表盘 | Manager+ |
| `/admin/users` | UserTable | 用户管理 | Manager+ |
| `/admin/content` | AdminContent | 内容管理 | Editor+ |
| `/admin/community` | AdminCommunity | 社区管理 | Manager+ |
| `/admin/announcements` | AdminAnnouncements | 公告管理 | Manager+ |
| `/admin/membership` | AdminMembership | 会员管理 | Manager+ |
| `/admin/simulation` | AdminSimulation | 模拟场景 | Manager+ |
| `/admin/analytics` | AdminAnalytics | 数据分析 | Manager+ |
| `/admin/system` | AdminSystem | 系统配置 | SuperAdmin |

---

## 4. 测试数据准备

### 4.1 必需数据
执行以下 SQL 确保测试数据存在：

```sql
-- 检查测试用户
SELECT * FROM app_users WHERE email LIKE '%@example.com';

-- 检查课程数据
SELECT COUNT(*) FROM app_courses;

-- 检查知识节点
SELECT COUNT(*) FROM app_kb_nodes;

-- 检查模拟场景
SELECT COUNT(*) FROM app_simulation_scenarios;
```

### 4.2 生成测试兑换码 (Admin使用)
```sql
-- 生成测试兑换码
INSERT INTO membership_codes (code, tier, duration_days, is_used) VALUES
('PF-PRO-TEST001', 'pro', 30, false),
('PF-PRO-TEST002', 'pro', 90, false),
('PF-PROPLUS-001', 'pro_plus', 30, false),
('PF-LIFETIME-01', 'pro_plus', 36500, false);
```

---

## 5. 功能验证清单

### 核心学习流程
```
1. 登录 → Dashboard
2. 进入 Learning Hub
3. 点击课程 → Classroom
4. 学习章节
5. 记录笔记
6. 标记完成
7. 查看知识图谱
8. 检查进度更新
```

### 会员升级流程
```
1. Free用户查看会员页面
2. 输入兑换码 PF-PRO-TEST001
3. 升级为 Pro
4. 访问 Tools Lab
5. 再次输入兑换码 PF-PROPLUS-001
6. 升级为 Pro+
7. 访问 Simulation
```

### 社区互动流程
```
1. 进入 Community
2. 发布帖子
3. 关注其他用户
4. 给帖子点赞
5. 添加评论
6. 搜索内容
```

### 管理后台流程
```
1. 管理员登录
2. 进入 Admin Dashboard
3. 创建公告
4. 管理用户等级
5. 创建模拟场景
6. 生成兑换码
7. 查看统计数据
```

---

## 6. 演示场景脚本

### 场景1: 新用户首次体验
1. 注册新账号
2. 浏览 Dashboard
3. 开始第一门课程
4. 记录学习笔记
5. 查看知识图谱
6. 发布社区帖子

### 场景2: 会员升级演示
1. 展示 Free 用户限制
2. 使用兑换码升级 Pro
3. 体验 Tools Lab
4. 再次升级 Pro+
5. 体验 Simulation
6. 导出 PDF 报告

### 场景3: 管理员运营
1. 登录管理员账号
2. 发布全站公告
3. 查看用户统计
4. 创建新的模拟场景
5. 生成批量兑换码
6. 导出数据报表

---

## 7. 故障排除

### 常见问题

#### 问题: 页面白屏
```
排查:
1. 检查浏览器控制台错误
2. 确认 Supabase 配置正确
3. 检查 env 文件
```

#### 问题: 403 权限错误
```
排查:
1. 检查用户角色
2. 检查 RLS 策略
3. 确认会员等级
```

#### 问题: 数据不显示
```
排查:
1. 检查网络请求
2. 确认表中有数据
3. 检查查询条件
```

---

## 8. 性能检查

### 加载性能
- [ ] Dashboard 首屏 < 3s
- [ ] 课程列表 < 2s
- [ ] 社区帖子 < 2s

### 交互性能
- [ ] 页面切换流畅
- [ ] 图表渲染不卡顿
- [ ] 动画帧率 > 30fps

---

**准备完毕，开始演示！**
