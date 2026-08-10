const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion;
const { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine, Tooltip } = window.Recharts;

// Utility for Lucide Icons in React (using the vanilla JS lucide library loaded on the page)
const Icon = ({ name, color = "currentColor", size = 24, className = "" }) => {
    // We can use the globally available lucide object
    const svgContent = window.lucide && window.lucide.icons[name] 
        ? window.lucide.icons[name].toSvg({ stroke: color, width: size, height: size, class: className })
        : `<svg width="${size}" height="${size}" stroke="${color}" class="${className}" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg>`;
    
    return (
        <div 
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
            dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
    );
};

// CountUp Hook
const useCountUp = (end, duration = 2, start = 0, isCurrency = false, isDec = false) => {
    const [count, setCount] = useState(start);
    const countRef = useRef(start);

    useEffect(() => {
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentCount = start + (end - start) * easeProgress;
            
            countRef.current = currentCount;
            setCount(currentCount);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(end);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration, start]);

    let formatted = count;
    if (isCurrency && end >= 1000000) {
        // e.g. 4.28M
        formatted = "$" + (count / 1000000).toFixed(2) + "M";
    } else if (isCurrency) {
        // e.g. $825K
        formatted = "$" + Math.floor(count / 1000) + "K";
    } else if (isDec) {
        formatted = count.toFixed(1);
    } else {
        formatted = Math.floor(count).toLocaleString();
    }
    
    return formatted;
};

// Animated Number Component
const AnimatedNumber = ({ value, isCurrency, isDec, suffix = "" }) => {
    const displayValue = useCountUp(value, 2.5, 0, isCurrency, isDec);
    return <span>{displayValue}{suffix}</span>;
};

// Circular Progress Component
const CircularProgress = ({ value, color = "#22d3ee", size = 60, strokeWidth = 6 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute text-xs font-bold text-white">{Math.round(value)}%</div>
        </div>
    );
};

