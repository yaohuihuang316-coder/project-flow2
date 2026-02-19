import React from 'react';
import { TrendingDown, Target, Award, BarChart3 } from 'lucide-react';

interface GradeStatsProps {
  submissions: {
    score?: number;
    status: string;
  }[];
  maxScore: number;
}

const GradeStats: React.FC<GradeStatsProps> = ({ submissions, maxScore }) => {
  const stats = React.useMemo(() => {
    const graded = submissions.filter(s => s.status === 'graded' && s.score !== undefined);
    const total = submissions.length;
    
    if (graded.length === 0) {
      return {
        maxScore: 0,
        minScore: 0,
        passRate: 0,
        distribution: [0, 0, 0, 0, 0],
        gradedCount: 0,
        total
      };
    }

    const scores = graded.map(s => s.score!);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passRate = (scores.filter(s => s >= maxScore * 0.6).length / scores.length) * 100;

    // 分数段分布
    const distribution = [
      scores.filter(s => s >= maxScore * 0.9).length, // 优秀 90-100
      scores.filter(s => s >= maxScore * 0.8 && s < maxScore * 0.9).length, // 良好 80-89
      scores.filter(s => s >= maxScore * 0.7 && s < maxScore * 0.8).length, // 中等 70-79
      scores.filter(s => s >= maxScore * 0.6 && s < maxScore * 0.7).length, // 及格 60-69
      scores.filter(s => s < maxScore * 0.6).length, // 不及格 <60
    ];

    return {
      maxScore: max,
      minScore: min,
      passRate: passRate.toFixed(1),
      distribution,
      gradedCount: graded.length,
      total
    };
  }, [submissions, maxScore]);

  const getBarColor = (index: number) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
    return colors[index] || 'bg-gray-500';
  };

  const getLabel = (index: number) => {
    const labels = ['优秀(90+)', '良好(80-89)', '中等(70-79)', '及格(60-69)', '不及格(<60)'];
    return labels[index];
  };

  const maxDistribution = Math.max(...stats.distribution, 1);

  return (
    <div className="space-y-6">
      {/* 主要统计卡片 - 移除与父组件重复的"平均分"和"已批改" */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.passRate}%</p>
              <p className="text-xs text-gray-500">及格率</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.maxScore}</p>
              <p className="text-xs text-gray-500">最高分</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.minScore}</p>
              <p className="text-xs text-gray-500">最低分</p>
            </div>
          </div>
        </div>
      </div>

      {/* 分数分布图表 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" />
          分数分布
        </h4>
        
        <div className="space-y-3">
          {stats.distribution.map((count, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20">{getLabel(index)}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(index)} transition-all duration-500`}
                  style={{ width: `${(count / maxDistribution) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-8 text-right">
                {count}人
              </span>
            </div>
          ))}
        </div>

        {stats.gradedCount === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>暂无批改数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeStats;
