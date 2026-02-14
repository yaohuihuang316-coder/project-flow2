# 知识图谱优化方案

## 当前问题
- 知识图谱数据展示不够直观
- 缺乏动态交互功能
- 学习路径不够清晰

## 优化方案

### 1. 可视化升级
- 使用 **3D Force Graph** 替代 2D 展示
- 添加节点大小表示知识点重要性
- 连线粗细表示知识点关联强度
- 颜色区分不同知识领域（范围/进度/成本/质量等）

### 2. 交互功能
- **点击节点**：显示知识点详情、学习资源、预计学习时间
- **拖拽节点**：自由调整图谱布局
- **缩放/平移**：支持手势操作
- **搜索定位**：快速找到特定知识点
- **路径高亮**：显示从当前节点到目标节点的学习路径

### 3. 学习路径规划
- **智能推荐**：根据用户已掌握的知识点，推荐下一步学习内容
- **最短路径算法**：计算达到认证目标的最快学习路径
- **难度曲线**：根据用户能力调整推荐路径难度

### 4. 数据完善
- 补充更多知识点节点（从18门课程提取）
- 建立知识点之间的前置依赖关系
- 添加每个知识点的学习资源链接（视频/文档/练习）

### 5. 游戏化元素
- 节点解锁动画
- 学习进度可视化（节点点亮效果）
- 成就徽章（完成知识模块获得）

## 技术实现建议

```typescript
// 推荐库
import ForceGraph3D from 'react-force-graph-3d';
// 或
import { SigmaContainer, useLoadGraph } from '@react-sigma/core';

// 数据结构优化
interface KnowledgeNode {
  id: string;
  label: string;
  category: 'Foundation' | 'Advanced' | 'Expert';
  difficulty: 1-5;
  estimatedHours: number;
  prerequisites: string[]; // 前置知识点ID
  resources: Resource[];
  masteryLevel: number; // 用户掌握程度 0-100
}

interface KnowledgeEdge {
  source: string;
  target: string;
  strength: number; // 关联强度
  type: 'prerequisite' | 'related' | 'extension';
}
```

## 分阶段实施

### 阶段1：基础优化（1周）
- 完善知识节点数据
- 添加前置依赖关系
- 优化2D可视化效果

### 阶段2：交互升级（2周）
- 实现节点点击详情
- 添加学习路径推荐
- 搜索定位功能

### 阶段3：高级功能（2周）
- 3D可视化（可选）
- AI学习路径规划
- 游戏化元素

## 是否需要开始实施？

请确认：
1. 是否接受此方案？
2. 是否需要立即开始实施？
3. 优先级是哪些功能？
