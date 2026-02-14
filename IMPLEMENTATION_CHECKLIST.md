# 实施检查清单

## 已完成的修复

### 数据库修复 (db_fixes.sql)
- [x] 修复公告表 RLS 策略
- [x] 创建 app_tools 表
- [x] 创建 app_user_badges 表
- [x] 创建 app_user_skills 表
- [x] 确保 app_activity_logs 表存在

### 前端修复
- [x] 修复 AdminAnnouncements.tsx 保存逻辑
- [x] 重命名 AdminLayout 菜单（模拟场景 → 实战项目）

### 测试数据 (db_seed_data.sql)
- [x] Free 用户数据（3门课程，3天streak）
- [x] Pro 用户数据（7门课程，15天streak）
- [x] Pro+ 用户数据（12门课程，30天streak）
- [x] 徽章数据
- [x] 技能数据（雷达图）
- [x] 活动日志（热力图）
- [x] 模拟场景完成记录
- [x] 社区帖子
- [x] AI使用记录

---

## 待执行的数据库脚本

### 第一步：执行结构修复
```bash
# 在 Supabase SQL Editor 中执行:
\i db_fixes.sql
```

### 第二步：插入测试数据
```bash
# 在 Supabase SQL Editor 中执行:
\i db_seed_data.sql
```

---

## 测试账号登录信息

| 账号 | 邮箱 | 密码 | 角色 | 会员等级 |
|------|------|------|------|----------|
| Free用户 | free@test.com | test123 | Student | free |
| Pro用户 | pro@test.com | test123 | Student | pro |
| Pro+用户 | pp@test.com | test123 | Student | pro_plus |
| 管理员 | admin@test.com | admin123 | SuperAdmin | pro_plus |

---

## 各账号数据预览

### Free用户 (free@test.com)
- **Dashboard**: 显示3天streak，2门进行中课程，1门完成
- **Profile**: 3个徽章，基础技能值(40-65分)
- **社区**: 1条帖子

### Pro用户 (pro@test.com)
- **Dashboard**: 显示15天streak，7门课程进度
- **Profile**: 2个徽章，进阶技能值(95-120分)
- **ToolsLab**: 可访问所有Pro工具
- **社区**: 1条帖子

### Pro+用户 (pp@test.com)
- **Dashboard**: 显示30天streak，12门课程进度
- **Profile**: 5个徽章，高级技能值(125-148分)
- **ToolsLab**: 可访问所有工具
- **Simulation**: 已完成1个模拟场景(85分)
- **社区**: 1条帖子

---

## 验证步骤

### 1. 登录测试
- [ ] Free用户登录后跳转到Dashboard（不是Admin）
- [ ] Pro用户登录后跳转到Dashboard
- [ ] 管理员登录后跳转到Admin Dashboard

### 2. Dashboard验证
- [ ] Free用户：显示3天streak，热力图有3天数据
- [ ] Pro用户：显示15天streak，热力图有15天数据
- [ ] Pro+用户：显示30天streak，热力图有30天数据

### 3. Profile页面验证
- [ ] 热力图显示真实活动数据
- [ ] 雷达图显示6个技能的真实分值
- [ ] 徽章显示已解锁的徽章
- [ ] 证书显示已完成的课程

### 4. 会员升级验证
- [ ] Free用户输入 PF-PRO-2024 升级为Pro
- [ ] Pro用户输入 PF-PLUS-2024 升级为Pro+

### 5. 公告发布验证
- [ ] 管理员发布新公告成功
- [ ] 用户端收到公告通知

---

## 下一步前端开发

### 需要创建的文件
1. **pages/admin/AdminTools.tsx** - 工具管理页面
2. **pages/ToolsLab.tsx 优化** - 添加返回键
3. **pages/Profile.tsx 优化** - 使用真实数据查询

### 需要修改的文件
1. **pages/Simulation.tsx** - 检查完整性
2. **App.tsx** - 确保路由正确

---

## 执行命令

```bash
# 1. 安装依赖（如有新依赖）
npm install

# 2. 类型检查
npx tsc --noEmit

# 3. 启动开发服务器
npm run dev

# 4. 在浏览器中测试
# http://localhost:5173
```

---

**开始时间:** 2026-02-14
**预计完成:** 2026-02-14
