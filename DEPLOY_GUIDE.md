# ProjectFlow 部署指南

## 方式一：Vercel 部署（推荐）

### 1. 准备代码
```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "update features"
git push origin main
```

### 2. Vercel 部署步骤
1. 访问 https://vercel.com
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置环境变量：
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MOONSHOT_API_KEY=your_moonshot_key
   ```
5. 点击 Deploy

### 3. 访问链接
部署成功后，Vercel 会提供类似：
```
https://project-flow2.vercel.app
```

---

## 方式二：本地运行

```bash
npm install
npm run dev
```

然后访问：http://localhost:5173

---

## 当前线上版本

如果你的项目已经部署到 Vercel，访问链接通常是：
**`https://project-flow2.vercel.app`**

需要我帮你检查具体配置吗？
