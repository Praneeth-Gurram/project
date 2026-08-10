const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion;

// Reusing Icon component from kpi-dashboard
const Icon = ({ name, color = "currentColor", size = 24, className = "" }) => {
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

// Reusing CountUp hook
const useCountUp = (end, duration = 2, start = 0, isCurrency = false, isDec = false) => {
    const [count, setCount] = useState(start);
    const countRef = useRef(start);

    useEffect(() => {
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            
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
        formatted = "$" + (count / 1000000).toFixed(2) + "M";
    } else if (isCurrency) {
        formatted = "$" + Math.floor(count / 1000) + "K";
    } else if (isDec) {
        formatted = count.toFixed(1);
    } else {
        formatted = Math.floor(count).toLocaleString();
    }
    
    return formatted;
};

const AnimatedNumber = ({ value, isCurrency, isDec, suffix = "" }) => {
    const displayValue = useCountUp(value, 2.5, 0, isCurrency, isDec);
    return <span>{displayValue}{suffix}</span>;
};

const CircularProgress = ({ value, color = "#22d3ee", size = 40, strokeWidth = 4 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none" />
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
            <div className="absolute text-[10px] font-bold text-white">{Math.round(value)}%</div>
        </div>
    );
};

const TrendBadge = ({ value }) => {
    const isPositive = value >= 0;
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <Icon name={isPositive ? "trending-up" : "trending-down"} size={12} />
            {isPositive ? "+" : ""}{value}%
        </div>
    );
};

// Timeline Component
const ClosedLoopTimeline = () => {
    const [workflow, setWorkflow] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [loadingAction, setLoadingAction] = useState(false);

    const fetchWorkflow = async () => {
        try {
            const res = await fetch('http://localhost:8080/workflow-state');
            const data = await res.json();
            if(!data.error) setWorkflow(data);
        } catch (err) {
            console.error("Failed to fetch workflow state", err);
        }
    };

    useEffect(() => {
        fetchWorkflow();
    }, []);

    if (!workflow) return <div className="w-full bg-slate-900/40 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md text-slate-400 text-center">Loading Workflow...</div>;

    const getStatusStyle = (status) => {
        switch(status) {
            case 'COMPLETED': return { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
            case 'FAILED': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
            case 'ACTIVE': return { bg: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-400', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]' };
            default: return { bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-500', shadow: '' }; // PENDING
        }
    };

    const steps = [
        { id: 'prediction', title: "Prediction", icon: "brain", status: workflow.prediction_status },
        { id: 'optimization', title: "Optimization", icon: "zap", status: workflow.optimization_status },
        { id: 'decision', title: "Decision", icon: "user-check", status: workflow.decision_status },
        { id: 'execution', title: "Execution", icon: "truck", status: workflow.execution_status },
        { id: 'outcome', title: "Outcome", icon: "bar-chart-2", status: workflow.outcome_status },
        { id: 'learning', title: "Model Learning", icon: "refresh-cw", status: workflow.learning_status }
    ];

    // Determine overall current stage and workflow status
    const currentActiveStep = steps.find(s => s.status === 'ACTIVE') || steps.find(s => s.status === 'FAILED') || steps[steps.length - 1];
    const overallStatus = steps.some(s => s.status === 'FAILED') ? 'FAILED' : (workflow.learning_status === 'COMPLETED' ? 'COMPLETED' : 'IN PROGRESS');

    const handleAction = async (endpoint, payload = {}) => {
        setLoadingAction(true);
        try {
            await fetch(`http://localhost:8080/workflow/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            await fetchWorkflow();
            if(window.showNotification) window.showNotification("Workflow Updated", `Action ${endpoint} completed.`);
        } catch(err) {
            console.error(err);
            if(window.showNotification) window.showNotification("Error", "Action failed.");
        } finally {
            setLoadingAction(false);
        }
    };

    // Calculate progress line percentage
    const completedCount = steps.filter(s => s.status === 'COMPLETED').length;
    const progressWidth = `${(completedCount / (steps.length - 1)) * 100}%`;

    return (
        <div className="w-full bg-slate-900/40 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Icon name="git-merge" size={16} color="#22d3ee" /> AI Closed-Loop Analytics Process
                </h3>
                <div className="text-right text-xs text-slate-400">
                    <div className="mb-1">Current Stage: <strong className="text-white">{currentActiveStep.id === 'outcome' && currentActiveStep.status === 'ACTIVE' ? 'Awaiting Outcome' : currentActiveStep.title}</strong></div>
                    <div>Workflow Status: <strong className={overallStatus === 'COMPLETED' ? 'text-emerald-400' : overallStatus === 'FAILED' ? 'text-red-400' : 'text-cyan-400'}>{overallStatus}</strong></div>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center relative mb-6">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-1/2 left-[5%] right-[5%] h-1 bg-slate-800 -translate-y-1/2 z-0">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: progressWidth }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    />
                </div>
                
                {steps.map((step) => {
                    const style = getStatusStyle(step.status);
                    const isSelected = selectedStage === step.id;
                    return (
                        <div key={step.id} 
                            onClick={() => setSelectedStage(isSelected ? null : step.id)}
                            className="relative z-10 flex flex-col items-center gap-3 mb-4 md:mb-0 cursor-pointer group"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                ${style.bg} ${style.border} ${isSelected ? style.shadow : ''} hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]`}>
                                <Icon name={step.icon} size={20} className={style.text} />
                            </div>
                            <span className={`text-xs font-semibold ${style.text}`}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Details Panel */}
            <AnimatePresence>
                {selectedStage && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/10 pt-4 mt-4 overflow-hidden"
                    >
                        {selectedStage === 'prediction' && (
                            <div className="text-sm">
                                {workflow.prediction_status === 'ACTIVE' ? (
                                    <button onClick={() => handleAction('generate-prediction')} disabled={loadingAction} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
                                        {loadingAction ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="play" size={14} />} Generate Prediction
                                    </button>
                                ) : workflow.prediction_status === 'COMPLETED' ? (
                                    <div className="text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5">
                                        <p><strong className="text-white">Status:</strong> Success</p>
                                        <p className="mt-1"><strong className="text-white">Insight:</strong> AI identified high probability of delay for shipments on standard truck routing.</p>
                                    </div>
                                ) : <div className="text-slate-500">Awaiting previous steps...</div>}
                            </div>
                        )}

                        {selectedStage === 'optimization' && (
                            <div className="text-sm">
                                {workflow.optimization_status === 'ACTIVE' ? (
                                    <button onClick={() => handleAction('run-optimization', { shipment_id: 1, required_quantity: 800, maximum_budget: 15000 })} disabled={loadingAction} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
                                        {loadingAction ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="zap" size={14} />} Run SciPy Optimization
                                    </button>
                                ) : workflow.optimization_status === 'COMPLETED' || workflow.optimization_status === 'FAILED' ? (
                                    <div className="text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5">
                                        {workflow.optimization_status === 'FAILED' && <p className="text-red-400 mb-3 font-bold border-l-2 border-red-500 pl-2">Optimization failed or constraints were violated.</p>}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                            <div><strong className="text-white text-xs uppercase block">Solver</strong>SciPy linprog</div>
                                            <div><strong className="text-white text-xs uppercase block">Objective Value</strong>${(workflow.expected_cost || 0).toLocaleString()}</div>
                                            <div><strong className="text-white text-xs uppercase block">Constraint Status</strong><span className={workflow.optimization_status === 'FAILED' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{workflow.optimization_status === 'FAILED' ? 'VIOLATED' : 'PASSED'}</span></div>
                                        </div>
                                        {workflow.optimization_audit && (
                                            <table className="w-full text-left mt-2 border-t border-white/10 pt-2 text-xs">
                                                <thead><tr className="text-slate-500"><th className="pb-1">Constraint</th><th className="pb-1">Actual</th><th className="pb-1">Limit</th><th className="pb-1">Status</th></tr></thead>
                                                <tbody>
                                                    {Object.entries(workflow.optimization_audit).map(([k,v]) => (
                                                        <tr key={k} className="border-t border-white/5">
                                                            <td className="py-2 text-white">{k}</td>
                                                            <td className="py-2">{v.actual}</td>
                                                            <td className="py-2">{v.limit}</td>
                                                            <td className={`py-2 font-bold ${v.passed ? 'text-emerald-400' : 'text-red-400'}`}>{v.passed ? 'PASS' : 'FAIL'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                ) : <div className="text-slate-500">Awaiting previous steps...</div>}
                            </div>
                        )}

                        {selectedStage === 'decision' && (
                            <div className="text-sm">
                                {workflow.decision_status === 'ACTIVE' ? (
                                    <button onClick={() => handleAction('select-decision')} disabled={loadingAction} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
                                        {loadingAction ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="check-square" size={14} />} Select Recommended Decision
                                    </button>
                                ) : workflow.decision_status === 'COMPLETED' ? (
                                    <div className="text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5 flex gap-8">
                                        <div><strong className="text-white text-xs uppercase block">Selected Option</strong>{workflow.selected_option}</div>
                                        <div><strong className="text-white text-xs uppercase block">Expected Cost</strong>${(workflow.expected_cost || 0).toLocaleString()}</div>
                                        <div><strong className="text-white text-xs uppercase block">Expected Delay</strong>{workflow.expected_delay} hrs</div>
                                    </div>
                                ) : <div className="text-slate-500">Awaiting previous steps...</div>}
                            </div>
                        )}

                        {selectedStage === 'execution' && (
                            <div className="text-sm">
                                {workflow.execution_status === 'ACTIVE' ? (
                                    <button onClick={() => handleAction('execute-decision', { shipment_id: 1, required_quantity: 800, maximum_budget: 15000 })} disabled={loadingAction} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2">
                                        {loadingAction ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="play" size={14} />} Execute Decision
                                    </button>
                                ) : workflow.execution_status === 'COMPLETED' || workflow.execution_status === 'FAILED' ? (
                                    <div className="text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5">
                                        {workflow.execution_status === 'FAILED' && <p className="text-red-400 mb-3 font-bold border-l-2 border-red-500 pl-2">Decision execution failed. Database write-back was unsuccessful.</p>}
                                        <div className="flex gap-8">
                                            <div><strong className="text-white text-xs uppercase block">Execution Status</strong><span className={workflow.execution_status === 'COMPLETED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{workflow.execution_status}</span></div>
                                            {workflow.execution_status === 'COMPLETED' && <div><strong className="text-white text-xs uppercase block">Database Write-Back</strong>Successful</div>}
                                            {workflow.decision_id && <div><strong className="text-white text-xs uppercase block">Decision ID</strong>{workflow.decision_id}</div>}
                                        </div>
                                    </div>
                                ) : <div className="text-slate-500">Awaiting previous steps...</div>}
                            </div>
                        )}

                        {selectedStage === 'outcome' && (
                            <div className="text-sm">
                                {workflow.outcome_status === 'ACTIVE' ? (
                                    <div className="flex items-center gap-4">
                                        <p className="text-slate-400 italic">Awaiting operational outcome data...</p>
                                        <button onClick={() => handleAction('provide-outcome', { actual_cost: workflow.expected_cost + 500, actual_delay: workflow.expected_delay + 2 })} disabled={loadingAction} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
                                            {loadingAction ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="download" size={14} />} Provide Actual Outcome
                                        </button>
                                    </div>
                                ) : workflow.outcome_status === 'COMPLETED' ? (
                                    <div className="text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5 grid grid-cols-2 gap-8">
                                        <div className="bg-white/5 p-3 rounded border border-white/5">
                                            <div className="flex justify-between border-b border-white/10 pb-1 mb-2"><span className="text-slate-400">Predicted Cost</span><span className="text-white">${(workflow.expected_cost || 0).toLocaleString()}</span></div>
                                            <div className="flex justify-between border-b border-white/10 pb-1 mb-2"><span className="text-slate-400">Actual Cost</span><span className="text-white">${(workflow.actual_cost || 0).toLocaleString()}</span></div>
                                            <div className="flex justify-between pt-1"><strong className="text-white text-xs uppercase">Cost Variance</strong><strong className={workflow.actual_cost > workflow.expected_cost ? 'text-red-400' : 'text-emerald-400'}>{workflow.actual_cost > workflow.expected_cost ? '+' : ''}${(workflow.actual_cost - workflow.expected_cost).toLocaleString()}</strong></div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded border border-white/5">
                                            <div className="flex justify-between border-b border-white/10 pb-1 mb-2"><span className="text-slate-400">Predicted Delay</span><span className="text-white">{workflow.expected_delay} hrs</span></div>
                                            <div className="flex justify-between border-b border-white/10 pb-1 mb-2"><span className="text-slate-400">Actual Delay</span><span className="text-white">{workflow.actual_delay} hrs</span></div>
                                            <div className="flex justify-between pt-1"><strong className="text-white text-xs uppercase">Delay Variance</strong><strong className={workflow.actual_delay > workflow.expected_delay ? 'text-red-400' : 'text-emerald-400'}>{workflow.actual_delay > workflow.expected_delay ? '+' : ''}{(workflow.actual_delay - workflow.expected_delay).toLocaleString()} hrs</strong></div>
                                        </div>
                                    </div>
                                ) : <div className="text-slate-500">Awaiting previous steps...</div>}
                            </div>
                        )}

                        {selectedStage === 'learning' && (
                            <div className="text-sm">
                                {workflow.learning_status === 'COMPLETED' ? (
                                    <div className="text-slate-300 bg-black/20 p-4 rounded-lg border border-emerald-500/20">
                                        <p className="text-emerald-400 font-bold flex items-center gap-2"><Icon name="check-circle" size={16} /> Feedback Recorded</p>
                                        <p className="mt-2 text-xs text-slate-400">Outcome evaluated and feedback recorded for future analysis. <br/><span className="italic">Note: Model has not been retrained as there is no active retraining mechanism.</span></p>
                                    </div>
                                ) : <div className="text-slate-500">Awaiting actual outcomes...</div>}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Recommendation Card Component
const RecommendationCard = ({ rec, delay }) => {
    const [expanded, setExpanded] = useState(false);

    const priorityColors = {
        Critical: "bg-red-500/20 text-red-400 border-red-500/30",
        High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    };

    const diffColors = {
        High: "text-red-400",
        Medium: "text-yellow-400",
        Low: "text-emerald-400"
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.1 }}
            className={`bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${expanded ? 'shadow-[0_0_30px_rgba(6,182,212,0.15)] border-cyan-500/30' : 'hover:border-white/20 hover:shadow-lg'}`}
        >
            {/* Header Area */}
            <div className="p-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <Icon name={rec.icon} color="#22d3ee" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{rec.title}</h2>
                            <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${priorityColors[rec.priority]}`}>
                            {rec.priority} Priority
                        </span>
                        <span className="text-[10px] text-slate-500">Updated {rec.updated}</span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">AI Confidence</span>
                        <CircularProgress value={rec.confidence} color="#34d399" />
                    </div>
                    <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Cost Savings</span>
                        <span className="text-xl font-bold text-emerald-400">${rec.savings.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Delay Reduction</span>
                        <span className="text-xl font-bold text-blue-400">{rec.delayRed} hrs</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Projected ROI</span>
                        <span className="text-xl font-bold text-purple-400">{rec.roi}%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Difficulty</span>
                        <span className={`text-sm font-bold uppercase ${diffColors[rec.difficulty]}`}>{rec.difficulty}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Opt Score</span>
                        <span className="text-xl font-bold text-cyan-400">{rec.optScore}/100</span>
                    </div>
                </div>
            </div>

            {/* Expandable Section */}
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/10 bg-slate-900/80"
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Left Column: XAI & Progress */}
                            <div>
                                <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                    <Icon name="sparkles" size={16} /> Why this recommendation? (XAI)
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed mb-6 bg-cyan-900/10 p-4 rounded-xl border border-cyan-500/20">
                                    {rec.xaiText}
                                </p>

                                <h4 className="text-sm font-bold text-white mb-2">Implementation Status</h4>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Progress</span>
                                    <span>{rec.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                                    <motion.div 
                                        className="bg-blue-500 h-full rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${rec.progress}%` }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Alternative Comparison */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Icon name="git-compare" size={16} color="#94a3b8" /> Alternative Actions Comparison
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
                                                <th className="pb-2 font-medium">Action</th>
                                                <th className="pb-2 font-medium">Est. Cost</th>
                                                <th className="pb-2 font-medium">Impact</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300">
                                            {rec.alternatives.map((alt, i) => (
                                                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                    <td className="py-3 flex items-center gap-2">
                                                        {alt.recommended && <Icon name="check-circle" size={14} color="#34d399" />}
                                                        <span className={alt.recommended ? 'text-emerald-400 font-bold' : ''}>{alt.name}</span>
                                                    </td>
                                                    <td className="py-3">{alt.cost}</td>
                                                    <td className="py-3">{alt.impact}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-black/30 p-4 border-t border-white/5 flex flex-wrap gap-3 justify-end items-center">
                            <button className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                                <Icon name="file-text" size={14} /> Export PDF
                            </button>
                            <button className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                                <Icon name="git-compare" size={14} /> Compare
                            </button>
                            <button className="px-4 py-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors flex items-center gap-2">
                                <Icon name="sliders" size={14} /> Run Simulation
                            </button>
                            <button className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2">
                                <Icon name="play" size={14} /> Apply Recommendation
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


const ExecutiveDecisionCenter = () => {
    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(1.0);
    const [isExecuting, setIsExecuting] = useState(false);
    const [exportStatus, setExportStatus] = useState("idle");

    const handleExportReport = async () => {
        setExportStatus("generating");
        try {
            const kpiObj = {};
            topKPIs.forEach(kpi => {
                let formatted = kpi.value;
                if (kpi.isCurrency) {
                    if (kpi.value >= 1000000) formatted = "$" + (kpi.value / 1000000).toFixed(2) + "M";
                    else formatted = "$" + Math.floor(kpi.value / 1000) + "K";
                } else if (kpi.isDec) {
                    formatted = kpi.value.toFixed(1);
                } else {
                    formatted = Math.floor(kpi.value).toLocaleString();
                }
                kpiObj[kpi.label] = formatted + (kpi.suffix || "");
            });
            
            const activeContainer = document.getElementById('active-filters-container');
            const matchCount = document.getElementById('filter-matching-records');
            const records_count = parseInt((matchCount ? matchCount.innerText : "1000").replace(/,/g,'')) || 1000;
            
            const filters = [];
            if (activeContainer) {
                const chips = activeContainer.querySelectorAll('span');
                chips.forEach(chip => {
                    const text = chip.innerText.trim();
                    if(text && !text.includes("No active filters")) {
                        filters.push(text);
                    }
                });
            }

            const payload = {
                records_count: records_count,
                kpis: kpiObj,
                filters: filters
            };

            const response = await fetch('http://localhost:8080/export-board-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to export report");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            a.download = `SupplyPrescript_Board_Report_${dateStr}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            setExportStatus("success");
            setTimeout(() => setExportStatus("idle"), 3000);
        } catch (err) {
            console.error(err);
            setExportStatus("error");
            setTimeout(() => setExportStatus("idle"), 3000);
        }
    };

    const handleExecuteAll = async () => {
        setIsExecuting(true);
        if(window.showNotification) window.showNotification("Auto-Execute", "Running optimization audits and write-backs...");
        
        try {
            // Mocking a bulk execution by calling the endpoint a few times
            for(let i=1; i<=3; i++) {
                await fetch('http://localhost:8080/execute-decision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shipment_id: 100 + i,
                        required_quantity: 800 + (i*50),
                        maximum_budget: 15000 + (i*1000)
                    })
                });
                await new Promise(r => setTimeout(r, 600)); // Delay between executions
            }
            if(window.showNotification) window.showNotification("Success", "All top recommendations executed successfully.");
        } catch (err) {
            console.error(err);
            if(window.showNotification) window.showNotification("Error", "Bulk execution failed. Check logs.");
        } finally {
            setIsExecuting(false);
        }
    };

    useEffect(() => {
        const handleGlobalFilter = (e) => {
            setLoading(true);
            setTimeout(() => {
                if (e.detail && e.detail.scaleFactor) {
                    setScale(e.detail.scaleFactor);
                }
                setLoading(false);
            }, 800);
        };
        window.addEventListener('globalFilterApplied', handleGlobalFilter);
        return () => window.removeEventListener('globalFilterApplied', handleGlobalFilter);
    }, []);

    // Top KPI Data
    const topKPIs = [
        { label: "Total Estimated Savings", value: 2450000 * scale, isCurrency: true, trend: 14.2 },
        { label: "Average Delay Reduction", value: 18.5, isDec: true, suffix: " hrs", trend: 22.1 },
        { label: "Overall AI Confidence", value: Math.min(100, 92.4 * (1 + (scale > 1 ? 0.05 : -0.05))), isDec: true, suffix: "%", trend: 3.5 },
        { label: "Recommendations Implemented", value: Math.floor(142 * scale), trend: 12 },
        { label: "Pending Decisions", value: Math.max(1, Math.floor(8 * scale)), trend: -2 },
        { label: "Projected ROI", value: 315, suffix: "%", trend: 45 }
    ];

    // Mock Data based on the 5 original text recommendations
    const recommendations = [
        {
            id: 1,
            title: "Route Optimization & Geo-Clustering",
            description: "Implement dynamic routing algorithms specifically for the worst-performing Geo_Clusters.",
            icon: "map",
            priority: "Critical",
            updated: "2 mins ago",
            confidence: 96,
            savings: 850000,
            delayRed: 24,
            roi: 420,
            difficulty: "Medium",
            optScore: 98,
            progress: 35,
            xaiText: "SHAP analysis indicates 'Geo_Cluster_4' contributes to 42% of systemic delays due to inefficient routing during historical peak demand months. Allocating overflow assets proactively reduces bottleneck probability by 88%.",
            alternatives: [
                { name: "Dynamic Routing (Recommended)", cost: "$45k", impact: "-24 hrs delay", recommended: true },
                { name: "Static Rerouting", cost: "$10k", impact: "-5 hrs delay", recommended: false },
                { name: "Do Nothing", cost: "$0", impact: "+12 hrs delay (Risk)", recommended: false }
            ]
        },
        {
            id: 2,
            title: "Driver & Asset Performance Improvement",
            description: "Institute targeted training programs and preventative maintenance for bottom 25% assets.",
            icon: "wrench",
            priority: "High",
            updated: "1 hr ago",
            confidence: 89,
            savings: 420000,
            delayRed: 15,
            roi: 215,
            difficulty: "Low",
            optScore: 85,
            progress: 10,
            xaiText: "The Isolation Forest model identified recurring 'Vehicle Breakdown' anomalies strongly correlated with drivers in the bottom quartile of the Asset_Performance_Score. Preventative maintenance yields a 3x higher ROI than reactive repairs.",
            alternatives: [
                { name: "Targeted Training & Maint.", cost: "$25k", impact: "-15 hrs delay", recommended: true },
                { name: "Fleet Replacement", cost: "$1.2M", impact: "-18 hrs delay", recommended: false }
            ]
        },
        {
            id: 3,
            title: "Cost Optimization & Revenue Alignment",
            description: "Introduce a tiered SLA system prioritizing high-value transactions algorithmically.",
            icon: "bar-chart-3",
            priority: "High",
            updated: "3 hrs ago",
            confidence: 94,
            savings: 1200000,
            delayRed: 8,
            roi: 550,
            difficulty: "Medium",
            optScore: 92,
            progress: 60,
            xaiText: "Outlier analysis revealed that systemic failures disproportionately affect high-tier B2B accounts. By prioritizing dispatch queues based on Revenue_Per_Wait_Minute, overall SLA penalty costs are reduced by 64%.",
            alternatives: [
                { name: "Algorithmic Tiered SLA", cost: "$50k", impact: "Penalty drop 64%", recommended: true },
                { name: "Manual Prioritization", cost: "$80k/yr", impact: "Penalty drop 20%", recommended: false }
            ]
        },
        {
            id: 4,
            title: "Delay Reduction via Predictive Modeling",
            description: "Integrate real-time weather APIs to automatically pad ETAs during Extreme_Weather_Flags.",
            icon: "cloud-lightning",
            priority: "Medium",
            updated: "5 hrs ago",
            confidence: 91,
            savings: 150000,
            delayRed: 32,
            roi: 180,
            difficulty: "Low",
            optScore: 88,
            progress: 100,
            xaiText: "Bivariate correlation analysis confirmed extreme traffic coupled with weather leads to systemic failure. Padding ETAs by 25% during active weather flags completely mitigates customer dissatisfaction metrics in 91% of simulated cases.",
            alternatives: [
                { name: "Dynamic ETA Padding", cost: "$15k", impact: "Zero SLA breach", recommended: true },
                { name: "Weather Rerouting", cost: "$90k", impact: "Partial mitigation", recommended: false }
            ]
        },
        {
            id: 5,
            title: "Hybrid Fleet Utilization",
            description: "Maintain core fleet at 80% utilization, rely on 3PL contractors for top 15% peak demand days.",
            icon: "truck",
            priority: "Critical",
            updated: "1 day ago",
            confidence: 97,
            savings: 2100000,
            delayRed: 45,
            roi: 680,
            difficulty: "High",
            optScore: 99,
            progress: 25,
            xaiText: "Time-series forecasting shows that maintaining 100% capacity for peak days causes a 35% idle rate during normal operations. A hybrid 3PL model optimizes capital expenditure while absorbing demand shocks.",
            alternatives: [
                { name: "Hybrid 3PL Model", cost: "$500k", impact: "+35% CapEx efficiency", recommended: true },
                { name: "Purchase New Fleet", cost: "$3.5M", impact: "+10% CapEx efficiency", recommended: false }
            ]
        }
    ];

    return (
        <div className="relative w-full min-h-[800px] rounded-3xl p-2 font-sans">
            
            {/* Top Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Icon name="cpu" size={32} color="#22d3ee" />
                        AI Executive Decision Center
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Prescriptive analytics, automated ROI forecasting, and actionable strategic directives.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExportReport}
                        disabled={exportStatus === 'generating'}
                        className={`px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors flex items-center gap-2 ${exportStatus === 'generating' ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {exportStatus === 'generating' ? <Icon name="loader" size={16} className="animate-spin" /> : 
                         exportStatus === 'success' ? <Icon name="check" size={16} color="#34d399" /> :
                         exportStatus === 'error' ? <Icon name="x" size={16} color="#ef4444" /> :
                         <Icon name="download" size={16} />}
                        {exportStatus === 'generating' ? "Generating PDF..." : 
                         exportStatus === 'success' ? "Report Exported ✓" :
                         exportStatus === 'error' ? "Export Failed" :
                         "Export Board Report"}
                    </button>
                    <button 
                        onClick={handleExecuteAll}
                        disabled={isExecuting}
                        className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${isExecuting ? 'bg-cyan-800 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}
                    >
                        {isExecuting ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="zap" size={16} />}
                        {isExecuting ? "Executing..." : "Auto-Execute All"}
                    </button>
                </div>
            </div>

            {/* Executive KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {topKPIs.map((kpi, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col items-center text-center hover:bg-slate-800/60 transition-colors"
                    >
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{kpi.label}</span>
                        <div className="text-2xl font-bold text-white mb-2">
                            <AnimatedNumber value={kpi.value} isCurrency={kpi.isCurrency} isDec={kpi.isDec} suffix={kpi.suffix} />
                        </div>
                        <TrendBadge value={kpi.trend} />
                    </motion.div>
                ))}
            </div>

            <ClosedLoopTimeline />

            {/* Recommendations List */}
            <div className="flex flex-col gap-5">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Icon name="target" size={24} color="#a78bfa" /> Recommended Strategic Actions
                </h3>
                {recommendations.map((rec, i) => (
                    <RecommendationCard key={rec.id} rec={rec} delay={i} />
                ))}
            </div>

        </div>
    );
};

// Mount
const rootNode = document.getElementById('react-reports-root');
if (rootNode) {
    const root = ReactDOM.createRoot(rootNode);
    root.render(<ExecutiveDecisionCenter />);
}
