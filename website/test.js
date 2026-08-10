"use strict";

var _this = this;

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _React = React;
var useState = _React.useState;
var useEffect = _React.useEffect;
var useRef = _React.useRef;
var _window$Motion = window.Motion;
var motion = _window$Motion.motion;
var AnimatePresence = _window$Motion.AnimatePresence;

// Reusing Icon component from kpi-dashboard
var Icon = function Icon(_ref) {
    var name = _ref.name;
    var _ref$color = _ref.color;
    var color = _ref$color === undefined ? "currentColor" : _ref$color;
    var _ref$size = _ref.size;
    var size = _ref$size === undefined ? 24 : _ref$size;
    var _ref$className = _ref.className;
    var className = _ref$className === undefined ? "" : _ref$className;

    var svgContent = window.lucide && window.lucide.icons[name] ? window.lucide.icons[name].toSvg({ stroke: color, width: size, height: size, "class": className }) : "<svg width=\"" + size + "\" height=\"" + size + "\" stroke=\"" + color + "\" class=\"" + className + "\" viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></svg>";

    return React.createElement("div", {
        style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
        dangerouslySetInnerHTML: { __html: svgContent }
    });
};

// Reusing CountUp hook
var useCountUp = function useCountUp(end) {
    var duration = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];
    var start = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
    var isCurrency = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
    var isDec = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

    var _useState = useState(start);

    var _useState2 = _slicedToArray(_useState, 2);

    var count = _useState2[0];
    var setCount = _useState2[1];

    var countRef = useRef(start);

    useEffect(function () {
        var startTime = null;
        var step = function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

            var easeProgress = 1 - Math.pow(1 - progress, 4);
            var currentCount = start + (end - start) * easeProgress;

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

    var formatted = count;
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

var AnimatedNumber = function AnimatedNumber(_ref2) {
    var value = _ref2.value;
    var isCurrency = _ref2.isCurrency;
    var isDec = _ref2.isDec;
    var _ref2$suffix = _ref2.suffix;
    var suffix = _ref2$suffix === undefined ? "" : _ref2$suffix;

    var displayValue = useCountUp(value, 2.5, 0, isCurrency, isDec);
    return React.createElement(
        "span",
        null,
        displayValue,
        suffix
    );
};

var CircularProgress = function CircularProgress(_ref3) {
    var value = _ref3.value;
    var _ref3$color = _ref3.color;
    var color = _ref3$color === undefined ? "#22d3ee" : _ref3$color;
    var _ref3$size = _ref3.size;
    var size = _ref3$size === undefined ? 40 : _ref3$size;
    var _ref3$strokeWidth = _ref3.strokeWidth;
    var strokeWidth = _ref3$strokeWidth === undefined ? 4 : _ref3$strokeWidth;

    var radius = (size - strokeWidth) / 2;
    var circumference = radius * 2 * Math.PI;
    var strokeDashoffset = circumference - value / 100 * circumference;

    return React.createElement(
        "div",
        { className: "relative flex items-center justify-center", style: { width: size, height: size } },
        React.createElement(
            "svg",
            { className: "transform -rotate-90", width: size, height: size },
            React.createElement("circle", { cx: size / 2, cy: size / 2, r: radius, stroke: "rgba(255,255,255,0.1)", strokeWidth: strokeWidth, fill: "none" }),
            React.createElement(motion.circle, {
                cx: size / 2,
                cy: size / 2,
                r: radius,
                stroke: color,
                strokeWidth: strokeWidth,
                fill: "none",
                strokeDasharray: circumference,
                initial: { strokeDashoffset: circumference },
                animate: { strokeDashoffset: strokeDashoffset },
                transition: { duration: 1.5, ease: "easeOut" }
            })
        ),
        React.createElement(
            "div",
            { className: "absolute text-[10px] font-bold text-white" },
            Math.round(value),
            "%"
        )
    );
};

var TrendBadge = function TrendBadge(_ref4) {
    var value = _ref4.value;

    var isPositive = value >= 0;
    return React.createElement(
        "div",
        { className: "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium " + (isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400') },
        React.createElement(Icon, { name: isPositive ? "trending-up" : "trending-down", size: 12 }),
        isPositive ? "+" : "",
        value,
        "%"
    );
};

// Timeline Component
var ClosedLoopTimeline = function ClosedLoopTimeline() {
    var _useState3 = useState(null);

    var _useState32 = _slicedToArray(_useState3, 2);

    var workflow = _useState32[0];
    var setWorkflow = _useState32[1];

    var _useState4 = useState(null);

    var _useState42 = _slicedToArray(_useState4, 2);

    var selectedStage = _useState42[0];
    var setSelectedStage = _useState42[1];

    var _useState5 = useState(false);

    var _useState52 = _slicedToArray(_useState5, 2);

    var loadingAction = _useState52[0];
    var setLoadingAction = _useState52[1];

    var fetchWorkflow = function fetchWorkflow() {
        var res, data;
        return regeneratorRuntime.async(function fetchWorkflow$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.prev = 0;
                    context$2$0.next = 3;
                    return regeneratorRuntime.awrap(fetch('http://localhost:8080/workflow-state'));

                case 3:
                    res = context$2$0.sent;
                    context$2$0.next = 6;
                    return regeneratorRuntime.awrap(res.json());

                case 6:
                    data = context$2$0.sent;

                    if (!data.error) setWorkflow(data);
                    context$2$0.next = 13;
                    break;

                case 10:
                    context$2$0.prev = 10;
                    context$2$0.t0 = context$2$0["catch"](0);

                    console.error("Failed to fetch workflow state", context$2$0.t0);

                case 13:
                case "end":
                    return context$2$0.stop();
            }
        }, null, _this, [[0, 10]]);
    };

    useEffect(function () {
        fetchWorkflow();
    }, []);

    if (!workflow) return React.createElement(
        "div",
        { className: "w-full bg-slate-900/40 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md text-slate-400 text-center" },
        "Loading Workflow..."
    );

    var getStatusStyle = function getStatusStyle(status) {
        switch (status) {
            case 'COMPLETED':
                return { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
            case 'FAILED':
                return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
            case 'ACTIVE':
                return { bg: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-400', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]' };
            default:
                return { bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-500', shadow: '' }; // PENDING
        }
    };

    var steps = [{ id: 'prediction', title: "Prediction", icon: "brain", status: workflow.prediction_status }, { id: 'optimization', title: "Optimization", icon: "zap", status: workflow.optimization_status }, { id: 'decision', title: "Decision", icon: "user-check", status: workflow.decision_status }, { id: 'execution', title: "Execution", icon: "truck", status: workflow.execution_status }, { id: 'outcome', title: "Outcome", icon: "bar-chart-2", status: workflow.outcome_status }, { id: 'learning', title: "Model Learning", icon: "refresh-cw", status: workflow.learning_status }];

    // Determine overall current stage and workflow status
    var currentActiveStep = steps.find(function (s) {
        return s.status === 'ACTIVE';
    }) || steps.find(function (s) {
        return s.status === 'FAILED';
    }) || steps[steps.length - 1];
    var overallStatus = steps.some(function (s) {
        return s.status === 'FAILED';
    }) ? 'FAILED' : workflow.learning_status === 'COMPLETED' ? 'COMPLETED' : 'IN PROGRESS';

    var handleAction = function handleAction(endpoint) {
        var payload = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return regeneratorRuntime.async(function handleAction$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    setLoadingAction(true);
                    context$2$0.prev = 1;
                    context$2$0.next = 4;
                    return regeneratorRuntime.awrap(fetch("http://localhost:8080/workflow/" + endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }));

                case 4:
                    context$2$0.next = 6;
                    return regeneratorRuntime.awrap(fetchWorkflow());

                case 6:
                    if (window.showNotification) window.showNotification("Workflow Updated", "Action " + endpoint + " completed.");
                    context$2$0.next = 13;
                    break;

                case 9:
                    context$2$0.prev = 9;
                    context$2$0.t0 = context$2$0["catch"](1);

                    console.error(context$2$0.t0);
                    if (window.showNotification) window.showNotification("Error", "Action failed.");

                case 13:
                    context$2$0.prev = 13;

                    setLoadingAction(false);
                    return context$2$0.finish(13);

                case 16:
                case "end":
                    return context$2$0.stop();
            }
        }, null, _this, [[1, 9, 13, 16]]);
    };

    // Calculate progress line percentage
    var completedCount = steps.filter(function (s) {
        return s.status === 'COMPLETED';
    }).length;
    var progressWidth = completedCount / (steps.length - 1) * 100 + "%";

    return React.createElement(
        "div",
        { className: "w-full bg-slate-900/40 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md" },
        React.createElement(
            "div",
            { className: "flex justify-between items-start mb-6" },
            React.createElement(
                "h3",
                { className: "text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2" },
                React.createElement(Icon, { name: "git-merge", size: 16, color: "#22d3ee" }),
                " AI Closed-Loop Analytics Process"
            ),
            React.createElement(
                "div",
                { className: "text-right text-xs text-slate-400" },
                React.createElement(
                    "div",
                    { className: "mb-1" },
                    "Current Stage: ",
                    React.createElement(
                        "strong",
                        { className: "text-white" },
                        currentActiveStep.id === 'outcome' && currentActiveStep.status === 'ACTIVE' ? 'Awaiting Outcome' : currentActiveStep.title
                    )
                ),
                React.createElement(
                    "div",
                    null,
                    "Workflow Status: ",
                    React.createElement(
                        "strong",
                        { className: overallStatus === 'COMPLETED' ? 'text-emerald-400' : overallStatus === 'FAILED' ? 'text-red-400' : 'text-cyan-400' },
                        overallStatus
                    )
                )
            )
        ),
        React.createElement(
            "div",
            { className: "flex flex-col md:flex-row justify-between items-center relative mb-6" },
            React.createElement(
                "div",
                { className: "hidden md:block absolute top-1/2 left-[5%] right-[5%] h-1 bg-slate-800 -translate-y-1/2 z-0" },
                React.createElement(motion.div, {
                    className: "h-full bg-gradient-to-r from-emerald-500 to-cyan-500",
                    initial: { width: 0 },
                    animate: { width: progressWidth },
                    transition: { duration: 1, ease: "easeInOut" }
                })
            ),
            steps.map(function (step) {
                var style = getStatusStyle(step.status);
                var isSelected = selectedStage === step.id;
                return React.createElement(
                    "div",
                    { key: step.id,
                        onClick: function () {
                            return setSelectedStage(isSelected ? null : step.id);
                        },
                        className: "relative z-10 flex flex-col items-center gap-3 mb-4 md:mb-0 cursor-pointer group"
                    },
                    React.createElement(
                        "div",
                        { className: "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300\n                                " + style.bg + " " + style.border + " " + (isSelected ? style.shadow : '') + " hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]" },
                        React.createElement(Icon, { name: step.icon, size: 20, className: style.text })
                    ),
                    React.createElement(
                        "span",
                        { className: "text-xs font-semibold " + style.text },
                        step.title
                    )
                );
            })
        ),
        React.createElement(
            AnimatePresence,
            null,
            selectedStage && React.createElement(
                motion.div,
                {
                    initial: { opacity: 0, height: 0 },
                    animate: { opacity: 1, height: 'auto' },
                    exit: { opacity: 0, height: 0 },
                    className: "border-t border-white/10 pt-4 mt-4 overflow-hidden"
                },
                selectedStage === 'prediction' && React.createElement(
                    "div",
                    { className: "text-sm" },
                    workflow.prediction_status === 'ACTIVE' ? React.createElement(
                        "button",
                        { onClick: function () {
                                return handleAction('generate-prediction');
                            }, disabled: loadingAction, className: "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2" },
                        loadingAction ? React.createElement(Icon, { name: "loader", size: 14, className: "animate-spin" }) : React.createElement(Icon, { name: "play", size: 14 }),
                        " Generate Prediction"
                    ) : workflow.prediction_status === 'COMPLETED' ? React.createElement(
                        "div",
                        { className: "text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5" },
                        React.createElement(
                            "p",
                            null,
                            React.createElement(
                                "strong",
                                { className: "text-white" },
                                "Status:"
                            ),
                            " Success"
                        ),
                        React.createElement(
                            "p",
                            { className: "mt-1" },
                            React.createElement(
                                "strong",
                                { className: "text-white" },
                                "Insight:"
                            ),
                            " AI identified high probability of delay for shipments on standard truck routing."
                        )
                    ) : React.createElement(
                        "div",
                        { className: "text-slate-500" },
                        "Awaiting previous steps..."
                    )
                ),
                selectedStage === 'optimization' && React.createElement(
                    "div",
                    { className: "text-sm" },
                    workflow.optimization_status === 'ACTIVE' ? React.createElement(
                        "button",
                        { onClick: function () {
                                return handleAction('run-optimization', { shipment_id: 1, required_quantity: 800, maximum_budget: 15000 });
                            }, disabled: loadingAction, className: "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2" },
                        loadingAction ? React.createElement(Icon, { name: "loader", size: 14, className: "animate-spin" }) : React.createElement(Icon, { name: "zap", size: 14 }),
                        " Run SciPy Optimization"
                    ) : workflow.optimization_status === 'COMPLETED' || workflow.optimization_status === 'FAILED' ? React.createElement(
                        "div",
                        { className: "text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5" },
                        workflow.optimization_status === 'FAILED' && React.createElement(
                            "p",
                            { className: "text-red-400 mb-3 font-bold border-l-2 border-red-500 pl-2" },
                            "Optimization failed or constraints were violated."
                        ),
                        React.createElement(
                            "div",
                            { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-3" },
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase block" },
                                    "Solver"
                                ),
                                "SciPy linprog"
                            ),
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase block" },
                                    "Objective Value"
                                ),
                                "$",
                                (workflow.expected_cost || 0).toLocaleString()
                            ),
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase block" },
                                    "Constraint Status"
                                ),
                                React.createElement(
                                    "span",
                                    { className: workflow.optimization_status === 'FAILED' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold' },
                                    workflow.optimization_status === 'FAILED' ? 'VIOLATED' : 'PASSED'
                                )
                            )
                        ),
                        workflow.optimization_audit && React.createElement(
                            "table",
                            { className: "w-full text-left mt-2 border-t border-white/10 pt-2 text-xs" },
                            React.createElement(
                                "thead",
                                null,
                                React.createElement(
                                    "tr",
                                    { className: "text-slate-500" },
                                    React.createElement(
                                        "th",
                                        { className: "pb-1" },
                                        "Constraint"
                                    ),
                                    React.createElement(
                                        "th",
                                        { className: "pb-1" },
                                        "Actual"
                                    ),
                                    React.createElement(
                                        "th",
                                        { className: "pb-1" },
                                        "Limit"
                                    ),
                                    React.createElement(
                                        "th",
                                        { className: "pb-1" },
                                        "Status"
                                    )
                                )
                            ),
                            React.createElement(
                                "tbody",
                                null,
                                Object.entries(workflow.optimization_audit).map(function (_ref5) {
                                    var _ref52 = _slicedToArray(_ref5, 2);

                                    var k = _ref52[0];
                                    var v = _ref52[1];
                                    return React.createElement(
                                        "tr",
                                        { key: k, className: "border-t border-white/5" },
                                        React.createElement(
                                            "td",
                                            { className: "py-2 text-white" },
                                            k
                                        ),
                                        React.createElement(
                                            "td",
                                            { className: "py-2" },
                                            v.actual
                                        ),
                                        React.createElement(
                                            "td",
                                            { className: "py-2" },
                                            v.limit
                                        ),
                                        React.createElement(
                                            "td",
                                            { className: "py-2 font-bold " + (v.passed ? 'text-emerald-400' : 'text-red-400') },
                                            v.passed ? 'PASS' : 'FAIL'
                                        )
                                    );
                                })
                            )
                        )
                    ) : React.createElement(
                        "div",
                        { className: "text-slate-500" },
                        "Awaiting previous steps..."
                    )
                ),
                selectedStage === 'decision' && React.createElement(
                    "div",
                    { className: "text-sm" },
                    workflow.decision_status === 'ACTIVE' ? React.createElement(
                        "button",
                        { onClick: function () {
                                return handleAction('select-decision');
                            }, disabled: loadingAction, className: "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2" },
                        loadingAction ? React.createElement(Icon, { name: "loader", size: 14, className: "animate-spin" }) : React.createElement(Icon, { name: "check-square", size: 14 }),
                        " Select Recommended Decision"
                    ) : workflow.decision_status === 'COMPLETED' ? React.createElement(
                        "div",
                        { className: "text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5 flex gap-8" },
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "strong",
                                { className: "text-white text-xs uppercase block" },
                                "Selected Option"
                            ),
                            workflow.selected_option
                        ),
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "strong",
                                { className: "text-white text-xs uppercase block" },
                                "Expected Cost"
                            ),
                            "$",
                            (workflow.expected_cost || 0).toLocaleString()
                        ),
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "strong",
                                { className: "text-white text-xs uppercase block" },
                                "Expected Delay"
                            ),
                            workflow.expected_delay,
                            " hrs"
                        )
                    ) : React.createElement(
                        "div",
                        { className: "text-slate-500" },
                        "Awaiting previous steps..."
                    )
                ),
                selectedStage === 'execution' && React.createElement(
                    "div",
                    { className: "text-sm" },
                    workflow.execution_status === 'ACTIVE' ? React.createElement(
                        "button",
                        { onClick: function () {
                                return handleAction('execute-decision', { shipment_id: 1, required_quantity: 800, maximum_budget: 15000 });
                            }, disabled: loadingAction, className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2" },
                        loadingAction ? React.createElement(Icon, { name: "loader", size: 14, className: "animate-spin" }) : React.createElement(Icon, { name: "play", size: 14 }),
                        " Execute Decision"
                    ) : workflow.execution_status === 'COMPLETED' || workflow.execution_status === 'FAILED' ? React.createElement(
                        "div",
                        { className: "text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5" },
                        workflow.execution_status === 'FAILED' && React.createElement(
                            "p",
                            { className: "text-red-400 mb-3 font-bold border-l-2 border-red-500 pl-2" },
                            "Decision execution failed. Database write-back was unsuccessful."
                        ),
                        React.createElement(
                            "div",
                            { className: "flex gap-8" },
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase block" },
                                    "Execution Status"
                                ),
                                React.createElement(
                                    "span",
                                    { className: workflow.execution_status === 'COMPLETED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold' },
                                    workflow.execution_status
                                )
                            ),
                            workflow.execution_status === 'COMPLETED' && React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase block" },
                                    "Database Write-Back"
                                ),
                                "Successful"
                            ),
                            workflow.decision_id && React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase block" },
                                    "Decision ID"
                                ),
                                workflow.decision_id
                            )
                        )
                    ) : React.createElement(
                        "div",
                        { className: "text-slate-500" },
                        "Awaiting previous steps..."
                    )
                ),
                selectedStage === 'outcome' && React.createElement(
                    "div",
                    { className: "text-sm" },
                    workflow.outcome_status === 'ACTIVE' ? React.createElement(
                        "div",
                        { className: "flex items-center gap-4" },
                        React.createElement(
                            "p",
                            { className: "text-slate-400 italic" },
                            "Awaiting operational outcome data..."
                        ),
                        React.createElement(
                            "button",
                            { onClick: function () {
                                    return handleAction('provide-outcome', { actual_cost: workflow.expected_cost + 500, actual_delay: workflow.expected_delay + 2 });
                                }, disabled: loadingAction, className: "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2" },
                            loadingAction ? React.createElement(Icon, { name: "loader", size: 14, className: "animate-spin" }) : React.createElement(Icon, { name: "download", size: 14 }),
                            " Provide Actual Outcome"
                        )
                    ) : workflow.outcome_status === 'COMPLETED' ? React.createElement(
                        "div",
                        { className: "text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5 grid grid-cols-2 gap-8" },
                        React.createElement(
                            "div",
                            { className: "bg-white/5 p-3 rounded border border-white/5" },
                            React.createElement(
                                "div",
                                { className: "flex justify-between border-b border-white/10 pb-1 mb-2" },
                                React.createElement(
                                    "span",
                                    { className: "text-slate-400" },
                                    "Predicted Cost"
                                ),
                                React.createElement(
                                    "span",
                                    { className: "text-white" },
                                    "$",
                                    (workflow.expected_cost || 0).toLocaleString()
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "flex justify-between border-b border-white/10 pb-1 mb-2" },
                                React.createElement(
                                    "span",
                                    { className: "text-slate-400" },
                                    "Actual Cost"
                                ),
                                React.createElement(
                                    "span",
                                    { className: "text-white" },
                                    "$",
                                    (workflow.actual_cost || 0).toLocaleString()
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "flex justify-between pt-1" },
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase" },
                                    "Cost Variance"
                                ),
                                React.createElement(
                                    "strong",
                                    { className: workflow.actual_cost > workflow.expected_cost ? 'text-red-400' : 'text-emerald-400' },
                                    workflow.actual_cost > workflow.expected_cost ? '+' : '',
                                    "$",
                                    (workflow.actual_cost - workflow.expected_cost).toLocaleString()
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "bg-white/5 p-3 rounded border border-white/5" },
                            React.createElement(
                                "div",
                                { className: "flex justify-between border-b border-white/10 pb-1 mb-2" },
                                React.createElement(
                                    "span",
                                    { className: "text-slate-400" },
                                    "Predicted Delay"
                                ),
                                React.createElement(
                                    "span",
                                    { className: "text-white" },
                                    workflow.expected_delay,
                                    " hrs"
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "flex justify-between border-b border-white/10 pb-1 mb-2" },
                                React.createElement(
                                    "span",
                                    { className: "text-slate-400" },
                                    "Actual Delay"
                                ),
                                React.createElement(
                                    "span",
                                    { className: "text-white" },
                                    workflow.actual_delay,
                                    " hrs"
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "flex justify-between pt-1" },
                                React.createElement(
                                    "strong",
                                    { className: "text-white text-xs uppercase" },
                                    "Delay Variance"
                                ),
                                React.createElement(
                                    "strong",
                                    { className: workflow.actual_delay > workflow.expected_delay ? 'text-red-400' : 'text-emerald-400' },
                                    workflow.actual_delay > workflow.expected_delay ? '+' : '',
                                    (workflow.actual_delay - workflow.expected_delay).toLocaleString(),
                                    " hrs"
                                )
                            )
                        )
                    ) : React.createElement(
                        "div",
                        { className: "text-slate-500" },
                        "Awaiting previous steps..."
                    )
                ),
                selectedStage === 'learning' && React.createElement(
                    "div",
                    { className: "text-sm" },
                    workflow.learning_status === 'COMPLETED' ? React.createElement(
                        "div",
                        { className: "text-slate-300 bg-black/20 p-4 rounded-lg border border-emerald-500/20" },
                        React.createElement(
                            "p",
                            { className: "text-emerald-400 font-bold flex items-center gap-2" },
                            React.createElement(Icon, { name: "check-circle", size: 16 }),
                            " Feedback Recorded"
                        ),
                        React.createElement(
                            "p",
                            { className: "mt-2 text-xs text-slate-400" },
                            "Outcome evaluated and feedback recorded for future analysis. ",
                            React.createElement("br", null),
                            React.createElement(
                                "span",
                                { className: "italic" },
                                "Note: Model has not been retrained as there is no active retraining mechanism."
                            )
                        )
                    ) : React.createElement(
                        "div",
                        { className: "text-slate-500" },
                        "Awaiting actual outcomes..."
                    )
                )
            )
        )
    );
};

