import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Globe, Server, Terminal, Cpu } from 'lucide-react';

const AdminMonitor: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  
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

    // Mock world map coordinates
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
                      <div className="text-2xl font-mono text-blue-400 font-bold">12,450</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Active Users</div>
                  </div>
              </div>
              
              {/* ECharts Container */}
              <div ref={mapRef} className="flex-1 w-full h-full absolute inset-0 opacity-80" />
              
              {/* Overlay Grid */}
              <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3}}></div>
          </div>

          {/* 2. System Vitals (Right Column) */}
          <div className="lg:col-span-1 space-y-6">
             {/* CPU Load */}
             <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                     <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Cpu size={16}/> Core Load</h4>
                     <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Healthy</span>
                 </div>
                 <div className="flex items-end gap-1 h-16 justify-between px-2">
                     {[40, 65, 34, 87, 56, 45, 78, 23].map((val, i) => (
                         <div key={i} className="w-2 bg-blue-500 rounded-t-sm transition-all duration-500" style={{height: `${val}%`}}></div>
                     ))}
                 </div>
                 <div className="mt-4 flex justify-between text-xs text-gray-500 font-mono">
                     <span>Avg: 45%</span>
                     <span>Peak: 87%</span>
                 </div>
             </div>

             {/* Terminal Logs */}
             <div className="bg-black rounded-2xl p-5 border border-gray-800 shadow-lg flex flex-col h-[220px]">
                 <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3"><Terminal size={14}/> System Logs</h4>
                 <div className="flex-1 overflow-hidden font-mono text-[10px] space-y-1.5 text-gray-300">
                     {logs.map((log, i) => (
                         <div key={i} className="truncate opacity-80 border-l-2 border-transparent hover:border-blue-500 pl-2 transition-colors">
                             <span className={log.includes('WARN') ? 'text-yellow-400' : log.includes('ERR') ? 'text-red-400' : 'text-green-400'}>
                                 {log.split(' ')[0]}
                             </span>
                             <span className="ml-2">{log.substring(log.indexOf(' ')+1)}</span>
                         </div>
                     ))}
                 </div>
             </div>
          </div>

          {/* 3. Real-time Requests Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-[300px] flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Server size={18}/> 实时请求量 (RPS)</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData}>
                        <defs>
                            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="req" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReq)" isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* 4. Service Health Matrix */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-[300px] overflow-y-auto custom-scrollbar">
              <h3 className="text-lg font-bold text-gray-900 mb-4">微服务状态矩阵</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {services.map((svc, i) => (
                      <div key={i} className={`p-3 rounded-xl border flex flex-col justify-between ${
                          svc.status === 'healthy' ? 'bg-green-50/50 border-green-100' : 
                          svc.status === 'warning' ? 'bg-yellow-50/50 border-yellow-100' : 
                          'bg-red-50/50 border-red-100'
                      }`}>
                          <div className="flex justify-between items-start">
                              <div className={`w-2 h-2 rounded-full ${
                                  svc.status === 'healthy' ? 'bg-green-500' : 
                                  svc.status === 'warning' ? 'bg-yellow-500' : 
                                  'bg-red-500'
                              }`}></div>
                              <span className="text-[10px] font-mono text-gray-500">{svc.uptime}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-700 mt-2 truncate" title={svc.name}>{svc.name}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminMonitor;