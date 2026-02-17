
import React, { useState } from 'react';
import {
  MessageCircle, ChevronRight, Send, ArrowLeft,
  Search, Filter, ThumbsUp, MessageSquare,
  Bell, Clock, CheckCircle2, XCircle,
  Bold, Italic, List, ListOrdered, Link as LinkIcon,
  Image as ImageIcon, Paperclip, Smile, AtSign,
  Trash2, Edit3, Pin, Lock, Eye,
  Users, FileText, Star, Bookmark, Flag, User,
  MoreVertical, Settings, Check, ChevronDown,
  AlertCircle, LayoutDashboard, LogOut
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
// import { supabase } from '../../lib/supabaseClient';

interface InteractionsProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 学生提问
interface StudentQuestion {
  id: string;
  studentName: string;
  studentAvatar: string;
  studentId: string;
  courseName: string;
  courseId: string;
  title: string;
  content: string;
  timestamp: string;
  createdAt: string;
  replies: Reply[];
  status: 'unanswered' | 'answered' | 'resolved';
  priority: 'normal' | 'high' | 'urgent';
  tags: string[];
  likes: number;
  views: number;
  isPinned?: boolean;
  isPrivate?: boolean;
}

// 回复
interface Reply {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'teacher' | 'student' | 'assistant';
  content: string;
  timestamp: string;
  createdAt: string;
  likes: number;
  isAccepted?: boolean;
  attachments?: Attachment[];
}

// 附件
interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url: string;
  size?: string;
}

// 讨论区主题
interface DiscussionTopic {
  id: string;
  title: string;
  authorName: string;
  authorAvatar: string;
  authorId: string;
  content: string;
  timestamp: string;
  createdAt: string;
  repliesCount: number;
  views: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  lastReplyAt: string;
  lastReplyBy: string;
  replies?: DiscussionReply[];
}

// 讨论区回复
interface DiscussionReply {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'teacher' | 'student' | 'assistant';
  content: string;
  timestamp: string;
  createdAt: string;
  likes: number;
}

// 通知
interface Notification {
  id: string;
  type: 'question' | 'reply' | 'mention' | 'system' | 'report';
  title: string;
  content: string;
  timestamp: string;
  createdAt: string;
  isRead: boolean;
  relatedId?: string;
}

// 通知设置
interface NotificationSettings {
  newQuestion: boolean;
  newReply: boolean;
  mention: boolean;
  system: boolean;
  report: boolean;
  emailNotification: boolean;
  pushNotification: boolean;
}

// 排序类型
type SortType = 'newest' | 'oldest' | 'mostReplies' | 'mostViews';

// 底部导航 Tab 类型
type InteractionTab = 'questions' | 'discussions' | 'notifications' | 'profile';



