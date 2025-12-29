import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, Trash2, Plus, CheckSquare, Square, Download, Shield, Loader2 } from 'lucide-react';
import { AdminRole } from '../../types';
import UserDrawer from './UserDrawer';
import { supabase } from '../../lib/supabaseClient';

interface UserTableProps {
  currentRole: AdminRole;
}

const UserTable: React.FC<UserTableProps> = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- 核心修改：从 Supabase 获取数据 ---
  const fetchUsers = async () => {
    setIsLoading(true);
    // 查询 'app_users' 表的所有数据 (使用了更安全的表名)
    const { data, error } = await supabase
      .from('app_users') 
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      // Quiet fail or show mock data if DB not ready
      if (error.code === '42P01') { // undefined_table
          showToast('表 app_users 不存在，请在 Supabase 创建', 'error');
      } else {
          showToast('获取用户失败 (检查 .env 配置)', 'error');
      }
    } else {
      const mappedUsers = data?.map(u => ({
        ...u,
        name: u.name || u.email.split('@')[0], 
        status: u.status || '正常', 
        joined: new Date(u.created_at).toLocaleDateString()
      })) || [];
      setUsers(mappedUsers);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => u.id));
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleDelete = async (id: string) => {
      if(!window.confirm('确定删除此用户吗?')) return;
      
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      
      if (error) {
          showToast('删除失败', 'error');
      } else {
          setUsers(users.filter(u => u.id !== id));
          showToast('用户已删除');
      }
  };

  const handleSaveUser = async (userData: any) => {
      // Upsert logic
      const { error } = await supabase.from('app_users').upsert({
          id: userData.id, // If ID exists update, else insert
          email: userData.email,
          name: userData.name,
          role: userData.role,
          status: userData.status,
          department: userData.department
      });

      if (error) {
          console.error(error);
          showToast('保存失败', 'error');
      } else {
          fetchUsers();
          showToast('保存成功');
      }
  };

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative min-h-[600px]">
      
      {/* Toast Notification */}
      {toast && (
          <div className={`fixed top-24 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-sm animate-bounce-in ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-black text-white'
          }`}>
              {toast.type === 'error' ? <Shield size={16}/> : <CheckSquare size={16}/>}
              {toast.msg}
          </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索用户姓名或邮箱..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
            <Filter size={16} /> 筛选
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
            <Download size={16} /> 导出
          </button>
          <button 
            onClick={() => { setEditingUser(null); setIsDrawerOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Plus size={16} /> 添加用户
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                <th className="py-4 px-6 w-12">
                  <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                    {selectedIds.length > 0 && selectedIds.length === users.length ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                  </button>
                </th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">用户 (User)</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">角色 (Role)</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">状态 (Status)</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">加入时间 (Joined)</th>
                <th className="py-4 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <button onClick={() => handleSelect(user.id)} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.includes(user.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover"/> : user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                      user.role === '管理员' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      user.role === '经理' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {user.role === '管理员' && <Shield size={10} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.status === '正常' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm font-medium text-gray-600">{user.status}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                    {user.joined}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingUser(user); setIsDrawerOpen(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                          {isLoading ? (
                              <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="animate-spin text-blue-500" />
                                  <span>正在同步数据库...</span>
                              </div>
                          ) : (
                              <span>暂无数据，请尝试创建新用户 (Need Table: app_users)</span>
                          )}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Visual Only) */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Showing {filteredUsers.length} of {users.length} users</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-bold border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 text-xs font-bold border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
            </div>
        </div>
      </div>

      {/* Drawer */}
      <UserDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UserTable;