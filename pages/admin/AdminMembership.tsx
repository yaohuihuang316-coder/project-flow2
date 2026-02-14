
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Trash2, RefreshCw,
  CheckCircle2, XCircle, Loader2, Gift, Download,
  ChevronLeft, ChevronRight, Copy
} from 'lucide-react';
import { MembershipTier, MembershipCode, MembershipStats } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { MEMBERSHIP_CONFIG } from '../../lib/membership';

// 用户会员信息
interface UserMembership {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  membershipTier: MembershipTier;
  membershipExpiresAt?: string;
  completedCoursesCount: number;
  createdAt: string;
}

const AdminMembership: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'codes'>('users');
  const [users, setUsers] = useState<UserMembership[]>([]);
  const [codes, setCodes] = useState<MembershipCode[]>([]);
  const [stats, setStats] = useState<MembershipStats>({
    totalUsers: 0,
    freeUsers: 0,
    basicUsers: 0, // legacy field, kept for type compatibility
    proUsers: 0,
    proPlusUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<MembershipTier | 'all'>('all');
  const [codeStatusFilter, setCodeStatusFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [codeTierFilter, setCodeTierFilter] = useState<MembershipTier | 'all'>('all');
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // 生成兑换码弹窗
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    tier: 'pro' as MembershipTier,
    count: 10,
    durationDays: 30,
    prefix: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // 获取数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 获取用户列表
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, avatar, subscription_tier, membership_expires_at, completed_courses_count, created_at')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      
      if (usersData) {
        const formattedUsers: UserMembership[] = usersData.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          membershipTier: u.subscription_tier || 'free',
          membershipExpiresAt: u.membership_expires_at,
          completedCoursesCount: u.completed_courses_count || 0,
          createdAt: u.created_at
        }));
        setUsers(formattedUsers);
        
        // 计算统计 (3-tier system: free/pro/pro_plus)
        setStats({
          totalUsers: formattedUsers.length,
          freeUsers: formattedUsers.filter(u => u.membershipTier === 'free').length,
          basicUsers: 0,
          proUsers: formattedUsers.filter(u => u.membershipTier === 'pro').length,
          proPlusUsers: formattedUsers.filter(u => u.membershipTier === 'pro_plus').length
        });
      }
      
      // 获取兑换码
      const { data: codesData } = await supabase
        .from('membership_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (codesData) {
        setCodes(codesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || user.membershipTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // 筛选兑换码
  const filteredCodes = codes.filter(code => {
    const matchesStatus = codeStatusFilter === 'all' 
      ? true 
      : codeStatusFilter === 'used' ? code.isUsed : !code.isUsed;
    const matchesTier = codeTierFilter === 'all' || code.tier === codeTierFilter;
    return matchesStatus && matchesTier;
  });

  // 分页
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 生成结果展示
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);

  // 生成兑换码
  const handleGenerateCodes = async () => {
    setIsGenerating(true);
    try {
      const newCodes: string[] = [];
      const prefix = generateForm.prefix ? generateForm.prefix.toUpperCase() + '-' : 'PF-';
      for (let i = 0; i < generateForm.count; i++) {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `${prefix}${randomPart}`;
        newCodes.push(code);
      }
      
      // 批量插入
      const { error } = await supabase
        .from('membership_codes')
        .insert(newCodes.map(code => ({
          code,
          tier: generateForm.tier,
          duration_days: generateForm.durationDays,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 兑换码本身1年有效期
        })));
      
      if (error) throw error;
      
      // 刷新列表
      fetchData();
      setShowGenerateModal(false);
      setGeneratedCodes(newCodes);
      setShowResultModal(true);
    } catch (error) {
      console.error('Failed to generate codes:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 删除兑换码
  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('确定要删除此兑换码吗？')) return;
    
    try {
      const { error } = await supabase
        .from('membership_codes')
        .delete()
        .eq('id', codeId);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Failed to delete code:', error);
    }
  };

  // 手动调整用户会员等级
  const handleUpdateUserTier = async (userId: string, newTier: MembershipTier) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ 
          subscription_tier: newTier,
          membership_expires_at: newTier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Failed to update user tier:', error);
    }
  };

  // 导出兑换码（支持筛选后的结果）
  const handleExportCodes = (exportAll: boolean = false) => {
    const codesToExport = exportAll ? codes : filteredCodes;
    const csvContent = [
      '兑换码,等级,有效期,状态,使用者,使用时间',
      ...codesToExport.map(c => 
        `${c.code},${c.tier},${c.durationDays === 36500 ? '永久' : c.durationDays + '天'},${c.isUsed ? '已使用' : '未使用'},${c.usedBy || '-'},${c.usedAt ? new Date(c.usedAt).toLocaleString() : '-'}`
      )
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `membership_codes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会员管理</h1>
          <p className="text-gray-500 mt-1">管理用户会员等级和兑换码</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
          >
            <Plus size={18} />
            生成兑换码
          </button>
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总用户', value: stats.totalUsers, color: 'bg-gray-500' },
          { label: 'Free', value: stats.freeUsers, color: 'bg-gray-400' },
          { label: 'Pro', value: stats.proUsers, color: 'bg-purple-500' },
          { label: 'Pro+', value: stats.proPlusUsers, color: 'bg-amber-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className={`w-8 h-8 ${stat.color} rounded-xl flex items-center justify-center text-white text-xs font-bold mb-2`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'users', label: '用户管理', icon: Users },
          { id: 'codes', label: '兑换码', icon: Gift },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">全部等级</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro+</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">用户</th>
                  <th className="text-left p-4 font-medium text-gray-600">当前等级</th>
                  <th className="text-left p-4 font-medium text-gray-600">到期时间</th>
                  <th className="text-center p-4 font-medium text-gray-600">完成课程</th>
                  <th className="text-right p-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      <Loader2 size={24} className="mx-auto animate-spin mb-2" />
                      加载中...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => (
                    <tr key={user.id} className="border-t border-gray-100">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0) || user.email?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name || '未命名'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          MEMBERSHIP_CONFIG[user.membershipTier]?.gradient || 'bg-gray-100 text-gray-700'
                        } text-white`}>
                          {MEMBERSHIP_CONFIG[user.membershipTier]?.name || user.membershipTier}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {user.membershipExpiresAt 
                          ? new Date(user.membershipExpiresAt).toLocaleDateString('zh-CN')
                          : '-'
                        }
                      </td>
                      <td className="p-4 text-center text-sm text-gray-600">
                        {user.completedCoursesCount} 门
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={user.membershipTier}
                          onChange={(e) => handleUpdateUserTier(user.id, e.target.value as MembershipTier)}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="pro_plus">Pro+</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                共 {filteredUsers.length} 条记录，第 {currentPage}/{totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={codeStatusFilter}
              onChange={(e) => setCodeStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="unused">未使用</option>
              <option value="used">已使用</option>
            </select>
            <select
              value={codeTierFilter}
              onChange={(e) => setCodeTierFilter(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="all">全部等级</option>
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro+</option>
            </select>
            <div className="flex-1"></div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportCodes(false)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm"
                title="导出当前筛选结果"
              >
                <Download size={18} />
                导出筛选结果
              </button>
              <button
                onClick={() => handleExportCodes(true)}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl text-sm"
                title="导出全部兑换码"
              >
                <Download size={18} />
                导出全部
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            共 {filteredCodes.length} 个兑换码
            {codeStatusFilter !== 'all' && ` (${codeStatusFilter === 'used' ? '已使用' : '未使用'})`}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">兑换码</th>
                  <th className="text-left p-4 font-medium text-gray-600">等级</th>
                  <th className="text-left p-4 font-medium text-gray-600">有效期</th>
                  <th className="text-center p-4 font-medium text-gray-600">状态</th>
                  <th className="text-left p-4 font-medium text-gray-600">使用者</th>
                  <th className="text-right p-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {codes.length === 0 ? '暂无兑换码，点击右上角生成' : '没有找到符合条件的兑换码'}
                    </td>
                  </tr>
                ) : (
                  filteredCodes.map(code => (
                    <tr key={code.id} className="border-t border-gray-100">
                      <td className="p-4 font-mono text-sm">{code.code}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          MEMBERSHIP_CONFIG[code.tier]?.gradient || 'bg-gray-100'
                        } text-white`}>
                          {MEMBERSHIP_CONFIG[code.tier]?.name}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {code.durationDays === 36500 ? '永久' : `${code.durationDays} 天`}
                      </td>
                      <td className="p-4 text-center">
                        {code.isUsed ? (
                          <span className="flex items-center justify-center gap-1 text-green-600 text-sm">
                            <CheckCircle2 size={14} /> 已使用
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                            <XCircle size={14} /> 未使用
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {code.usedBy ? (
                          <span>{code.usedAt ? new Date(code.usedAt).toLocaleDateString() : '-'}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!code.isUsed && (
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">生成兑换码</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会员等级</label>
                <select
                  value={generateForm.tier}
                  onChange={(e) => setGenerateForm({...generateForm, tier: e.target.value as MembershipTier})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pro">Pro</option>
                  <option value="pro_plus">Pro+</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">生成数量</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={generateForm.count}
                  onChange={(e) => setGenerateForm({...generateForm, count: parseInt(e.target.value) || 1})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">有效期</label>
                <select
                  value={generateForm.durationDays}
                  onChange={(e) => setGenerateForm({...generateForm, durationDays: parseInt(e.target.value) || 30})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={7}>7天</option>
                  <option value={30}>30天</option>
                  <option value={90}>90天</option>
                  <option value={365}>1年</option>
                  <option value={36500}>永久</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">前缀（可选）</label>
                <input
                  type="text"
                  placeholder="如: PRO-"
                  value={generateForm.prefix}
                  onChange={(e) => setGenerateForm({...generateForm, prefix: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
              >
                取消
              </button>
              <button
                onClick={handleGenerateCodes}
                disabled={isGenerating}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating && <Loader2 size={18} className="animate-spin" />}
                {isGenerating ? '生成中...' : '确认生成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">生成成功！</h3>
                <p className="text-sm text-gray-500">共生成 {generatedCodes.length} 个兑换码</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="space-y-2">
                {generatedCodes.map((code, idx) => (
                  <div key={idx} className="font-mono text-sm bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                    <span>{code}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      复制
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCodes.join('\n'));
                  alert('已复制全部到剪贴板');
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                复制全部
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembership;