// Particles Background Component
const Particles = () => {
    const particles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 20 + 10,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute bg-cyan-500 rounded-full opacity-20"
                    style={{ 
                        left: `${p.x}%`, 
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        filter: 'blur(2px)'
                    }}
                    animate={{
                        y: ["-20%", "20%"],
                        x: ["-10%", "10%"],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

// Base KPI Card Wrapper
const KPICard = ({ index, title, icon, iconColor, status, lastUpdated, children, delay = 0, isActive = false }) => {
    const statusColors = {
        Live: "bg-green-500",
        Healthy: "bg-emerald-500",
        Warning: "bg-yellow-500",
        Critical: "bg-red-500"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: delay * 0.1, ease: "easeOut" }}
            whileHover={{ scale: 1.03 }}
            className={`relative group bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-300
                hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:border-cyan-500/50 hover:bg-slate-800/60 z-10`}
        >
            {/* Moving Gradient Border for active cards */}
            {isActive && (
                <div className="absolute inset-0 -z-10 rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50 animate-pulse"></div>
            )}
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <Icon name={icon} color={iconColor} size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
                </div>
                {status && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[status] || 'bg-gray-500'} ${status === 'Live' ? 'animate-pulse' : ''}`}></span>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wider">{status}</span>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="relative z-10 flex-grow flex flex-col justify-center">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center relative z-10">
                <span className="text-[10px] text-slate-500">Updated {lastUpdated}</span>
            </div>
        </motion.div>
    );
};

// Specific KPI Components

const TrendBadge = ({ value }) => {
    const isPositive = value >= 0;
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <Icon name={isPositive ? "trending-up" : "trending-down"} size={14} />
            {isPositive ? "+" : ""}{value}%
        </div>
    );
};

// Shimmer Loader
const SkeletonCard = () => (
    <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 h-48 animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
            <div className="w-16 h-6 bg-white/10 rounded-full"></div>
        </div>
        <div className="w-32 h-10 bg-white/10 rounded-md mb-2"></div>
        <div className="w-full h-12 bg-white/5 rounded-md"></div>
    </div>
);


const DashboardApp = () => {
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('Today');
    const [searchQuery, setSearchQuery] = useState('');
    const [scale, setScale] = useState(1.0);

    useEffect(() => {
        // Handle Global Filters from script.js
        const handleGlobalFilter = () => {
            setLoading(true);
            setTimeout(() => {
                // Trigger re-render by reading the global originalData
                setScale(Math.random()); // hack to trigger re-render if we don't want to refactor everything
                setLoading(false);
            }, 300);
        };
        window.addEventListener('globalFilterDataUpdated', handleGlobalFilter);

        // Simulate initial data loading for skeleton
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('globalFilterDataUpdated', handleGlobalFilter);
        };
    }, []);

    // Mock Data for Sparklines
    const sparklineData = Array.from({ length: 30 }).map((_, i) => ({ day: i, val: Math.random() * 100 + 50 }));
    const revenueData = Array.from({ length: 30 }).map((_, i) => ({ day: i, rev: Math.random() * 50 + 200, target: 220 }));

    const cards = [
        {
            id: 'orders',
            title: "Total Orders",
            icon: "package",
            iconColor: "#22d3ee",
            status: "Live",
            content: () => (
                <>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-3xl font-bold text-white tracking-tight">
                            <AnimatedNumber value={window.originalData ? window.originalData.kpis.totalDeliveries : 1000} />
                        </div>
                        <TrendBadge value={12.4} />
                    </div>
                    <div className="h-12 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="val" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" isAnimationActive={true} animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )
        },
        {
            id: 'revenue',
            title: "Revenue",
            icon: "dollar-sign",
            iconColor: "#34d399",
            status: "Healthy",
            content: () => (
                <>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-3xl font-bold text-white tracking-tight">
                            <AnimatedNumber value={window.originalData ? window.originalData.kpis.totalRevenue : 0} isCurrency={true} />
                        </div>
                        <TrendBadge value={8.9} />
                    </div>
                    <div className="h-12 w-full mt-2 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <Line type="monotone" dataKey="rev" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={true} />
                                <ReferenceLine y={220} stroke="#9ca3af" strokeDasharray="3 3" />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="absolute right-0 top-0 text-[9px] text-gray-400">Target</div>
                    </div>
                </>
            )
        },
        {
            id: 'active_deliveries',
            title: "Active Deliveries",
            icon: "truck",
            iconColor: "#60a5fa",
            status: "Live",
            content: () => (
                <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-white flex-shrink-0">
                        <AnimatedNumber value={window.originalData ? window.originalData.kpis.totalDeliveries : 0} />
                    </div>
                    <div className="flex-grow flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Delivered</span>
                            <span className="text-emerald-400 font-medium">{window.originalData ? (window.originalData.kpis.totalDeliveries - window.originalData.charts.deliveryStatus.data[1]).toLocaleString() : 0}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full"><div className="bg-emerald-400 h-1 rounded-full" style={{width: `${window.originalData ? window.originalData.kpis.onTimePercentage : 0}%`}}></div></div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Delayed</span>
                            <span className="text-red-400 font-medium">{window.originalData ? window.originalData.charts.deliveryStatus.data[1].toLocaleString() : 0}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full"><div className="bg-red-400 h-1 rounded-full" style={{width: `${window.originalData ? (100 - window.originalData.kpis.onTimePercentage) : 0}%`}}></div></div>
                    </div>
                </div>
            )
        },
        {
            id: 'avg_time',
            title: "Average Delivery Time",
            icon: "clock",
            iconColor: "#c084fc",
            status: "Healthy",
            content: () => (
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight mb-1">
                            <AnimatedNumber value={window.originalData ? window.originalData.kpis.avgWaitTime : 0} isDec={true} suffix=" Min" />
                        </div>
                        <TrendBadge value={0} />
                    </div>
                    <CircularProgress value={85} color="#c084fc" />
                </div>
            )
        },
        {
            id: 'delay_risk',
            title: "Delay Risk",
            icon: "triangle-alert",
            iconColor: "#f87171",
            status: "Warning",
            isActive: true,
            content: () => (
                <div className="flex justify-between items-center h-full">
                    <div className="text-4xl font-bold text-white">
                        <AnimatedNumber value={window.originalData ? (100 - window.originalData.kpis.onTimePercentage) : 0} suffix="%" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div> High Risk
                        </div>
                        <div className="px-3 py-1 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-xs font-medium">
                            AI Confidence: N/A
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'savings',
            title: "Optimization Savings",
            icon: "piggy-bank",
            iconColor: "#facc15",
            status: "Healthy",
            content: () => (
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-lg font-bold text-gray-400 tracking-tight mb-1">
                            Requires optimization model
                        </div>
                    </div>
                    <div className="p-3 bg-yellow-400/10 rounded-full">
                        <Icon name="trending-up" color="#facc15" size={28} />
                    </div>
                </div>
            )
        },
        {
            id: 'fleet',
            title: "Fleet Utilization",
            icon: "truck",
            iconColor: "#38bdf8",
            status: "Live",
            content: () => (
                <div className="flex justify-between items-center h-full">
                    <CircularProgress value={window.originalData ? (window.originalData.kpis.efficiencyScore / 100) : 0} color="#38bdf8" size={70} strokeWidth={8} />
                    <div className="text-right">
                        <div className="text-xs text-slate-400 mb-1">Active Vehicles</div>
                        <div className="text-lg font-bold text-white">{window.originalData ? window.originalData.kpis.totalDeliveries : 0}</div>
                    </div>
                </div>
            )
        },
        {
            id: 'warehouse',
            title: "Warehouse Utilization",
            icon: "warehouse",
            iconColor: "#a78bfa",
            content: () => (
                <div className="flex flex-col justify-center h-full gap-3">
                    <div className="flex justify-between items-end">
                        <div className="text-lg font-bold text-gray-400">
                            Requires optimization model
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'ai_accuracy',
            title: "AI Prediction Accuracy",
            icon: "brain-circuit",
            iconColor: "#10b981",
            content: () => (
                <div className="flex justify-between items-center h-full">
                    <div className="text-lg font-bold text-gray-400">
                        Requires optimization model
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-wide border border-emerald-500/30">
                            High Confidence
                        </div>
                        <div className="text-[9px] text-slate-500">Retrained 2h ago</div>
                    </div>
                </div>
            )
        },
        {
            id: 'carbon',
            title: "Carbon Reduction",
            icon: "leaf",
            iconColor: "#4ade80",
            status: "Healthy",
            content: () => (
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">
                            <AnimatedNumber value={14} suffix="%" />
                        </div>
                        <div className="text-xs text-emerald-400 font-medium">Sustainability Score: A+</div>
                    </div>
                    <div className="opacity-80">
                        <Icon name="leaf" color="#4ade80" size={40} />
                    </div>
                </div>
            )
        }
    ];

    const filteredCards = cards.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="relative w-full min-h-[600px] p-6 rounded-3xl bg-slate-950/80 border border-white/5 overflow-hidden font-sans">
            <Particles />
            
            {/* Dashboard Header */}
            <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        Enterprise Logistics Analytics
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-green-400 font-medium">Live Data</span>
                        </div>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Real-time network health and AI-driven insights</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon name="search" size={16} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Find KPI..." 
                            className="w-full md:w-48 bg-slate-900/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {/* Timeframe Toggle */}
                    <div className="flex bg-slate-900/50 border border-white/10 rounded-lg p-1">
                        {['Today', 'Week', 'Month', 'Year'].map(t => (
                            <button 
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeframe === t ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {loading ? (
                    Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    <AnimatePresence>
                        {filteredCards.map((card, index) => (
                            <KPICard 
                                key={card.id}
                                index={index}
                                delay={index}
                                title={card.title}
                                icon={card.icon}
                                iconColor={card.iconColor}
                                status={card.status}
                                lastUpdated="5 seconds ago"
                                isActive={card.isActive}
                            >
                                {card.content()}
                            </KPICard>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {filteredCards.length === 0 && !loading && (
                <div className="relative z-20 text-center py-20 text-slate-400">
                    <Icon name="search-x" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No KPIs found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
};

// Mount the App
const rootNode = document.getElementById('react-kpi-root');
if (rootNode) {
    const root = ReactDOM.createRoot(rootNode);
    root.render(<DashboardApp />);
}