const Interactions: React.FC<InteractionsProps> = ({
  currentUser,
  onNavigate: _onNavigate,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<InteractionTab>('questions');
  
  // 提问模块状态
  const [selectedQuestion, setSelectedQuestion] = useState<StudentQuestion | null>(null);
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<'all' | 'unanswered' | 'answered' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('newest');
  
  // 回复编辑器状态
  const [replyContent, setReplyContent] = useState('');
  
  // 讨论区状态
  const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);
  const [showTopicDetail, setShowTopicDetail] = useState(false);
  const [topicFilter, setTopicFilter] = useState<'all' | 'pinned' | 'active'>('all');
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newTopicTags, setNewTopicTags] = useState('');
  const [discussionReplyContent, setDiscussionReplyContent] = useState('');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  
  // 通知状态
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newQuestion: true,
    newReply: true,
    mention: true,
    system: true,
    report: true,
    emailNotification: true,
    pushNotification: false
  });

  // 更多操作菜单状态
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);

  // 模拟数据 - 学生提问
  const [questions, setQuestions] = useState<StudentQuestion[]>([
    {
      id: 'q1',
      studentName: '陈小明',
      studentAvatar: 'https://i.pravatar.cc/150?u=4',
      studentId: 'stu001',
      courseName: '项目管理基础',
      courseId: 'course1',
      title: 'WBS分解的最小单元应该到什么程度比较合适？',
      content: '老师，我在学习WBS分解时遇到一个困惑：工作分解结构的最小单元应该细化到什么程度？是到可以分配给一个人完成的工作包，还是需要更细？有没有什么判断标准？',
      timestamp: '10分钟前',
      createdAt: '2026-02-17T02:00:00Z',
      replies: [],
      status: 'unanswered',
      priority: 'normal',
      tags: ['WBS', '项目管理'],
      likes: 3,
      views: 15,
      isPinned: false,
      isPrivate: false
    },
    {
      id: 'q2',
      studentName: '刘小红',
      studentAvatar: 'https://i.pravatar.cc/150?u=5',
      studentId: 'stu002',
      courseName: '敏捷开发实践',
      courseId: 'course2',
      title: 'Scrum和Kanban的主要区别是什么？',
      content: '老师您好，我对Scrum和Kanban的区别还有些模糊。两者都是敏捷方法论，在实际项目中应该如何选择？能否详细说明一下它们的主要区别和适用场景？',
      timestamp: '30分钟前',
      createdAt: '2026-02-17T01:40:00Z',
      replies: [
        {
          id: 'r1',
          authorName: '张老师',
          authorAvatar: 'https://i.pravatar.cc/150?u=teacher',
          authorRole: 'teacher',
          content: 'Scrum和Kanban确实都是流行的敏捷方法，但它们有不同的侧重点。Scrum更适合有固定迭代周期的项目，而Kanban更适合持续交付的流程。',
          timestamp: '25分钟前',
          createdAt: '2026-02-17T01:45:00Z',
          likes: 5,
          isAccepted: false
        },
        {
          id: 'r2',
          authorName: '李同学',
          authorAvatar: 'https://i.pravatar.cc/150?u=8',
          authorRole: 'student',
          content: '我在实际项目中尝试过两种方法，发现Scrum的仪式感更强，适合团队需要明确目标和里程碑的情况。',
          timestamp: '20分钟前',
          createdAt: '2026-02-17T01:50:00Z',
          likes: 2,
          isAccepted: false
        }
      ],
      status: 'answered',
      priority: 'high',
      tags: ['Scrum', 'Kanban', '敏捷'],
      likes: 8,
      views: 42,
      isPinned: true,
      isPrivate: false
    },
    {
      id: 'q3',
      studentName: '赵小强',
      studentAvatar: 'https://i.pravatar.cc/150?u=6',
      studentId: 'stu003',
      courseName: '风险管理专题',
      courseId: 'course3',
      title: '定性风险分析和定量风险分析分别在什么阶段进行？',
      content: '老师，关于风险管理的两个分析阶段，我想确认一下：定性风险分析和定量风险分析是在项目的什么阶段进行的？它们的先后顺序是怎样的？',
      timestamp: '1小时前',
      createdAt: '2026-02-17T01:00:00Z',
      replies: [],
      status: 'unanswered',
      priority: 'urgent',
      tags: ['风险管理', '风险分析'],
      likes: 2,
      views: 12,
      isPinned: false,
      isPrivate: false
    },
    {
      id: 'q4',
      studentName: '王小华',
      studentAvatar: 'https://i.pravatar.cc/150?u=7',
      studentId: 'stu004',
      courseName: '项目管理基础',
      courseId: 'course1',
      title: '项目章程和项目范围说明书有什么区别？',
      content: '这两个文档都是在项目初期制定的，感觉内容有些重叠。能否详细说明一下它们的区别和各自的作用？',
      timestamp: '2小时前',
      createdAt: '2026-02-17T00:00:00Z',
      replies: [
        {
          id: 'r3',
          authorName: '张老师',
          authorAvatar: 'https://i.pravatar.cc/150?u=teacher',
          authorRole: 'teacher',
          content: '项目章程是授权项目的正式文件，主要定义项目的高层级信息；而项目范围说明书详细描述了项目的产品范围和项目范围。两者的详细程度和用途是不同的。',
          timestamp: '1小时前',
          createdAt: '2026-02-17T01:00:00Z',
          likes: 4,
          isAccepted: true
        }
      ],
      status: 'resolved',
      priority: 'normal',
      tags: ['项目章程', '范围管理'],
      likes: 5,
      views: 28,
      isPinned: false,
      isPrivate: false
    },
    {
      id: 'q5',
      studentName: '张小美',
      studentAvatar: 'https://i.pravatar.cc/150?u=9',
      studentId: 'stu005',
      courseName: '敏捷开发实践',
      courseId: 'course2',
      title: 'Sprint Planning会议一般开多长时间？',
      content: '我们团队刚开始尝试Scrum，Sprint Planning会议总是开很长时间。请问一个2周的Sprint，Planning会议开多久比较合适？',
      timestamp: '3小时前',
      createdAt: '2026-02-16T23:00:00Z',
      replies: [],
      status: 'unanswered',
      priority: 'normal',
      tags: ['Scrum', 'Sprint'],
      likes: 1,
      views: 8,
      isPinned: false,
      isPrivate: true
    }
  ]);

  // 模拟数据 - 讨论区主题
  const [topics, setTopics] = useState<DiscussionTopic[]>([
    {
      id: 't1',
      title: '【精华】项目管理实战经验分享',
      authorName: '张老师',
      authorAvatar: 'https://i.pravatar.cc/150?u=teacher',
      authorId: 'teacher1',
      content: '这个帖子汇总了我多年项目管理的实战经验，包括团队管理、风险控制、进度管理等方面的内容。欢迎大家讨论交流。',
      timestamp: '2026-02-10',
      createdAt: '2026-02-10T08:00:00Z',
      repliesCount: 45,
      views: 1280,
      likes: 89,
      isPinned: true,
      isLocked: false,
      tags: ['精华', '经验分享'],
      lastReplyAt: '10分钟前',
      lastReplyBy: '李同学',
      replies: [
        {
          id: 'dr1',
          authorName: '李同学',
          authorAvatar: 'https://i.pravatar.cc/150?u=8',
          authorRole: 'student',
          content: '非常感谢老师的分享，对我的帮助很大！',
          timestamp: '10分钟前',
          createdAt: '2026-02-17T01:50:00Z',
          likes: 12
        },
        {
          id: 'dr2',
          authorName: '陈小明',
          authorAvatar: 'https://i.pravatar.cc/150?u=4',
          authorRole: 'student',
          content: '想请教一下老师，在风险控制方面有什么好的工具推荐吗？',
          timestamp: '1小时前',
          createdAt: '2026-02-17T01:00:00Z',
          likes: 5
        }
      ]
    },
    {
      id: 't2',
      title: '敏捷转型中的常见问题和解决方案',
      authorName: '陈小明',
      authorAvatar: 'https://i.pravatar.cc/150?u=4',
      authorId: 'stu001',
      content: '我们团队正在进行敏捷转型，遇到了一些困难，想和大家交流一下。主要问题包括：1. 团队成员对敏捷理念理解不一致；2. 每日站会效率低下；3. 需求变更频繁导致Sprint目标难以达成。',
      timestamp: '2026-02-12',
      createdAt: '2026-02-12T10:00:00Z',
      repliesCount: 23,
      views: 456,
      likes: 34,
      isPinned: false,
      isLocked: false,
      tags: ['敏捷转型', '讨论'],
      lastReplyAt: '30分钟前',
      lastReplyBy: '王小华',
      replies: []
    },
    {
      id: 't3',
      title: '如何制定有效的项目计划？',
      authorName: '刘小红',
      authorAvatar: 'https://i.pravatar.cc/150?u=5',
      authorId: 'stu002',
      content: '项目计划总是赶不上变化，有什么好的方法可以制定更有效的计划吗？',
      timestamp: '2026-02-13',
      createdAt: '2026-02-13T14:00:00Z',
      repliesCount: 18,
      views: 234,
      likes: 21,
      isPinned: false,
      isLocked: false,
      tags: ['项目计划'],
      lastReplyAt: '1小时前',
      lastReplyBy: '赵小强',
      replies: []
    },
    {
      id: 't4',
      title: '【公告】课程作业提交截止时间调整通知',
      authorName: '张老师',
      authorAvatar: 'https://i.pravatar.cc/150?u=teacher',
      authorId: 'teacher1',
      content: '由于系统维护，课程作业提交截止时间将延长至下周一。请各位同学注意时间安排。',
      timestamp: '2026-02-14',
      createdAt: '2026-02-14T09:00:00Z',
      repliesCount: 5,
      views: 567,
      likes: 45,
      isPinned: true,
      isLocked: true,
      tags: ['公告'],
      lastReplyAt: '2小时前',
      lastReplyBy: '陈小明',
      replies: []
    }
  ]);

  // 模拟数据 - 通知
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n1',
      type: 'question',
      title: '新的学生提问',
      content: '陈小明在《项目管理基础》课程中提出了一个新问题',
      timestamp: '10分钟前',
      createdAt: '2026-02-17T01:50:00Z',
      isRead: false,
      relatedId: 'q1'
    },
    {
      id: 'n2',
      type: 'reply',
      title: '问题收到新回复',
      content: '你关注的问题"Scrum和Kanban的主要区别"收到了新回复',
      timestamp: '20分钟前',
      createdAt: '2026-02-17T01:40:00Z',
      isRead: false,
      relatedId: 'q2'
    },
    {
      id: 'n3',
      type: 'mention',
      title: '有人@了你',
      content: '王小华在讨论中提到了你',
      timestamp: '1小时前',
      createdAt: '2026-02-17T01:00:00Z',
      isRead: true,
      relatedId: 't2'
    },
    {
      id: 'n4',
      type: 'system',
      title: '系统通知',
      content: '您的课程《敏捷开发实践》已获得课程认证',
      timestamp: '2小时前',
      createdAt: '2026-02-17T00:00:00Z',
      isRead: true
    },
    {
      id: 'n5',
      type: 'report',
      title: '举报处理通知',
      content: '您举报的内容已经过审核，已作相应处理',
      timestamp: '昨天',
      createdAt: '2026-02-16T10:00:00Z',
      isRead: true
    }
  ]);

  // 排序提问
  const sortQuestions = (questions: StudentQuestion[]) => {
    const sorted = [...questions];
    switch (sortType) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'mostReplies':
        return sorted.sort((a, b) => b.replies.length - a.replies.length);
      case 'mostViews':
        return sorted.sort((a, b) => b.views - a.views);
      default:
        return sorted;
    }
  };

  // 筛选提问
  const filteredQuestions = sortQuestions(questions.filter(q => {
    const matchesFilter = questionFilter === 'all' || q.status === questionFilter;
    const matchesSearch = searchQuery === '' || 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }));

  // 筛选讨论区主题
  const filteredTopics = topics.filter(t => {
    const matchesFilter = topicFilter === 'all' ? true : 
      topicFilter === 'pinned' ? t.isPinned : 
      t.repliesCount > 10;
    const matchesSearch = topicSearchQuery === '' ||
      t.title.toLowerCase().includes(topicSearchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(topicSearchQuery.toLowerCase()) ||
      t.authorName.toLowerCase().includes(topicSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // 筛选通知
  const filteredNotifications = notifications.filter(n => {
    return notificationFilter === 'all' || !n.isRead;
  });

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unanswered': return 'bg-red-100 text-red-600';
      case 'answered': return 'bg-blue-100 text-blue-600';
      case 'resolved': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unanswered': return '待回复';
      case 'answered': return '已回复';
      case 'resolved': return '已解决';
      default: return '未知';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      default: return 'bg-gray-300';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'question': return MessageCircle;
      case 'reply': return MessageSquare;
      case 'mention': return AtSign;
      case 'system': return CheckCircle2;
      case 'report': return Flag;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-600';
      case 'reply': return 'bg-green-100 text-green-600';
      case 'mention': return 'bg-purple-100 text-purple-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      case 'report': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // 发送回复
  const handleSendReply = () => {
    if (!replyContent.trim() || !selectedQuestion) return;
    
    const newReply: Reply = {
      id: `r${Date.now()}`,
      authorName: currentUser?.name || '张老师',
      authorAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher',
      authorRole: 'teacher',
      content: replyContent,
      timestamp: '刚刚',
      createdAt: new Date().toISOString(),
      likes: 0
    };

    setQuestions(prev => prev.map(q => {
      if (q.id === selectedQuestion.id) {
        return {
          ...q,
          replies: [...q.replies, newReply],
          status: 'answered'
        };
      }
      return q;
    }));

    setReplyContent('');
    setSelectedQuestion(prev => prev ? {
      ...prev,
      replies: [...prev.replies, newReply],
      status: 'answered'
    } : null);
  };

  // 标记问题为已解决
  const handleMarkResolved = (questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return { ...q, status: 'resolved' };
      }
      return q;
    }));
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(prev => prev ? { ...prev, status: 'resolved' } : null);
    }
  };

  // 标记通知为已读
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  // 标记所有通知为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 切换问题置顶
  const togglePinQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, isPinned: !q.isPinned } : q
    ));
  };

  // 删除问题
  const deleteQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个问题吗？')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (selectedQuestion?.id === id) {
        setShowQuestionDetail(false);
        setSelectedQuestion(null);
      }
    }
  };

  // 创建新讨论主题
  const handleCreateTopic = () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;
    
    const newTopic: DiscussionTopic = {
      id: `t${Date.now()}`,
      title: newTopicTitle,
      authorName: currentUser?.name || '张老师',
      authorAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher',
      authorId: currentUser?.id || 'teacher1',
      content: newTopicContent,
      timestamp: '刚刚',
      createdAt: new Date().toISOString(),
      repliesCount: 0,
      views: 0,
      likes: 0,
      isPinned: false,
      isLocked: false,
      tags: newTopicTags ? newTopicTags.split(',').map(t => t.trim()).filter(Boolean) : ['讨论'],
      lastReplyAt: '刚刚',
      lastReplyBy: currentUser?.name || '张老师',
      replies: []
    };

    setTopics(prev => [newTopic, ...prev]);
    setNewTopicTitle('');
    setNewTopicContent('');
    setNewTopicTags('');
    setShowCreateTopic(false);
  };

  // 切换讨论置顶
  const togglePinTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTopics(prev => prev.map(t => 
      t.id === id ? { ...t, isPinned: !t.isPinned } : t
    ));
  };

  // 切换讨论锁定
  const toggleLockTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTopics(prev => prev.map(t => 
      t.id === id ? { ...t, isLocked: !t.isLocked } : t
    ));
  };

  // 删除讨论
  const deleteTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个讨论主题吗？')) {
      setTopics(prev => prev.filter(t => t.id !== id));
      if (selectedTopic?.id === id) {
        setShowTopicDetail(false);
        setSelectedTopic(null);
      }
    }
  };

  // 发送讨论回复
  const handleSendDiscussionReply = () => {
    if (!discussionReplyContent.trim() || !selectedTopic || selectedTopic.isLocked) return;
    
    const newReply: DiscussionReply = {
      id: `dr${Date.now()}`,
      authorName: currentUser?.name || '张老师',
      authorAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher',
      authorRole: 'teacher',
      content: discussionReplyContent,
      timestamp: '刚刚',
      createdAt: new Date().toISOString(),
      likes: 0
    };

    setTopics(prev => prev.map(t => {
      if (t.id === selectedTopic.id) {
        return {
          ...t,
          replies: [...(t.replies || []), newReply],
          repliesCount: t.repliesCount + 1,
          lastReplyAt: '刚刚',
          lastReplyBy: currentUser?.name || '张老师'
        };
      }
      return t;
    }));

    setDiscussionReplyContent('');
    setSelectedTopic(prev => prev ? {
      ...prev,
      replies: [...(prev.replies || []), newReply],
      repliesCount: prev.repliesCount + 1,
      lastReplyAt: '刚刚',
      lastReplyBy: currentUser?.name || '张老师'
    } : null);
  };

  // ==================== 侧边栏导航（桌面端）====================
  const renderSidebar = () => {
    const navItems = [
      { id: 'questions', icon: MessageCircle, label: '学生提问' },
      { id: 'discussions', icon: Users, label: '讨论区' },
      { id: 'notifications', icon: Bell, label: '通知' },
      { id: 'profile', icon: User, label: '个人中心' },
    ];

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const unansweredCount = questions.filter(q => q.status === 'unanswered').length;

    return (
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        {/* Logo/标题 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">互动管理</h1>
              <p className="text-xs text-gray-500">教师端</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as InteractionTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {item.id === 'questions' && unansweredCount > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                    {unansweredCount > 99 ? '99+' : unansweredCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 用户信息 */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher'}
              alt="Avatar"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{currentUser?.name || '教师'}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'teacher@example.com'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      </div>
    );
  };

  // ==================== 底部导航（移动端）====================
  const renderBottomNav = () => {
    const navItems = [
      { id: 'questions', icon: MessageCircle, label: '提问' },
      { id: 'discussions', icon: Users, label: '讨论' },
      { id: 'notifications', icon: Bell, label: '通知' },
      { id: 'profile', icon: User, label: '我的' },
    ];

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden">
        <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as InteractionTab)}
                className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all"
              >
                <div className={`relative p-2 rounded-xl transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-2 w-full"></div>
      </div>
    );
  };

  // ==================== 提问列表 ====================
  const renderQuestions = () => (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">学生提问</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <Search size={20} className="text-gray-600" />
          </button>
          <button className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <Filter size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索提问..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: '全部', count: questions.length },
          { key: 'unanswered', label: '待回复', count: questions.filter(q => q.status === 'unanswered').length },
          { key: 'answered', label: '已回复', count: questions.filter(q => q.status === 'answered').length },
          { key: 'resolved', label: '已解决', count: questions.filter(q => q.status === 'resolved').length }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setQuestionFilter(filter.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              questionFilter === filter.key 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* 排序选项 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">共 {filteredQuestions.length} 个问题</span>
        <div className="relative">
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">最新发布</option>
            <option value="oldest">最早发布</option>
            <option value="mostReplies">回复最多</option>
            <option value="mostViews">浏览最多</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 提问列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            onClick={() => { setSelectedQuestion(question); setShowQuestionDetail(true); }}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-all ${
              question.isPinned ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            {/* 顶部信息 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src={question.studentAvatar} alt="" className="w-10 h-10 rounded-full" />
                <div>
                  <h4 className="font-medium text-gray-900">{question.studentName}</h4>
                  <p className="text-xs text-gray-500">{question.courseName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {question.isPinned && <Pin size={16} className="text-blue-500" />}
                {question.priority !== 'normal' && (
                  <span className={`w-2 h-2 rounded-full ${getPriorityColor(question.priority)}`}></span>
                )}
                <span className={`px-2 py-1 rounded-lg text-xs ${getStatusColor(question.status)}`}>
                  {getStatusText(question.status)}
                </span>
              </div>
            </div>

            {/* 标题和内容 */}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{question.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{question.content}</p>

            {/* 标签 */}
            <div className="flex flex-wrap gap-1 mb-3">
              {question.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* 底部统计 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {question.timestamp}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {question.views}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ThumbsUp size={14} /> {question.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={14} /> {question.replies.length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无相关提问</p>
        </div>
      )}
    </div>
  );

  // ==================== 提问详情页 ====================
  const renderQuestionDetail = () => {
    if (!showQuestionDetail || !selectedQuestion) return null;

    return (
      <div className="fixed inset-0 z-50 bg-gray-50">
        <div className="h-full flex flex-col max-w-3xl mx-auto lg:mx-0 lg:max-w-none">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowQuestionDetail(false); setSelectedQuestion(null); }}
                className="p-2 bg-gray-100 rounded-xl"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">问题详情</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => togglePinQuestion(selectedQuestion.id, e)}
                className={`p-2 rounded-xl ${selectedQuestion.isPinned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                <Pin size={18} />
              </button>
              {selectedQuestion.status !== 'resolved' && (
                <button 
                  onClick={() => handleMarkResolved(selectedQuestion.id)}
                  className="p-2 bg-green-100 rounded-xl text-green-600"
                  title="标记为已解决"
                >
                  <CheckCircle2 size={18} />
                </button>
              )}
              <button 
                onClick={(e) => deleteQuestion(selectedQuestion.id, e)}
                className="p-2 bg-gray-100 rounded-xl text-gray-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {/* 问题信息 */}
            <div className="bg-white p-4 mb-3">
              <div className="flex items-center gap-3 mb-4">
                <img src={selectedQuestion.studentAvatar} alt="" className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedQuestion.studentName}</h3>
                  <p className="text-sm text-gray-500">{selectedQuestion.courseName} · {selectedQuestion.timestamp}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs ${getStatusColor(selectedQuestion.status)}`}>
                  {getStatusText(selectedQuestion.status)}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-3">{selectedQuestion.title}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{selectedQuestion.content}</p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedQuestion.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 统计 */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye size={16} /> {selectedQuestion.views} 浏览
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={16} /> {selectedQuestion.likes} 赞
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={16} /> {selectedQuestion.replies.length} 回复
                </span>
              </div>
            </div>

            {/* 回复列表 */}
            <div className="bg-white p-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                {selectedQuestion.replies.length > 0 ? `${selectedQuestion.replies.length} 条回复` : '暂无回复'}
              </h4>
              <div className="space-y-4">
                {selectedQuestion.replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3">
                    <img src={reply.authorAvatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{reply.authorName}</span>
                        {reply.authorRole === 'teacher' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">老师</span>
                        )}
                        <span className="text-xs text-gray-400">{reply.timestamp}</span>
                        {reply.isAccepted && (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle2 size={12} /> 已采纳
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600">
                          <ThumbsUp size={14} /> {reply.likes}
                        </button>
                        <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600">
                          <MessageSquare size={14} /> 回复
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 回复输入区 */}
          <div className="bg-white border-t border-gray-100 p-4">
            {/* 富文本工具栏 */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto">
              {[
                { icon: Bold, label: '粗体' },
                { icon: Italic, label: '斜体' },
                { icon: List, label: '列表' },
                { icon: ListOrdered, label: '有序列表' },
                { icon: LinkIcon, label: '链接' },
                { icon: ImageIcon, label: '图片' },
                { icon: Paperclip, label: '附件' },
                { icon: Smile, label: '表情' }
              ].map((tool, idx) => (
                <button
                  key={idx}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title={tool.label}
                >
                  <tool.icon size={18} />
                </button>
              ))}
            </div>

            {/* 输入框 */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="输入您的回复..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
              </div>
              <button
                onClick={handleSendReply}
                disabled={!replyContent.trim()}
                className="self-end p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 讨论区 ====================
  const renderDiscussions = () => (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">讨论区</h1>
        <button 
          onClick={() => setShowCreateTopic(true)}
          className="p-2 bg-blue-600 text-white rounded-xl"
        >
          <Edit3 size={20} />
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{topics.length}</p>
          <p className="text-xs text-gray-500">主题数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{topics.reduce((sum, t) => sum + t.repliesCount, 0)}</p>
          <p className="text-xs text-gray-500">回复数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-purple-600">{topics.reduce((sum, t) => sum + t.views, 0)}</p>
          <p className="text-xs text-gray-500">浏览量</p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索讨论..."
          value={topicSearchQuery}
          onChange={(e) => setTopicSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'pinned', label: '置顶' },
          { key: 'active', label: '热门' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setTopicFilter(filter.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              topicFilter === filter.key 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 主题列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => { setSelectedTopic(topic); setShowTopicDetail(true); }}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-all ${
              topic.isPinned ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <img src={topic.authorAvatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {topic.isPinned && <Pin size={14} className="text-blue-500" />}
                  {topic.isLocked && <Lock size={14} className="text-gray-400" />}
                  <h3 className={`font-semibold text-gray-900 line-clamp-1 ${topic.isPinned ? 'text-blue-600' : ''}`}>
                    {topic.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{topic.content}</p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {topic.tags.map((tag, idx) => (
                    <span key={idx} className={`px-2 py-0.5 text-xs rounded-full ${
                      tag === '精华' ? 'bg-yellow-100 text-yellow-700' :
                      tag === '公告' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>{topic.authorName}</span>
                    <span>{topic.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {topic.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> {topic.repliesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} /> {topic.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无相关讨论</p>
        </div>
      )}
    </div>
  );

  // ==================== 讨论详情页 ====================
  const renderTopicDetail = () => {
    if (!showTopicDetail || !selectedTopic) return null;

    return (
      <div className="fixed inset-0 z-50 bg-gray-50">
        <div className="h-full flex flex-col max-w-3xl mx-auto lg:mx-0 lg:max-w-none">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowTopicDetail(false); setSelectedTopic(null); }}
                className="p-2 bg-gray-100 rounded-xl"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 line-clamp-1">{selectedTopic.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => togglePinTopic(selectedTopic.id, e)}
                className={`p-2 rounded-xl ${selectedTopic.isPinned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                title={selectedTopic.isPinned ? '取消置顶' : '置顶'}
              >
                <Pin size={18} />
              </button>
              <button 
                onClick={(e) => toggleLockTopic(selectedTopic.id, e)}
                className={`p-2 rounded-xl ${selectedTopic.isLocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
                title={selectedTopic.isLocked ? '解锁' : '锁定'}
              >
                <Lock size={18} />
              </button>
              <button 
                onClick={(e) => deleteTopic(selectedTopic.id, e)}
                className="p-2 bg-gray-100 rounded-xl text-gray-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {/* 主题信息 */}
            <div className="bg-white p-4 mb-3">
              <div className="flex items-center gap-3 mb-4">
                <img src={selectedTopic.authorAvatar} alt="" className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedTopic.authorName}</h3>
                  <p className="text-sm text-gray-500">{selectedTopic.timestamp}</p>
                </div>
                {selectedTopic.isLocked && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-lg flex items-center gap-1">
                    <Lock size={12} /> 已锁定
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-3">{selectedTopic.title}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{selectedTopic.content}</p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTopic.tags.map((tag, idx) => (
                  <span key={idx} className={`px-3 py-1 text-sm rounded-full ${
                    tag === '精华' ? 'bg-yellow-100 text-yellow-700' :
                    tag === '公告' ? 'bg-red-100 text-red-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 统计 */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye size={16} /> {selectedTopic.views} 浏览
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={16} /> {selectedTopic.likes} 赞
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={16} /> {selectedTopic.repliesCount} 回复
                </span>
              </div>
            </div>

            {/* 回复列表 */}
            <div className="bg-white p-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                {selectedTopic.replies && selectedTopic.replies.length > 0 
                  ? `${selectedTopic.replies.length} 条回复` 
                  : '暂无回复'}
              </h4>
              <div className="space-y-4">
                {(selectedTopic.replies || []).map((reply) => (
                  <div key={reply.id} className="flex gap-3">
                    <img src={reply.authorAvatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{reply.authorName}</span>
                        {reply.authorRole === 'teacher' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">老师</span>
                        )}
                        <span className="text-xs text-gray-400">{reply.timestamp}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600">
                          <ThumbsUp size={14} /> {reply.likes}
                        </button>
                        <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600">
                          <MessageSquare size={14} /> 回复
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 回复输入区 */}
          {!selectedTopic.isLocked ? (
            <div className="bg-white border-t border-gray-100 p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={discussionReplyContent}
                    onChange={(e) => setDiscussionReplyContent(e.target.value)}
                    placeholder="输入您的回复..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                </div>
                <button
                  onClick={handleSendDiscussionReply}
                  disabled={!discussionReplyContent.trim()}
                  className="self-end p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border-t border-gray-200 p-4 text-center">
              <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                <Lock size={16} /> 该讨论已锁定，无法回复
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== 创建讨论主题 ====================
  const renderCreateTopic = () => {
    if (!showCreateTopic) return null;

    return (
      <div className="fixed inset-0 z-50 bg-gray-50">
        <div className="h-full flex flex-col max-w-3xl mx-auto lg:mx-0 lg:max-w-none">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateTopic(false)}
                className="p-2 bg-gray-100 rounded-xl"
              >
                <XCircle size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">发起讨论</h1>
            </div>
            <button
              onClick={handleCreateTopic}
              disabled={!newTopicTitle.trim() || !newTopicContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              发布
            </button>
          </div>

          {/* 表单 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="请输入讨论标题"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
              <textarea
                value={newTopicContent}
                onChange={(e) => setNewTopicContent(e.target.value)}
                placeholder="请输入讨论内容..."
                rows={10}
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签 <span className="text-gray-400 font-normal">(用逗号分隔)</span>
              </label>
              <input
                type="text"
                value={newTopicTags}
                onChange={(e) => setNewTopicTags(e.target.value)}
                placeholder="例如: 项目管理, 经验分享"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 通知列表 ====================
  const renderNotifications = () => (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">通知</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotificationSettings(true)}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{notifications.filter(n => !n.isRead).length}</p>
          <p className="text-xs text-gray-500">未读通知</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-600">{notifications.length}</p>
          <p className="text-xs text-gray-500">全部通知</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setNotificationFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              notificationFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setNotificationFilter('unread')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              notificationFilter === 'unread' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            未读 ({notifications.filter(n => !n.isRead).length})
          </button>
        </div>
        <button 
          onClick={markAllAsRead}
          className="text-sm text-blue-600 font-medium"
        >
          全部已读
        </button>
      </div>

      {/* 通知列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredNotifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all ${
                !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  !notification.isRead ? getNotificationColor(notification.type) : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <div className="relative">
                        <button 
                          onClick={() => setShowMoreMenu(showMoreMenu === notification.id ? null : notification.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        {showMoreMenu === notification.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setShowMoreMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[120px]">
                              {!notification.isRead && (
                                <button
                                  onClick={() => { markNotificationAsRead(notification.id); setShowMoreMenu(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Check size={14} /> 标记已读
                                </button>
                              )}
                              <button
                                onClick={() => { deleteNotification(notification.id); setShowMoreMenu(null); }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={14} /> 删除
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-1">{notification.content}</p>
                  <span className="text-xs text-gray-400">{notification.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无通知</p>
        </div>
      )}
    </div>
  );

  // ==================== 通知设置 ====================
  const renderNotificationSettings = () => {
    if (!showNotificationSettings) return null;

    return (
      <div className="fixed inset-0 z-50 bg-gray-50">
        <div className="h-full flex flex-col max-w-3xl mx-auto lg:mx-0 lg:max-w-none">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNotificationSettings(false)}
                className="p-2 bg-gray-100 rounded-xl"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">通知设置</h1>
            </div>
          </div>

          {/* 设置内容 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 通知类型设置 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">接收通知类型</h3>
              <div className="space-y-4">
                {[
                  { key: 'newQuestion', label: '新提问', desc: '当有学生提交新问题时通知我', icon: MessageCircle },
                  { key: 'newReply', label: '新回复', desc: '当我的问题收到回复时通知我', icon: MessageSquare },
                  { key: 'mention', label: '提及', desc: '当有人在讨论中@我时通知我', icon: AtSign },
                  { key: 'system', label: '系统通知', desc: '系统更新、维护等通知', icon: CheckCircle2 },
                  { key: 'report', label: '举报处理', desc: '我举报的内容处理结果通知', icon: Flag }
                ].map((item) => (
                  <div key={item.key} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key as keyof NotificationSettings] as boolean}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 推送方式设置 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">推送方式</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Bell size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">应用内通知</span>
                      <p className="text-xs text-gray-500">在应用内显示通知红点</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:translate-x-full"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <MessageCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">邮件通知</span>
                      <p className="text-xs text-gray-500">发送邮件到您的注册邮箱</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotification}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotification: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <AlertCircle size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">推送通知</span>
                      <p className="text-xs text-gray-500">发送手机推送消息</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotification}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotification: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 个人中心 ====================
  const renderProfile = () => (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher'}
            alt="Avatar"
            className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
          />
          <div>
            <h2 className="text-xl font-bold">{currentUser?.name || '教师'}</h2>
            <p className="text-blue-100 text-sm">{currentUser?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-white/20 rounded-lg text-xs">高级教师</span>
              <span className="px-2 py-1 bg-white/20 rounded-lg text-xs">互动管理</span>
            </div>
          </div>
        </div>
      </div>

      {/* 互动统计 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-blue-600">{questions.filter(q => q.status === 'unanswered').length}</p>
          <p className="text-sm text-gray-500">待回复提问</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-green-600">{questions.filter(q => q.status === 'resolved').length}</p>
          <p className="text-sm text-gray-500">已解决问题</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-purple-600">{topics.length}</p>
          <p className="text-sm text-gray-500">管理主题</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-orange-600">{notifications.filter(n => !n.isRead).length}</p>
          <p className="text-sm text-gray-500">未读通知</p>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {[
          { icon: MessageCircle, label: '我的回复', value: `${questions.reduce((sum, q) => sum + q.replies.filter(r => r.authorRole === 'teacher').length, 0)}条` },
          { icon: Star, label: '精华内容', value: '12个' },
          { icon: Bookmark, label: '收藏管理', value: '' },
          { icon: FileText, label: '互动数据', value: '' },
          { icon: MessageSquare, label: '帮助与反馈', value: '' },
        ].map((item, idx) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 ${
              idx !== 4 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <item.icon size={20} className="text-gray-600" />
            </div>
            <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
            <span className="text-sm text-gray-400">{item.value}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        ))}
      </div>

      {/* 退出登录 - 仅在移动端显示，桌面端在侧边栏 */}
      <button
        onClick={onLogout}
        className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-medium lg:hidden"
      >
        退出登录
      </button>
    </div>
  );

  // ==================== 主渲染 ====================
  const renderContent = () => {
    switch (activeTab) {
      case 'questions': return renderQuestions();
      case 'discussions': return renderDiscussions();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return renderQuestions();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏导航 - 桌面端 */}
      {renderSidebar()}
      
      {/* 主内容区域 */}
      <div className="flex-1 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderContent()}
        </div>
      </div>
      
      {/* 底部导航 - 移动端 */}
      {renderBottomNav()}
      
      {/* 弹窗/详情页 */}
      {renderQuestionDetail()}
      {renderTopicDetail()}
      {renderCreateTopic()}
      {renderNotificationSettings()}
    </div>
  );
};

export default Interactions;
