
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MobileTabbar from './components/MobileTabbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LearningHub from './pages/LearningHub';
import Classroom from './pages/Classroom';
import Community from './pages/Community';
import AiAssistant from './pages/AiAssistant';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import KnowledgeGraphV2 from './pages/KnowledgeGraphV2'; // 新版知识图谱
import LearningPath from './pages/LearningPath'; // 学习路径页面
import Simulation from './pages/Simulation';
import ToolsLab from './pages/ToolsLab';
import Membership from './pages/Membership'; // 会员中心
import Payment from './pages/Payment'; // 支付页面
import TeacherDashboard from './pages/TeacherDashboard'; // 教师端
import MembershipGuard from './components/MembershipGuard';
// Admin Imports
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserTable from './pages/admin/UserTable';
import AdminProgress from './pages/admin/AdminProgress';
import AdminContent from './pages/admin/AdminContent';
import AdminCommunity from './pages/admin/AdminCommunity';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminMembership from './pages/admin/AdminMembership'; // 会员管理
import AdminSimulation from './pages/admin/AdminSimulation'; // 实战项目管理
// Removed: AdminEvents, AdminSystem - not needed for current frontend
import AdminAnalytics from './pages/admin/AdminAnalytics';
// 已删除: AdminSettings, AdminMonitor
import { Page, UserProfile } from './types';

const App: React.FC = () => {
  // 1. 全局导航状态管理
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  // 新增：通用 ID/Param 状态 (used for courseId AND admin tab params)
  const [currentParam, setCurrentParam] = useState<string>('default');

  // 2. 用户身份状态 (Persisted User State)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // 核心跳转逻辑
  const navigateTo = (page: Page, param?: string) => {
    if (param) {
      setCurrentParam(param);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 辅助函数：判断是否为后台页面
  const isAdminPage = (page: Page) => {
    return page.toString().startsWith('ADMIN_');
  };

  // 辅助函数：判断是否为教师端页面
  const isTeacherPage = (page: Page) => {
    return page.toString().startsWith('TEACHER_');
  };

  // 辅助函数：判断是否为沉浸式全屏页面（不显示导航栏）
  const isImmersivePage = (page: Page) => {
    return page === Page.LOGIN || page === Page.KNOWLEDGE_GRAPH || page === Page.SIMULATION || isTeacherPage(page);
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
          onNavigate={navigateTo} // Pass navigation handler
          currentUser={currentUser}
          onLogout={handleLogout}
          currentTabParam={currentParam} // Pass active param for highlighting
        >
          {currentPage === Page.ADMIN_DASHBOARD && <AdminDashboard />}
          {currentPage === Page.ADMIN_ANALYTICS && <AdminAnalytics />}
          {currentPage === Page.ADMIN_USERS && <UserTable currentRole={currentUser?.role || 'SuperAdmin'} />}
          {currentPage === Page.ADMIN_PROGRESS && <AdminProgress />}
          {/* AdminContent now receives the param to switch tabs internally */}
          {currentPage === Page.ADMIN_CONTENT && <AdminContent initialTab={currentParam !== 'default' ? currentParam : 'courses'} />}
          {currentPage === Page.ADMIN_COMMUNITY && <AdminCommunity />}
          {currentPage === Page.ADMIN_ANNOUNCEMENTS && <AdminAnnouncements />}
          {currentPage === Page.ADMIN_MEMBERSHIP && <AdminMembership />}
          {currentPage === Page.ADMIN_SIMULATION && <AdminSimulation />}
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
      case Page.AI_ASSISTANT:
        return <AiAssistant currentUser={currentUser} />;
      case Page.COMMUNITY:
        return <Community currentUser={currentUser} />;
      case Page.CLASSROOM:
        return (
          <Classroom
            courseId={currentParam}
            currentUser={currentUser}
            onBack={() => navigateTo(Page.LEARNING)}
          />
        );
      case Page.PROFILE:
        return <Profile currentUser={currentUser} onLogout={handleLogout} />;
      case Page.SCHEDULE:
        return <Schedule currentUser={currentUser} />;
      case Page.KNOWLEDGE_GRAPH:
        return <KnowledgeGraphV2 onNavigate={navigateTo} currentUser={currentUser} />;
      case Page.LEARNING_PATH:
        return <LearningPath nodeId={currentParam} currentUser={currentUser} onNavigate={navigateTo} onBack={() => navigateTo(Page.KNOWLEDGE_GRAPH)} />;
      case Page.SIMULATION:
        return (
          <MembershipGuard user={currentUser} targetPage={Page.SIMULATION} onNavigate={navigateTo}>
            <Simulation onBack={() => navigateTo(Page.DASHBOARD)} currentUser={currentUser} />
          </MembershipGuard>
        );
      case Page.TOOLS_LAB:
        return (
          <MembershipGuard user={currentUser} targetPage={Page.TOOLS_LAB} onNavigate={navigateTo}>
            <ToolsLab 
              onBack={() => navigateTo(Page.DASHBOARD)} 
              currentUser={currentUser}
              onNavigate={navigateTo}
            />
          </MembershipGuard>
        );
      case Page.MEMBERSHIP:
        return <Membership currentUser={currentUser} onNavigate={navigateTo} />;
      case Page.PAYMENT:
        return <Payment currentUser={currentUser} onNavigate={navigateTo} targetTier={currentParam as 'pro' | 'pro_plus'} />;
      case Page.TEACHER_DASHBOARD:
        return <TeacherDashboard currentUser={currentUser} onNavigate={navigateTo} onLogout={handleLogout} />;
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
            onNavigate={navigateTo}
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
