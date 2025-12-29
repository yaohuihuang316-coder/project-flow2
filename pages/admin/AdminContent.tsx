import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, BookOpen, Clock, Tag, Eye, FileText, Archive, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import CourseBuilder from './CourseBuilder';
import { supabase } from '../../lib/supabaseClient';

const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'labs' | 'projects'>('courses');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [contentData, setContentData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  // --- Fetch from Supabase ---
  const fetchContent = async () => {
    setIsLoading(true);
    try {
      // 使用 'app_courses' 而不是 'Course'
      const { data, error } = await supabase
        .from('app_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content:', error.message || JSON.stringify(error));
        setContentData([]);
      } else if (data && data.length > 0) {
        const mappedData = data.map(item => ({
          ...item,
          lastUpdate: item.last_update || (item.created_at ? item.created_at.split('T')[0] : 'N/A'),
        }));
        setContentData(mappedData);
      } else {
        setContentData([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching content:', err);
      setContentData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // --- Logic ---
  const filteredData = contentData.filter(item => {
      // Logic adjustment: Currently Database only stores 'Course', 'Cert', 'Official' which are all technically 'courses' type in this admin view.
      // If user wants to differentiate, they need to add a 'type' column or map 'category' to these tabs.
      // For now, we assume everything in DB is a course unless specified.
      const matchTab = activeTab === 'courses' ? true : false; // Temporarily show all under courses for demo simplicity if type col missing
      
      const matchSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.author || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'All' || item.status === filterStatus;
      return matchSearch && matchStatus;
  });

  const getStatusStyle = (status: string) => {
      switch(status) {
          case 'Published': return 'bg-green-50 text-green-700 border-green-200';
          case 'Draft': return 'bg-gray-100 text-gray-500 border-gray-200';
          case 'Review': return 'bg-orange-50 text-orange-600 border-orange-200';
          case 'Archived': return 'bg-purple-50 text-purple-600 border-purple-200';
          default: return 'bg-gray-100 text-gray-500';
      }
  };

  const getIcon = (type: string) => {
      if (type === 'courses') return <BookOpen size={20}/>;
      if (type === 'labs') return <Tag size={20}/>;
      return <Clock size={20}/>;
  };

  const handleSaveContent = async (formData: any) => {
      const newItem = {
          ...formData,
          id: editingCourse ? editingCourse.id : `new-${Date.now()}`,
          type: activeTab,
          views: editingCourse ? editingCourse.views : 0,
          last_update: new Date().toISOString().split('T')[0],
      };

      try {
        // 使用 'app_courses' 表
        const { error } = await supabase.from('app_courses').upsert({
           id: newItem.id.toString(), 
           title: newItem.title,
           author: newItem.author,
           // type: newItem.type, // Remove if DB doesn't have type column yet
           status: newItem.status,
           category: newItem.category,
           views: newItem.views,
           last_update: newItem.last_update,
           chapters: newItem.chapters // Ensure chapters are saved
        });
  
        if (!error) {
          fetchContent(); // Refresh from server
        } else {
          console.error("Failed to save to DB (Table: app_courses):", error.message || JSON.stringify(error));
        }
      } catch (err) {
        console.error("Unexpected error saving content:", err);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in min-h-[600px] relative">
      
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            内容资源管理 (CMS)
            {isLoading && <Loader2 size={18} className="animate-spin text-gray-400"/>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理全平台的学习资源生命周期</p>
        </div>
        <button 
            onClick={() => { setEditingCourse(null); setIsBuilderOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> 新建内容
        </button>
      </div>

      {/* --- Tab Switcher --- */}
      <div className="bg-white p-1 rounded-xl border border-gray-200 inline-flex shadow-sm">
        {[
          { id: 'courses', label: '体系课程 (Courses)' },
          { id: 'labs', label: '核心算法 (Labs)' },
          { id: 'projects', label: '实战项目 (Projects)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-gray-100 text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Toolbar --- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索标题、讲师或 ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
             {['All', 'Published', 'Draft', 'Review', 'Archived'].map(status => (
                 <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-colors ${
                        filterStatus === status
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                 >
                     {status}
                 </button>
             ))}
        </div>
      </div>

      {/* --- Data Grid --- */}
      <div className="grid grid-cols-1 gap-4">
        {filteredData.length > 0 ? filteredData.map(item => (
          <div 
            key={item.id} 
            onClick={() => { setEditingCourse(item); setIsBuilderOpen(true); }}
            className="group bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Status Indicator Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                item.status === 'Published' ? 'bg-green-500' : 
                item.status === 'Review' ? 'bg-orange-500' :
                item.status === 'Archived' ? 'bg-purple-500' : 'bg-gray-300'
            }`}></div>

            <div className="flex items-center gap-5 pl-3">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                 {getIcon('courses')}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{item.id}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {item.author}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{item.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-8 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end pl-3 sm:pl-0">
              <div className="text-right">
                 <div className="text-sm font-bold text-gray-900 flex items-center justify-end gap-1">
                    <Eye size={14} className="text-gray-400"/> {(item.views || 0).toLocaleString()}
                 </div>
                 <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Views</div>
              </div>

              <div className="text-right">
                 <div className="text-sm font-bold text-gray-900">{item.lastUpdate}</div>
                 <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Last Edit</div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(item.status)}`}>
                {item.status === 'Published' && <CheckCircle size={12}/>}
                {item.status === 'Review' && <AlertCircle size={12}/>}
                {item.status === 'Archived' && <Archive size={12}/>}
                {item.status === 'Draft' && <FileText size={12}/>}
                {item.status}
              </div>

              <button className="p-2 text-gray-300 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        )) : (
            <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Search size={24} className="text-gray-300"/>
                </div>
                <p className="text-gray-900 font-bold">暂无内容数据</p>
                <p className="text-sm text-gray-500 mt-1">请点击右上方“新建内容”或检查 Supabase 连接。</p>
                <button 
                    onClick={() => { setSearchTerm(''); setFilterStatus('All'); fetchContent(); }}
                    className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                    <RefreshCw size={12}/> 刷新列表
                </button>
            </div>
        )}
      </div>

      {/* --- Builder Drawer --- */}
      <CourseBuilder 
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        course={editingCourse}
        onSave={handleSaveContent}
      />
    </div>
  );
};

export default AdminContent;