# API 文档

## Supabase API

### 认证

#### 登录
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

#### 注册
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

#### 登出
```typescript
await supabase.auth.signOut();
```

### 数据库操作

#### 课程相关

**获取课程列表**
```typescript
const { data } = await supabase
  .from('app_courses')
  .select('*')
  .eq('is_published', true)
  .order('created_at', { ascending: false });
```

**获取课程详情**
```typescript
const { data } = await supabase
  .from('app_courses')
  .select('*')
  .eq('id', courseId)
  .single();
```

**获取用户课程进度**
```typescript
const { data } = await supabase
  .from('app_course_progress')
  .select('*')
  .eq('user_id', userId)
  .eq('course_id', courseId)
  .single();
```

#### 模拟场景

**获取场景列表**
```typescript
const { data } = await supabase
  .from('app_simulation_scenarios')
  .select('*')
  .eq('is_published', true);
```

**获取用户模拟进度**
```typescript
const { data } = await supabase
  .from('app_simulation_progress')
  .select('*')
  .eq('user_id', userId)
  .eq('scenario_id', scenarioId)
  .single();
```

**保存模拟进度**
```typescript
const { data } = await supabase
  .from('app_simulation_progress')
  .upsert({
    user_id: userId,
    scenario_id: scenarioId,
    current_stage: stage,
    decisions_made: decisions,
    score: score,
    status: status
  });
```

#### 用户数据

**获取用户技能**
```typescript
const { data } = await supabase
  .from('app_user_skills')
  .select('*')
  .eq('user_id', userId)
  .single();
```

**获取学习活动**
```typescript
const { data } = await supabase
  .from('app_learning_activity')
  .select('*')
  .eq('user_id', userId)
  .gte('activity_date', '2024-01-01');
```

**获取用户徽章**
```typescript
const { data } = await supabase
  .from('app_user_achievements')
  .select('*, app_achievements(*)')
  .eq('user_id', userId);
```

## 第三方 API

### Kimi (Moonshot) API

用于生成模拟演练报告。

```typescript
const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    model: 'moonshot-v1-8k',
    messages: [
      { role: 'system', content: '系统提示' },
      { role: 'user', content: '用户输入' }
    ],
    temperature: 0.7
  })
});
```

## 自定义函数

### 记录学习活动
```typescript
// 调用数据库函数
const { data } = await supabase.rpc('record_learning_activity', {
  p_user_id: userId,
  p_activity_type: 'course',
  p_xp_earned: 50,
  p_details: { course_name: 'PM基础' }
});
```

### 计算用户技能
```typescript
// 重新计算技能评分
const { data } = await supabase.rpc('calculate_user_skills', {
  p_user_id: userId
});
```

### 检查徽章解锁
```typescript
// 检查并解锁新徽章
const { data } = await supabase.rpc('check_and_unlock_achievements', {
  p_user_id: userId
});
```

## 错误处理

```typescript
try {
  const { data, error } = await supabase
    .from('app_courses')
    .select('*');
  
  if (error) throw error;
  
  return data;
} catch (error) {
  console.error('API Error:', error.message);
  // 处理错误
}
```

## 订阅实时更新

```typescript
// 监听课程进度变化
const subscription = supabase
  .channel('progress_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'app_course_progress' },
    (payload) => {
      console.log('Progress updated:', payload);
    }
  )
  .subscribe();
```
