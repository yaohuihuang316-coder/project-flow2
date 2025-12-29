import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Cpu, HardDrive, Wifi, Globe, Server, AlertTriangle, CheckCircle, Terminal, Zap } from 'lucide-react';

const AdminMonitor: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes'>('overview');
  
  // --- 1. Mock Live Data ---
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([
    "[INFO] System initialized at 09:00:00",
    "[INFO] Loaded 24 core modules",
    "[WARN] Latency spike detected in region: APAC",
  ]);

  // Simulate real-time data flow
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newItem = {
            time: timeStr,
            req: Math.floor(Math.random() * 500) + 1000, // 1000-1500 req/s
            err: Math.floor(Math.random() * 20),
        };
        
        setTrafficData(prev => [...prev.slice(-30), newItem]); // Keep last 30 points

        // Random Log
        if (Math.random() > 0.7) {
            const msgs = [
                `[INFO] User ${Math.floor(Math.random()*9000)+1000} login success`,
                `[INFO] Payment processed: $${Math.floor(Math.random()*100)}`,
                `[WARN] CPU usage > 60% on node-04`,
                `[DEBUG] Cache miss for key: user_profile_${Math.floor(Math.random()*100)}`
            ];
            const newLog = msgs[Math.floor(Math.random() * msgs.length)];
            setLogs(prev => [newLog, ...prev.slice(0, 8)]);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. Initialize ECharts Geo Map (Simulated Scatter) ---
  useEffect(() => {
    if (!mapRef.current) return;
    const myChart = echarts.init(mapRef.current);

    // Mock world map coordinates (Approximate centroids for effect)
    const data = [
        {name: 'Shanghai', value: [121.4737, 31.2304, 150]},
        {name: 'New York', value: [-74.0059, 40.7128, 120]},
        {name: 'London', value: [-0.1278, 51.5074, 90]},
        {name: 'Singapore', value: [103.8198, 1.3521, 80]},
        {name: 'Tokyo', value: [139.6917, 35.6895, 110]},
        {name: 'Sydney', value: [151.2093, -33.8688, 50]},
        {name: 'Berlin', value: [13.4050, 52.5200, 60]},
    ];

    const option = {
        backgroundColor: 'transparent',
        grid: { top: 10, bottom: 10, left: 10, right: 10 },
        xAxis: { show: false, min: -180, max: 180 },
        yAxis: { show: false, min: -90, max: 90 },
        series: [{
            type: 'effectScatter',
            coordinateSystem: 'cartesian2d',
            data: data.map(item => item.value), // [x, y, size]
            symbolSize: (val: any) => val[2] / 5,
            itemStyle: {
                color: '#3b82f6',
                shadowBlur: 10,
                shadowColor: '#3b82f6'
            },
            rippleEffect: { brushType: 'stroke', scale: 3 },
        }]
    };

    myChart.setOption(option);
    const resizeObserver = new ResizeObserver(() => myChart.resize());
    resizeObserver.observe(mapRef.current);
    
    return () => {
        resizeObserver.disconnect();
        myChart.dispose();
    }
  }, []);

  // --- 3. Service Matrix Data ---
  const services = [
      { name: 'Auth Service', status: 'healthy', uptime: '99.9%' },
      { name: 'Course API', status: 'healthy', uptime: '99.8%' },
      { name: 'Payment Gateway', status: 'healthy', uptime: '99.99%' },
      { name: 'Video Stream', status: 'warning', uptime: '98.5%' },
      { name: 'Notifications', status: 'healthy', uptime: '99.9%' },
      { name: 'Analytics DB', status: 'healthy', uptime: '99.5%' },
      { name: 'Search Engine', status: 'healthy', uptime: '99.9%' },
      { name: 'CDN Edge 1', status: 'error', uptime: '89.2%' },
      { name: 'CDN Edge 2', status: 'healthy', uptime: '99.9%' },
  ];

  return (
    <div className="space-y-6 animate-fade-in min-h-[600px]">
      
      {/* Header */}
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                 <Activity className="text-blue-600" /> 运维指挥中心 (Mission Control)
              </h1>
              <p className="text-sm text-gray-500 mt-1">Real-time infrastructure monitoring & telemetry</p>
          </div>
          <div className="flex gap-2">
             <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 System Normal
             </span>
             <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full border border-gray-200">
                 <Globe size={12}/>
                 US-East-1
             </span>
          </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 1. Global Traffic Map (Large Block) */}
          <div className="lg:col-span-3 bg-[#0f172a] rounded-2xl p-6 shadow-xl border border-gray-700 relative overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex justify-between items-start z-10">
                  <div>
                      <h3 className="text-white font-bold text-lg flex items-center gap-2"><Globe size={18}/> 全球访问热力 (Global Traffic)</h3>
                      <p className="text-gray-400 text-xs mt-1">Live active sessions distribution</p>
                  </div>
                  <div className="text-right">
                      <div className="text-3xl font-mono font-bold text-blue-400">14,203</div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Active Users</div>
                  </div>
              </div>
              
              {/* Map Container */}
              <div className="flex-1 w-full h-full absolute inset-0 opacity-40">
                  <div ref={mapRef} className="w-full h-full" />
                  {/* Decorative Map Grid Lines (CSS) */}
                  <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2}}></div>
              </div>

              {/* Traffic Chart Overlay (Bottom) */}
              <div className="h-24 w-full mt-auto z-10 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData}>
                        <defs>
                            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="req" stroke="#3b82f6" strokeWidth={2} fill="url(#trafficGradient)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* 2. Service Health Matrix (Side Block) */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Server size={18}/> 服务矩阵</h3>
              <div className="grid grid-cols-3 gap-3 flex-1 content-start">
                  {services.map((svc, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center p-2 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                          <div className={`w-3 h-3 rounded-full mb-2 ${
                              svc.status === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 
                              svc.status === 'warning' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                          }`}></div>
                          <span className="text-[9px] font-bold text-gray-600 leading-tight group-hover:text-black">{svc.name}</span>
                      </div>
                  ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <button className="text-xs font-bold text-blue-600 hover:underline">查看详细拓扑</button>
              </div>
          </div>

          {/* 3. Resource Gauges (Bottom Row) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Cpu size={18}/> 资源负载</h3>
             <div className="grid grid-cols-3 gap-6">
                 <div className="text-center">
                     <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                         <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                             <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                             <path className="text-blue-500 transition-all duration-1000" strokeDasharray="45, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                         </svg>
                         <div className="absolute flex flex-col items-center">
                             <span className="text-xl font-bold text-gray-900">45%</span>
                             <span className="text-[9px] text-gray-400 font-bold uppercase">CPU</span>
                         </div>
                     </div>
                 </div>
                 <div className="text-center">
                     <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                         <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                             <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                             <path className="text-purple-500 transition-all duration-1000" strokeDasharray="62, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                         </svg>
                         <div className="absolute flex flex-col items-center">
                             <span className="text-xl font-bold text-gray-900">62%</span>
                             <span className="text-[9px] text-gray-400 font-bold uppercase">RAM</span>
                         </div>
                     </div>
                 </div>
                 <div className="text-center">
                     <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                         <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                             <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                             <path className="text-orange-500 transition-all duration-1000" strokeDasharray="28, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                         </svg>
                         <div className="absolute flex flex-col items-center">
                             <span className="text-xl font-bold text-gray-900">28%</span>
                             <span className="text-[9px] text-gray-400 font-bold uppercase">IOPS</span>
                         </div>
                     </div>
                 </div>
             </div>
          </div>

          {/* 4. Live Terminal (Bottom Row) */}
          <div className="lg:col-span-2 bg-[#1e1e1e] rounded-2xl p-0 border border-gray-700 shadow-sm overflow-hidden flex flex-col">
              <div className="h-8 bg-[#2d2d2d] border-b border-black flex items-center px-3 justify-between">
                  <span className="text-xs text-gray-400 font-mono flex items-center gap-2"><Terminal size={12}/> term-01</span>
                  <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
              </div>
              <div className="flex-1 p-4 font-mono text-xs text-green-400 overflow-y-hidden relative">
                  <div className="absolute inset-0 p-4 space-y-1">
                    {logs.map((log, i) => (
                        <div key={i} className={`opacity-${Math.max(30, 100 - i*10)} ${log.includes('WARN') ? 'text-yellow-400' : log.includes('ERROR') ? 'text-red-400' : ''}`}>
                            <span className="text-gray-600 mr-2">$</span>
                            {log}
                        </div>
                    ))}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default AdminMonitor;