// Recommendation Card Component
var RecommendationCard = function RecommendationCard(_ref6) {
    var rec = _ref6.rec;
    var delay = _ref6.delay;

    var _useState6 = useState(false);

    var _useState62 = _slicedToArray(_useState6, 2);

    var expanded = _useState62[0];
    var setExpanded = _useState62[1];

    var priorityColors = {
        Critical: "bg-red-500/20 text-red-400 border-red-500/30",
        High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    };

    var diffColors = {
        High: "text-red-400",
        Medium: "text-yellow-400",
        Low: "text-emerald-400"
    };

    return React.createElement(
        motion.div,
        {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay: delay * 0.1 },
            className: "bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 " + (expanded ? 'shadow-[0_0_30px_rgba(6,182,212,0.15)] border-cyan-500/30' : 'hover:border-white/20 hover:shadow-lg')
        },
        React.createElement(
            "div",
            { className: "p-6 cursor-pointer", onClick: function () {
                    return setExpanded(!expanded);
                } },
            React.createElement(
                "div",
                { className: "flex justify-between items-start mb-4" },
                React.createElement(
                    "div",
                    { className: "flex items-center gap-3" },
                    React.createElement(
                        "div",
                        { className: "p-3 bg-white/5 rounded-xl border border-white/10" },
                        React.createElement(Icon, { name: rec.icon, color: "#22d3ee", size: 24 })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "h2",
                            { className: "text-lg font-bold text-white" },
                            rec.title
                        ),
                        React.createElement(
                            "p",
                            { className: "text-sm text-slate-400 mt-1" },
                            rec.description
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "flex flex-col items-end gap-2" },
                    React.createElement(
                        "span",
                        { className: "px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider " + priorityColors[rec.priority] },
                        rec.priority,
                        " Priority"
                    ),
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-500" },
                        "Updated ",
                        rec.updated
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "grid grid-cols-2 md:grid-cols-6 gap-4 bg-black/20 p-4 rounded-xl border border-white/5" },
                React.createElement(
                    "div",
                    { className: "flex flex-col items-center justify-center border-r border-white/5 last:border-0" },
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-400 uppercase tracking-wide mb-2" },
                        "AI Confidence"
                    ),
                    React.createElement(CircularProgress, { value: rec.confidence, color: "#34d399" })
                ),
                React.createElement(
                    "div",
                    { className: "flex flex-col items-center justify-center border-r border-white/5 last:border-0" },
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-400 uppercase tracking-wide mb-1" },
                        "Cost Savings"
                    ),
                    React.createElement(
                        "span",
                        { className: "text-xl font-bold text-emerald-400" },
                        "$",
                        rec.savings.toLocaleString()
                    )
                ),
                React.createElement(
                    "div",
                    { className: "flex flex-col items-center justify-center border-r border-white/5 last:border-0" },
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-400 uppercase tracking-wide mb-1" },
                        "Delay Reduction"
                    ),
                    React.createElement(
                        "span",
                        { className: "text-xl font-bold text-blue-400" },
                        rec.delayRed,
                        " hrs"
                    )
                ),
                React.createElement(
                    "div",
                    { className: "flex flex-col items-center justify-center border-r border-white/5 last:border-0" },
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-400 uppercase tracking-wide mb-1" },
                        "Projected ROI"
                    ),
                    React.createElement(
                        "span",
                        { className: "text-xl font-bold text-purple-400" },
                        rec.roi,
                        "%"
                    )
                ),
                React.createElement(
                    "div",
                    { className: "flex flex-col items-center justify-center border-r border-white/5 last:border-0" },
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-400 uppercase tracking-wide mb-1" },
                        "Difficulty"
                    ),
                    React.createElement(
                        "span",
                        { className: "text-sm font-bold uppercase " + diffColors[rec.difficulty] },
                        rec.difficulty
                    )
                ),
                React.createElement(
                    "div",
                    { className: "flex flex-col items-center justify-center" },
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-400 uppercase tracking-wide mb-1" },
                        "Opt Score"
                    ),
                    React.createElement(
                        "span",
                        { className: "text-xl font-bold text-cyan-400" },
                        rec.optScore,
                        "/100"
                    )
                )
            )
        ),
        React.createElement(
            AnimatePresence,
            null,
            expanded && React.createElement(
                motion.div,
                {
                    initial: { height: 0, opacity: 0 },
                    animate: { height: "auto", opacity: 1 },
                    exit: { height: 0, opacity: 0 },
                    className: "overflow-hidden border-t border-white/10 bg-slate-900/80"
                },
                React.createElement(
                    "div",
                    { className: "p-6 grid grid-cols-1 md:grid-cols-2 gap-8" },
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "h4",
                            { className: "text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2" },
                            React.createElement(Icon, { name: "sparkles", size: 16 }),
                            " Why this recommendation? (XAI)"
                        ),
                        React.createElement(
                            "p",
                            { className: "text-sm text-slate-300 leading-relaxed mb-6 bg-cyan-900/10 p-4 rounded-xl border border-cyan-500/20" },
                            rec.xaiText
                        ),
                        React.createElement(
                            "h4",
                            { className: "text-sm font-bold text-white mb-2" },
                            "Implementation Status"
                        ),
                        React.createElement(
                            "div",
                            { className: "flex justify-between text-xs text-slate-400 mb-1" },
                            React.createElement(
                                "span",
                                null,
                                "Progress"
                            ),
                            React.createElement(
                                "span",
                                null,
                                rec.progress,
                                "%"
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2" },
                            React.createElement(motion.div, {
                                className: "bg-blue-500 h-full rounded-full",
                                initial: { width: 0 },
                                animate: { width: rec.progress + "%" },
                                transition: { duration: 1 }
                            })
                        )
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "h4",
                            { className: "text-sm font-bold text-white mb-3 flex items-center gap-2" },
                            React.createElement(Icon, { name: "git-compare", size: 16, color: "#94a3b8" }),
                            " Alternative Actions Comparison"
                        ),
                        React.createElement(
                            "div",
                            { className: "overflow-x-auto" },
                            React.createElement(
                                "table",
                                { className: "w-full text-left border-collapse text-sm" },
                                React.createElement(
                                    "thead",
                                    null,
                                    React.createElement(
                                        "tr",
                                        { className: "border-b border-white/10 text-slate-400 text-xs uppercase" },
                                        React.createElement(
                                            "th",
                                            { className: "pb-2 font-medium" },
                                            "Action"
                                        ),
                                        React.createElement(
                                            "th",
                                            { className: "pb-2 font-medium" },
                                            "Est. Cost"
                                        ),
                                        React.createElement(
                                            "th",
                                            { className: "pb-2 font-medium" },
                                            "Impact"
                                        )
                                    )
                                ),
                                React.createElement(
                                    "tbody",
                                    { className: "text-slate-300" },
                                    rec.alternatives.map(function (alt, i) {
                                        return React.createElement(
                                            "tr",
                                            { key: i, className: "border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors" },
                                            React.createElement(
                                                "td",
                                                { className: "py-3 flex items-center gap-2" },
                                                alt.recommended && React.createElement(Icon, { name: "check-circle", size: 14, color: "#34d399" }),
                                                React.createElement(
                                                    "span",
                                                    { className: alt.recommended ? 'text-emerald-400 font-bold' : '' },
                                                    alt.name
                                                )
                                            ),
                                            React.createElement(
                                                "td",
                                                { className: "py-3" },
                                                alt.cost
                                            ),
                                            React.createElement(
                                                "td",
                                                { className: "py-3" },
                                                alt.impact
                                            )
                                        );
                                    })
                                )
                            )
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "bg-black/30 p-4 border-t border-white/5 flex flex-wrap gap-3 justify-end items-center" },
                    React.createElement(
                        "button",
                        { className: "px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" },
                        React.createElement(Icon, { name: "file-text", size: 14 }),
                        " Export PDF"
                    ),
                    React.createElement(
                        "button",
                        { className: "px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" },
                        React.createElement(Icon, { name: "git-compare", size: 14 }),
                        " Compare"
                    ),
                    React.createElement(
                        "button",
                        { className: "px-4 py-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors flex items-center gap-2" },
                        React.createElement(Icon, { name: "sliders", size: 14 }),
                        " Run Simulation"
                    ),
                    React.createElement(
                        "button",
                        { className: "px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2" },
                        React.createElement(Icon, { name: "play", size: 14 }),
                        " Apply Recommendation"
                    )
                )
            )
        )
    );
};

