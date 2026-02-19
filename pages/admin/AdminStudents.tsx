import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { Search, Plus, Users, Mail, Shield, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AdminStudentsProps {
  currentUser?: UserProfile | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  department?: string;
  created_at: string;
}

const AdminStudents: React.FC<AdminStudentsProps> = ({ currentUser: _currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'Student')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('获取学生列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有学生账号信息</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus size={18} />
          <span>添加学生</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索姓名、邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
              <img
                src={student.avatar || `https://i.pravatar.cc/150?u=${student.id}`}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {student.email}
                  </span>
                  {student.department && (
                    <span className="text-blue-600">{student.department}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-lg text-xs ${
                  student.status === '正常' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {student.status}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs">
                  {student.role}
                </span>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
