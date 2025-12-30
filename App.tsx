
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MobileTabbar from './components/MobileTabbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LearningHub from './pages/LearningHub';
import Classroom from './pages/Classroom';
import Community from './pages/Community'; // New Import
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Simulation from './pages/Simulation';
// Admin Imports
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserTable from './pages/admin/UserTable';
import AdminContent from './pages/admin/AdminContent';
import AdminSettings from './pages/admin/AdminSettings';
import AdminMonitor from './pages/admin/AdminMonitor';
import { Page, UserProfile } from './types';

const App: React.FC = () => {
  // 1. 全局导航状态管理
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  // 新增：课程 ID 状态
  const [currentCourseId, setCurrentCourseId] = useState<string>('default');
  
  // 2. 用户身份状态 (Persisted User State)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // 核心跳转逻辑
  const navigateTo = (page: Page, secondaryId?: string) => {
    if (secondaryId) {
      setCurrentCourseId(secondaryId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 辅助函数：判断是否为后台页面
  const isAdminPage = (page: Page) => {
    return page.toString().startsWith('ADMIN_');
  };

  // 辅助函数：判断是否为沉浸式全屏页面（不显示导航栏）
  const isImmersivePage = (page: Page) => {
      return page === Page.LOGIN || page === Page.KNOWLEDGE_GRAPH || page === Page.SIMULATION;
  };

  // 3. 登录处理
  const handleLogin = (user: UserProfile) => {
      setCurrentUser(user);
      // 如果是管理员，去后台；否则去仪表盘
      if (['SuperAdmin', 'Manager', 'Editor'].includes(user.role)) {
          setCurrentPage(Page.ADMIN_DASHBOARD);
      } else {
          setCurrentPage(Page.DASHBOARD);
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentPage(Page.LOGIN);
  };

  // 4. 动态组件渲染器
  const renderPage = () => {
    // 优先处理后台页面
    if (isAdminPage(currentPage)) {
      return (
        <AdminLayout 
          currentPage={currentPage} 
          setPage={setCurrentPage} 
          currentUser={currentUser} // Pass actual user
          onLogout={handleLogout}
        >
          {currentPage === Page.ADMIN_DASHBOARD && <AdminDashboard />}
          {currentPage === Page.ADMIN_USERS && <UserTable currentRole={currentUser?.role || 'SuperAdmin'} />}
          {currentPage === Page.ADMIN_CONTENT && <AdminContent />}
          {currentPage === Page.ADMIN_SETTINGS && <AdminSettings />}
          {currentPage === Page.ADMIN_MONITOR && <AdminMonitor />}
        </AdminLayout>
      );
    }

    // 前台页面
    switch (currentPage) {
      case Page.LOGIN:
        return <Login onLogin={handleLogin} />;
      case Page.DASHBOARD:
        return <Dashboard onNavigate={navigateTo} currentUser={currentUser} />;
      case Page.LEARNING:
        return <LearningHub onNavigate={navigateTo} currentUser={currentUser} />;
      case Page.COMMUNITY:
        return <Community currentUser={currentUser} />;
      case Page.CLASSROOM:
        return <Classroom courseId={currentCourseId} currentUser={currentUser} />;
      case Page.PROFILE:
        return <Profile currentUser={currentUser} onLogout={handleLogout} />;
      case Page.SCHEDULE:
        return <Schedule currentUser={currentUser} />;
      case Page.KNOWLEDGE_GRAPH:
        return <KnowledgeGraph onBack={() => navigateTo(Page.DASHBOARD)} onNavigate={navigateTo} />;
      case Page.SIMULATION:
        return <Simulation onBack={() => navigateTo(Page.DASHBOARD)} currentUser={currentUser} />;
      default:
        return <Dashboard onNavigate={navigateTo} currentUser={currentUser} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900 ${isAdminPage(currentPage) ? 'bg-[#F5F5F7]' : 'bg-[#F5F5F7]'}`}>
      
      {/* Desktop Navbar (Hidden on Mobile) */}
      {!isAdminPage(currentPage) && !isImmersivePage(currentPage) && (
        <div className="hidden md:block">
            <Navbar 
                currentPage={currentPage} 
                setPage={setCurrentPage} 
                currentUser={currentUser}
                onLogout={handleLogout}
            />
        </div>
      )}
      
      {/* Mobile Tabbar (Hidden on Desktop & Immersive Pages) */}
      {!isAdminPage(currentPage) && !isImmersivePage(currentPage) && (
          <MobileTabbar currentPage={currentPage} setPage={setCurrentPage} />
      )}
      
      {/* Content Container - Add bottom padding on mobile for tabbar space */}
      <main className={`w-full min-h-screen relative ${!isAdminPage(currentPage) && !isImmersivePage(currentPage) ? 'pb-20 md:pb-0' : ''}`}>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