var ExecutiveDecisionCenter = function ExecutiveDecisionCenter() {
    var _useState7 = useState(false);

    var _useState72 = _slicedToArray(_useState7, 2);

    var loading = _useState72[0];
    var setLoading = _useState72[1];

    var _useState8 = useState(1.0);

    var _useState82 = _slicedToArray(_useState8, 2);

    var scale = _useState82[0];
    var setScale = _useState82[1];

    var _useState9 = useState(false);

    var _useState92 = _slicedToArray(_useState9, 2);

    var isExecuting = _useState92[0];
    var setIsExecuting = _useState92[1];

    var _useState10 = useState("idle");

    var _useState102 = _slicedToArray(_useState10, 2);

    var exportStatus = _useState102[0];
    var setExportStatus = _useState102[1];

    var handleExportReport = function handleExportReport() {
        var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step;

        return regeneratorRuntime.async(function handleExportReport$(context$2$0) {
            var _this2 = this;

            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    setExportStatus("generating");
                    context$2$0.prev = 1;
                    context$2$0.next = 4;
                    return regeneratorRuntime.awrap((function callee$2$0() {
                        var kpiObj, activeContainer, matchCount, records_count, filters, chips, charts, _step$value, key, chartInstance, payload, response, blob, url, a, dateStr;

                        return regeneratorRuntime.async(function callee$2$0$(context$3$0) {
                            while (1) switch (context$3$0.prev = context$3$0.next) {
                                case 0:
                                    kpiObj = {};

                                    topKPIs.forEach(function (kpi) {
                                        var formatted = kpi.value;
                                        if (kpi.isCurrency) {
                                            if (kpi.value >= 1000000) formatted = "$" + (kpi.value / 1000000).toFixed(2) + "M";else formatted = "$" + Math.floor(kpi.value / 1000) + "K";
                                        } else if (kpi.isDec) {
                                            formatted = kpi.value.toFixed(1);
                                        } else {
                                            formatted = Math.floor(kpi.value).toLocaleString();
                                        }
                                        kpiObj[kpi.label] = formatted + (kpi.suffix || "");
                                    });

                                    activeContainer = document.getElementById('active-filters-container');
                                    matchCount = document.getElementById('filter-matching-records');
                                    records_count = parseInt((matchCount ? matchCount.innerText : "1000").replace(/,/g, '')) || 1000;
                                    filters = [];

                                    if (activeContainer) {
                                        chips = activeContainer.querySelectorAll('span');

                                        chips.forEach(function (chip) {
                                            var text = chip.innerText.trim();
                                            if (text && !text.includes("No active filters")) {
                                                filters.push(text);
                                            }
                                        });
                                    }

                                    charts = {};

                                    if (!window.appCharts) {
                                        context$3$0.next = 28;
                                        break;
                                    }

                                    _iteratorNormalCompletion = true;
                                    _didIteratorError = false;
                                    _iteratorError = undefined;
                                    context$3$0.prev = 12;

                                    for (_iterator = Object.entries(window.appCharts)[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                        _step$value = _slicedToArray(_step.value, 2);
                                        key = _step$value[0];
                                        chartInstance = _step$value[1];

                                        try {
                                            charts[key] = chartInstance.toBase64Image();
                                        } catch (e) {
                                            console.warn("Could not export chart:", key);
                                        }
                                    }
                                    context$3$0.next = 20;
                                    break;

                                case 16:
                                    context$3$0.prev = 16;
                                    context$3$0.t0 = context$3$0["catch"](12);
                                    _didIteratorError = true;
                                    _iteratorError = context$3$0.t0;

                                case 20:
                                    context$3$0.prev = 20;
                                    context$3$0.prev = 21;

                                    if (!_iteratorNormalCompletion && _iterator["return"]) {
                                        _iterator["return"]();
                                    }

                                case 23:
                                    context$3$0.prev = 23;

                                    if (!_didIteratorError) {
                                        context$3$0.next = 26;
                                        break;
                                    }

                                    throw _iteratorError;

                                case 26:
                                    return context$3$0.finish(23);

                                case 27:
                                    return context$3$0.finish(20);

                                case 28:
                                    payload = {
                                        records_count: records_count,
                                        kpis: kpiObj,
                                        filters: filters,
                                        charts: charts
                                    };
                                    context$3$0.next = 31;
                                    return regeneratorRuntime.awrap(fetch('http://localhost:8080/export-board-report', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    }));

                                case 31:
                                    response = context$3$0.sent;

                                    if (response.ok) {
                                        context$3$0.next = 34;
                                        break;
                                    }

                                    throw new Error("Failed to export report");

                                case 34:
                                    context$3$0.next = 36;
                                    return regeneratorRuntime.awrap(response.blob());

                                case 36:
                                    blob = context$3$0.sent;
                                    url = window.URL.createObjectURL(blob);
                                    a = document.createElement('a');

                                    a.href = url;
                                    dateStr = new Date().toISOString().split('T')[0];

                                    a.download = "SupplyPrescript_Executive_Report_" + dateStr + ".pdf";
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    window.URL.revokeObjectURL(url);

                                    setExportStatus("success");
                                    setTimeout(function () {
                                        return setExportStatus("idle");
                                    }, 3000);

                                case 48:
                                case "end":
                                    return context$3$0.stop();
                            }
                        }, null, _this2, [[12, 16, 20, 28], [21,, 23, 27]]);
                    })());

                case 4:
                    context$2$0.next = 11;
                    break;

                case 6:
                    context$2$0.prev = 6;
                    context$2$0.t0 = context$2$0["catch"](1);

                    console.error(context$2$0.t0);
                    setExportStatus("error");
                    setTimeout(function () {
                        return setExportStatus("idle");
                    }, 3000);

                case 11:
                case "end":
                    return context$2$0.stop();
            }
        }, null, _this, [[1, 6]]);
    };

    var handleExecuteAll = function handleExecuteAll() {
        var i;
        return regeneratorRuntime.async(function handleExecuteAll$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    setIsExecuting(true);
                    if (window.showNotification) window.showNotification("Auto-Execute", "Running optimization audits and write-backs...");

                    context$2$0.prev = 2;
                    i = 1;

                case 4:
                    if (!(i <= 3)) {
                        context$2$0.next = 12;
                        break;
                    }

                    context$2$0.next = 7;
                    return regeneratorRuntime.awrap(fetch('http://localhost:8080/execute-decision', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            shipment_id: 100 + i,
                            required_quantity: 800 + i * 50,
                            maximum_budget: 15000 + i * 1000
                        })
                    }));

                case 7:
                    context$2$0.next = 9;
                    return regeneratorRuntime.awrap(new Promise(function (r) {
                        return setTimeout(r, 600);
                    }));

                case 9:
                    i++;
                    context$2$0.next = 4;
                    break;

                case 12:
                    // Delay between executions

                    if (window.showNotification) window.showNotification("Success", "All top recommendations executed successfully.");
                    context$2$0.next = 19;
                    break;

                case 15:
                    context$2$0.prev = 15;
                    context$2$0.t0 = context$2$0["catch"](2);

                    console.error(context$2$0.t0);
                    if (window.showNotification) window.showNotification("Error", "Bulk execution failed. Check logs.");

                case 19:
                    context$2$0.prev = 19;

                    setIsExecuting(false);
                    return context$2$0.finish(19);

                case 22:
                case "end":
                    return context$2$0.stop();
            }
        }, null, _this, [[2, 15, 19, 22]]);
    };

    useEffect(function () {
        var handleGlobalFilter = function handleGlobalFilter(e) {
            setLoading(true);
            setTimeout(function () {
                if (e.detail && e.detail.scaleFactor) {
                    setScale(e.detail.scaleFactor);
                }
                setLoading(false);
            }, 800);
        };
        window.addEventListener('globalFilterApplied', handleGlobalFilter);
        return function () {
            return window.removeEventListener('globalFilterApplied', handleGlobalFilter);
        };
    }, []);

    // Top KPI Data
    var topKPIs = [{ label: "Total Estimated Savings", value: 2450000 * scale, isCurrency: true, trend: 14.2 }, { label: "Average Delay Reduction", value: 18.5, isDec: true, suffix: " hrs", trend: 22.1 }, { label: "Overall AI Confidence", value: Math.min(100, 92.4 * (1 + (scale > 1 ? 0.05 : -0.05))), isDec: true, suffix: "%", trend: 3.5 }, { label: "Recommendations Implemented", value: Math.floor(142 * scale), trend: 12 }, { label: "Pending Decisions", value: Math.max(1, Math.floor(8 * scale)), trend: -2 }, { label: "Projected ROI", value: 315, suffix: "%", trend: 45 }];

    // Mock Data based on the 5 original text recommendations
    var recommendations = [{
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
        alternatives: [{ name: "Dynamic Routing (Recommended)", cost: "$45k", impact: "-24 hrs delay", recommended: true }, { name: "Static Rerouting", cost: "$10k", impact: "-5 hrs delay", recommended: false }, { name: "Do Nothing", cost: "$0", impact: "+12 hrs delay (Risk)", recommended: false }]
    }, {
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
        alternatives: [{ name: "Targeted Training & Maint.", cost: "$25k", impact: "-15 hrs delay", recommended: true }, { name: "Fleet Replacement", cost: "$1.2M", impact: "-18 hrs delay", recommended: false }]
    }, {
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
        alternatives: [{ name: "Algorithmic Tiered SLA", cost: "$50k", impact: "Penalty drop 64%", recommended: true }, { name: "Manual Prioritization", cost: "$80k/yr", impact: "Penalty drop 20%", recommended: false }]
    }, {
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
        alternatives: [{ name: "Dynamic ETA Padding", cost: "$15k", impact: "Zero SLA breach", recommended: true }, { name: "Weather Rerouting", cost: "$90k", impact: "Partial mitigation", recommended: false }]
    }, {
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
        alternatives: [{ name: "Hybrid 3PL Model", cost: "$500k", impact: "+35% CapEx efficiency", recommended: true }, { name: "Purchase New Fleet", cost: "$3.5M", impact: "+10% CapEx efficiency", recommended: false }]
    }];

    return React.createElement(
        "div",
        { className: "relative w-full min-h-[800px] rounded-3xl p-2 font-sans" },
        React.createElement(
            "div",
            { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-4" },
            React.createElement(
                "div",
                null,
                React.createElement(
                    "h2",
                    { className: "text-3xl font-bold text-white flex items-center gap-3" },
                    React.createElement(Icon, { name: "cpu", size: 32, color: "#22d3ee" }),
                    "AI Executive Decision Center"
                ),
                React.createElement(
                    "p",
                    { className: "text-slate-400 text-sm mt-1" },
                    "Prescriptive analytics, automated ROI forecasting, and actionable strategic directives."
                )
            ),
            React.createElement(
                "div",
                { className: "flex gap-3" },
                React.createElement(
                    "button",
                    {
                        onClick: handleExportReport,
                        disabled: exportStatus === 'generating',
                        className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors flex items-center gap-2 " + (exportStatus === 'generating' ? 'opacity-70 cursor-not-allowed' : '') },
                    exportStatus === 'generating' ? React.createElement(Icon, { name: "loader", size: 16, className: "animate-spin" }) : exportStatus === 'success' ? React.createElement(Icon, { name: "check", size: 16, color: "#34d399" }) : exportStatus === 'error' ? React.createElement(Icon, { name: "x", size: 16, color: "#ef4444" }) : React.createElement(Icon, { name: "download", size: 16 }),
                    exportStatus === 'generating' ? "Generating PDF..." : exportStatus === 'success' ? "Report Exported ✓" : exportStatus === 'error' ? "Export Failed" : "Export Board Report"
                ),
                React.createElement(
                    "button",
                    {
                        onClick: handleExecuteAll,
                        disabled: isExecuting,
                        className: "px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 " + (isExecuting ? 'bg-cyan-800 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]')
                    },
                    isExecuting ? React.createElement(Icon, { name: "loader", size: 16, className: "animate-spin" }) : React.createElement(Icon, { name: "zap", size: 16 }),
                    isExecuting ? "Executing..." : "Auto-Execute All"
                )
            )
        ),
        React.createElement(
            "div",
            { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8" },
            topKPIs.map(function (kpi, i) {
                return React.createElement(
                    motion.div,
                    {
                        key: i,
                        initial: { opacity: 0, scale: 0.9 },
                        animate: { opacity: 1, scale: 1 },
                        transition: { duration: 0.4, delay: i * 0.1 },
                        className: "bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col items-center text-center hover:bg-slate-800/60 transition-colors"
                    },
                    React.createElement(
                        "span",
                        { className: "text-[10px] text-slate-400 uppercase tracking-wider mb-2" },
                        kpi.label
                    ),
                    React.createElement(
                        "div",
                        { className: "text-2xl font-bold text-white mb-2" },
                        React.createElement(AnimatedNumber, { value: kpi.value, isCurrency: kpi.isCurrency, isDec: kpi.isDec, suffix: kpi.suffix })
                    ),
                    React.createElement(TrendBadge, { value: kpi.trend })
                );
            })
        ),
        React.createElement(ClosedLoopTimeline, null),
        React.createElement(
            "div",
            { className: "flex flex-col gap-5" },
            React.createElement(
                "h3",
                { className: "text-xl font-bold text-white mb-2 flex items-center gap-2" },
                React.createElement(Icon, { name: "target", size: 24, color: "#a78bfa" }),
                " Recommended Strategic Actions"
            ),
            recommendations.map(function (rec, i) {
                return React.createElement(RecommendationCard, { key: rec.id, rec: rec, delay: i });
            })
        )
    );
};

// Mount
var rootNode = document.getElementById('react-reports-root');
if (rootNode) {
    var root = ReactDOM.createRoot(rootNode);
    root.render(React.createElement(ExecutiveDecisionCenter, null));
}
/* Connecting Line */ /* Details Panel */ /* Header Area */ /* Metrics Grid */ /* Expandable Section */ /* Left Column: XAI & Progress */ /* Right Column: Alternative Comparison */ /* Action Buttons */
// Mocking a bulk execution by calling the endpoint a few times
/* Top Header */ /* Executive KPIs */ /* Recommendations List */
