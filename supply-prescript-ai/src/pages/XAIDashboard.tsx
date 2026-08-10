import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Card, CardContent, Typography, LinearProgress, Grid, Chip, Divider, 
    CircularProgress, Button, Select, MenuItem, Slider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import { CheckCircle, Info, Sliders, RotateCcw, AlertTriangle, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

const API_BASE = "http://localhost:8080";

export default function XAIDashboard() {
    const [shipmentId, setShipmentId] = useState(0);
    const [predictionData, setPredictionData] = useState<any>(null);
    const [recommendationData, setRecommendationData] = useState<any>(null);
    const [confidenceData, setConfidenceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // What-If Simulator State
    const [traffic, setTraffic] = useState<string>("Clear");
    const [temperature, setTemperature] = useState<number>(25.0);
    const [humidity, setHumidity] = useState<number>(60.0);
    const [priority, setPriority] = useState<number>(5);
    const [assetUtilization, setAssetUtilization] = useState<number>(75.0);
    const [budget, setBudget] = useState<number>(12500);
    const [routeOption, setRouteOption] = useState<string>("Auto");
    
    const [whatIfData, setWhatIfData] = useState<any>(null);

    useEffect(() => {
        fetchShipmentData();
    }, [shipmentId]);

    const fetchShipmentData = async () => {
        setLoading(true);
        try {
            const predRes = await axios.get(`${API_BASE}/prediction-explanation/${shipmentId}`);
            setPredictionData(predRes.data);
            
            const recRes = await axios.get(`${API_BASE}/recommendation-explanation/${shipmentId}`);
            setRecommendationData(recRes.data);
            
            const confRes = await axios.get(`${API_BASE}/confidence-score/${shipmentId}`);
            setConfidenceData(confRes.data);
            
            // Initialize what-if baseline
            const initialTemp = predRes.data?.top_features?.find((f: any) => f.feature === 'Temperature')?.value ?? 25.0;
            const initialHum = predRes.data?.top_features?.find((f: any) => f.feature === 'Humidity')?.value ?? 60.0;
            const initialUtil = predRes.data?.top_features?.find((f: any) => f.feature === 'Asset_Utilization')?.value ?? 75.0;
            const initialFreq = predRes.data?.top_features?.find((f: any) => f.feature === 'User_Purchase_Frequency')?.value ?? 5;
            
            setTemperature(initialTemp);
            setHumidity(initialHum);
            setAssetUtilization(initialUtil);
            setPriority(initialFreq);
            setTraffic("Clear");
            setBudget(12500);
            setRouteOption("Auto");

            runSimulation({
                Traffic_Status: "Clear",
                Temperature: initialTemp,
                Humidity: initialHum,
                Asset_Utilization: initialUtil,
                User_Purchase_Frequency: initialFreq
            }, 12500, "Auto");

        } catch (error) {
            console.error("Error fetching XAI data", error);
        }
        setLoading(false);
    };

    const runSimulation = async (
        mods = {
            Traffic_Status: traffic,
            Temperature: temperature,
            Humidity: humidity,
            Asset_Utilization: assetUtilization,
            User_Purchase_Frequency: priority
        },
        maxBudget = budget,
        mode = routeOption
    ) => {
        try {
            const res = await axios.post(`${API_BASE}/simulate-what-if`, {
                shipment_id: shipmentId,
                modifications: mods,
                maximum_budget: maxBudget,
                selected_mode: mode
            });
            setWhatIfData(res.data);
        } catch (err) {
            console.error("What-if simulation error", err);
        }
    };

    const handleReset = () => {
        if (!predictionData) return;
        const initialTemp = predictionData?.top_features?.find((f: any) => f.feature === 'Temperature')?.value ?? 25.0;
        const initialHum = predictionData?.top_features?.find((f: any) => f.feature === 'Humidity')?.value ?? 60.0;
        const initialUtil = predictionData?.top_features?.find((f: any) => f.feature === 'Asset_Utilization')?.value ?? 75.0;
        const initialFreq = predictionData?.top_features?.find((f: any) => f.feature === 'User_Purchase_Frequency')?.value ?? 5;
        
        setTraffic("Clear");
        setTemperature(initialTemp);
        setHumidity(initialHum);
        setAssetUtilization(initialUtil);
        setPriority(initialFreq);
        setBudget(12500);
        setRouteOption("Auto");

        runSimulation({
            Traffic_Status: "Clear",
            Temperature: initialTemp,
            Humidity: initialHum,
            Asset_Utilization: initialUtil,
            User_Purchase_Frequency: initialFreq
        }, 12500, "Auto");
    };

    const handleTrafficChange = (val: string) => {
        setTraffic(val);
        runSimulation({ Traffic_Status: val, Temperature: temperature, Humidity: humidity, Asset_Utilization: assetUtilization, User_Purchase_Frequency: priority }, budget, routeOption);
    };

    const handleTempChange = (val: number) => {
        setTemperature(val);
        runSimulation({ Traffic_Status: traffic, Temperature: val, Humidity: humidity, Asset_Utilization: assetUtilization, User_Purchase_Frequency: priority }, budget, routeOption);
    };

    const handleHumidityChange = (val: number) => {
        setHumidity(val);
        runSimulation({ Traffic_Status: traffic, Temperature: temperature, Humidity: val, Asset_Utilization: assetUtilization, User_Purchase_Frequency: priority }, budget, routeOption);
    };

    const handlePriorityChange = (val: number) => {
        setPriority(val);
        runSimulation({ Traffic_Status: traffic, Temperature: temperature, Humidity: humidity, Asset_Utilization: assetUtilization, User_Purchase_Frequency: val }, budget, routeOption);
    };

    const handleUtilizationChange = (val: number) => {
        setAssetUtilization(val);
        runSimulation({ Traffic_Status: traffic, Temperature: temperature, Humidity: humidity, Asset_Utilization: val, User_Purchase_Frequency: priority }, budget, routeOption);
    };

    const handleBudgetChange = (val: number) => {
        setBudget(val);
        runSimulation({ Traffic_Status: traffic, Temperature: temperature, Humidity: humidity, Asset_Utilization: assetUtilization, User_Purchase_Frequency: priority }, val, routeOption);
    };

    const handleRouteOptionChange = (val: string) => {
        setRouteOption(val);
        runSimulation({ Traffic_Status: traffic, Temperature: temperature, Humidity: humidity, Asset_Utilization: assetUtilization, User_Purchase_Frequency: priority }, budget, val);
    };

    if (loading || !predictionData) {
        return <div className="flex h-screen items-center justify-center bg-gray-900 text-white"><CircularProgress /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 p-6 font-sans">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Supply Prescript: Explainable AI</h1>
                    <p className="text-gray-400 mt-1">Transparent AI-driven predictive logistics & prescriptive recommendations</p>
                </div>
                <div className="flex space-x-4">
                    <Button variant="contained" color="primary" onClick={() => setShipmentId(s => s === 0 ? 99 : s - 1)}>Prev Shipment</Button>
                    <Chip label={`Shipment ID: ${shipmentId}`} color="secondary" className="text-lg font-bold" />
                    <Button variant="contained" color="primary" onClick={() => setShipmentId(s => s + 1)}>Next Shipment</Button>
                </div>
            </div>

            <Grid container spacing={3}>
                
                {/* Module 1: Model Explanation & Module 3: AI Explanation Panel */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <CardContent>
                            <div className="flex justify-between items-center mb-4">
                                <Typography variant="h5" className="font-bold">Shipment Risk Assessment</Typography>
                                <Chip label={predictionData.risk_level} color={predictionData.risk_level === 'High' ? 'error' : 'warning'} />
                            </div>
                            
                            <Grid container spacing={3} className="mb-6">
                                <Grid size={{ xs: 4 }}>
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                        <p className="text-gray-400 text-sm uppercase">Predicted Delay</p>
                                        <p className="text-3xl font-bold text-red-400">{predictionData.predicted_delay_mins} mins</p>
                                    </div>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                        <p className="text-gray-400 text-sm uppercase">Probability</p>
                                        <p className="text-3xl font-bold text-yellow-400">{predictionData.delay_probability}</p>
                                    </div>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                        <p className="text-gray-400 text-sm uppercase">AI Confidence</p>
                                        <p className="text-3xl font-bold text-green-400">{predictionData.confidence_score}</p>
                                    </div>
                                </Grid>
                            </Grid>

                            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 3 }} />
                            
                            <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-xl flex items-start space-x-4">
                                <Info className="text-blue-400 mt-1 flex-shrink-0" size={28} />
                                <div>
                                    <h3 className="text-lg font-bold text-blue-300 mb-1">Why did the AI predict this?</h3>
                                    <p className="text-gray-300 leading-relaxed text-lg">{predictionData.business_explanation}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Module 5: Confidence Indicators */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3, height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" className="font-bold mb-4">System Confidence Indicators</Typography>
                            {confidenceData && Object.entries(confidenceData).map(([key, val]: any) => (
                                <div key={key} className="mb-5">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-bold">{val}%</span>
                                    </div>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={val} 
                                        sx={{ 
                                            height: 10, 
                                            borderRadius: 5,
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            '& .MuiLinearProgress-bar': { bgcolor: val > 90 ? '#4ade80' : val > 75 ? '#fbbf24' : '#f87171' }
                                        }} 
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* ================================================== */}
                {/* WHAT-IF DECISION SIMULATOR (NEW FEATURE)           */}
                {/* ================================================== */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <CardContent>
                            {/* Simulator Header */}
                            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-500/40">
                                        <Sliders className="text-indigo-400" size={24} />
                                    </div>
                                    <div>
                                        <Typography variant="h5" className="font-bold text-white">What-If Decision Simulator</Typography>
                                        <p className="text-xs text-gray-400">Modify operational variables to dynamically recalculate predictions, SciPy LP optimization, risk & budget constraints.</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {whatIfData && (
                                        <Chip 
                                            icon={whatIfData.execution_blocked ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                                            label={whatIfData.constraint_status}
                                            color={whatIfData.execution_blocked ? "error" : "success"}
                                            className="font-bold px-1"
                                        />
                                    )}
                                    <Button 
                                        variant="outlined" 
                                        color="secondary" 
                                        startIcon={<RotateCcw size={16} />} 
                                        onClick={handleReset}
                                        sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#d1d5db', '&:hover': { borderColor: '#fff' } }}
                                    >
                                        Reset Scenario
                                    </Button>
                                </div>
                            </div>

                            {/* Interactive Operational Controls */}
                            <Grid container spacing={3} className="mb-6">
                                {/* Traffic Condition */}
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                                    <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-700/70 h-full">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Traffic Condition</label>
                                        <Select
                                            fullWidth
                                            size="small"
                                            value={traffic}
                                            onChange={(e) => handleTrafficChange(e.target.value)}
                                            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '& .MuiSvgIcon-root': { color: 'white' } }}
                                        >
                                            <MenuItem value="Clear">Clear Traffic</MenuItem>
                                            <MenuItem value="Heavy">Heavy Traffic (+35m)</MenuItem>
                                            <MenuItem value="Detour">Detour Route (+18m)</MenuItem>
                                        </Select>
                                    </div>
                                </Grid>

                                {/* Weather Temperature & Humidity */}
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                                    <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-700/70 h-full">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Weather Temp</label>
                                            <span className="text-sm font-bold text-indigo-300">{temperature}°C</span>
                                        </div>
                                        <Slider
                                            size="small"
                                            min={15}
                                            max={45}
                                            step={0.5}
                                            value={temperature}
                                            onChange={(_, val) => handleTempChange(val as number)}
                                            sx={{ color: '#818cf8' }}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Humidity</label>
                                            <span className="text-xs font-bold text-gray-300">{humidity}%</span>
                                        </div>
                                        <Slider
                                            size="small"
                                            min={30}
                                            max={95}
                                            step={1}
                                            value={humidity}
                                            onChange={(_, val) => handleHumidityChange(val as number)}
                                            sx={{ color: '#38bdf8' }}
                                        />
                                    </div>
                                </Grid>

                                {/* Delivery Priority */}
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                                    <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-700/70 h-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Priority</label>
                                            <span className="text-sm font-bold text-amber-400">Level {priority}</span>
                                        </div>
                                        <Slider
                                            size="small"
                                            min={1}
                                            max={10}
                                            step={1}
                                            value={priority}
                                            onChange={(_, val) => handlePriorityChange(val as number)}
                                            sx={{ color: '#fbbf24' }}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{priority >= 8 ? 'High Priority Client' : priority >= 5 ? 'Standard Priority' : 'Low Priority'}</p>
                                    </div>
                                </Grid>

                                {/* Vehicle Availability / Utilization */}
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                                    <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-700/70 h-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle Avail.</label>
                                            <span className="text-sm font-bold text-emerald-400">{assetUtilization}%</span>
                                        </div>
                                        <Slider
                                            size="small"
                                            min={10}
                                            max={100}
                                            step={1}
                                            value={assetUtilization}
                                            onChange={(_, val) => handleUtilizationChange(val as number)}
                                            sx={{ color: '#34d399' }}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{assetUtilization > 85 ? 'Congested / Low Fleet' : 'Normal Fleet Status'}</p>
                                    </div>
                                </Grid>

                                {/* Hard Budget Constraint */}
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                                    <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-700/70 h-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hard Budget</label>
                                            <span className="text-sm font-bold text-emerald-300">₹{budget.toLocaleString()}</span>
                                        </div>
                                        <Slider
                                            size="small"
                                            min={3000}
                                            max={35000}
                                            step={500}
                                            value={budget}
                                            onChange={(_, val) => handleBudgetChange(val as number)}
                                            sx={{ color: '#4ade80' }}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">SciPy Budget Cap</p>
                                    </div>
                                </Grid>

                                {/* Route Option Override */}
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                                    <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-700/70 h-full">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Route Option</label>
                                        <Select
                                            fullWidth
                                            size="small"
                                            value={routeOption}
                                            onChange={(e) => handleRouteOptionChange(e.target.value)}
                                            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '& .MuiSvgIcon-root': { color: 'white' } }}
                                        >
                                            <MenuItem value="Auto">Auto (SciPy LP)</MenuItem>
                                            <MenuItem value="Standard Truck">Standard Truck</MenuItem>
                                            <MenuItem value="Air Freight">Air Freight</MenuItem>
                                            <MenuItem value="Rail">Rail Freight</MenuItem>
                                        </Select>
                                    </div>
                                </Grid>
                            </Grid>

                            {/* BEFORE VS AFTER COMPARISON */}
                            {whatIfData && (
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, lg: 7 }}>
                                        <TableContainer component={Paper} sx={{ bgcolor: 'rgba(17, 24, 39, 0.9)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#9ca3af', fontWeight: 'bold' }}>OPERATIONAL PARAMETER</TableCell>
                                                        <TableCell sx={{ color: '#60a5fa', fontWeight: 'bold' }} align="center">CURRENT</TableCell>
                                                        <TableCell sx={{ color: '#c084fc', fontWeight: 'bold' }} align="center">WHAT-IF</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#d1d5db' }}>Traffic Condition</TableCell>
                                                        <TableCell sx={{ color: '#e5e7eb' }} align="center">{whatIfData.current.traffic}</TableCell>
                                                        <TableCell sx={{ color: '#f3e8ff', fontWeight: 'bold' }} align="center">{whatIfData.what_if.traffic}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#d1d5db' }}>Weather Condition</TableCell>
                                                        <TableCell sx={{ color: '#e5e7eb' }} align="center">{whatIfData.current.weather}</TableCell>
                                                        <TableCell sx={{ color: '#f3e8ff', fontWeight: 'bold' }} align="center">{whatIfData.what_if.weather}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#d1d5db' }}>Delivery Priority</TableCell>
                                                        <TableCell sx={{ color: '#e5e7eb' }} align="center">Level {whatIfData.current.priority}</TableCell>
                                                        <TableCell sx={{ color: '#f3e8ff', fontWeight: 'bold' }} align="center">Level {whatIfData.what_if.priority}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#d1d5db' }}>Vehicle Availability</TableCell>
                                                        <TableCell sx={{ color: '#e5e7eb' }} align="center">{whatIfData.current.vehicle_availability}</TableCell>
                                                        <TableCell sx={{ color: '#f3e8ff', fontWeight: 'bold' }} align="center">{whatIfData.what_if.vehicle_availability}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#d1d5db' }}>Hard Budget Limit</TableCell>
                                                        <TableCell sx={{ color: '#e5e7eb' }} align="center">{whatIfData.current.budget_formatted}</TableCell>
                                                        <TableCell sx={{ color: '#f3e8ff', fontWeight: 'bold' }} align="center">{whatIfData.what_if.budget_formatted}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#d1d5db' }}>Route Option</TableCell>
                                                        <TableCell sx={{ color: '#e5e7eb' }} align="center">{whatIfData.current.route_option}</TableCell>
                                                        <TableCell sx={{ color: '#f3e8ff', fontWeight: 'bold' }} align="center">{whatIfData.what_if.route_option}</TableCell>
                                                    </TableRow>
                                                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                                                        <TableCell sx={{ color: '#f87171', fontWeight: 'bold' }}>Predicted Delay</TableCell>
                                                        <TableCell sx={{ color: '#f87171', fontWeight: 'bold' }} align="center">{whatIfData.current.predicted_delay_mins} min</TableCell>
                                                        <TableCell sx={{ color: whatIfData.what_if.predicted_delay_mins < whatIfData.current.predicted_delay_mins ? '#4ade80' : '#f87171', fontWeight: 'bold' }} align="center">
                                                            {whatIfData.what_if.predicted_delay_mins} min
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#d1d5db', fontWeight: 'bold' }}>Risk Level</TableCell>
                                                        <TableCell align="center">
                                                            <Chip size="small" label={whatIfData.current.risk_level} color={whatIfData.current.risk_level === 'High' ? 'error' : 'warning'} />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip size="small" label={whatIfData.what_if.risk_level} color={whatIfData.what_if.risk_level === 'High' ? 'error' : whatIfData.what_if.risk_level === 'Medium' ? 'warning' : 'success'} />
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#fbbf24', fontWeight: 'bold' }}>Estimated Cost</TableCell>
                                                        <TableCell sx={{ color: '#fbbf24', fontWeight: 'bold' }} align="center">{whatIfData.current.cost_formatted}</TableCell>
                                                        <TableCell sx={{ color: '#fbbf24', fontWeight: 'bold' }} align="center">{whatIfData.what_if.cost_formatted}</TableCell>
                                                    </TableRow>
                                                    <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)' }}>
                                                        <TableCell sx={{ color: '#34d399', fontWeight: 'bold' }}>Recommendation</TableCell>
                                                        <TableCell sx={{ color: '#34d399', fontWeight: 'bold' }} align="center">{whatIfData.current.recommendation}</TableCell>
                                                        <TableCell sx={{ color: '#34d399', fontWeight: 'bold' }} align="center">{whatIfData.what_if.recommendation}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>

                                    {/* RECOMMENDATION EXPLANATION & BUDGET SAFETY PANEL */}
                                    <Grid size={{ xs: 12, lg: 5 }}>
                                        <div className="flex flex-col h-full justify-between space-y-4">
                                            {/* Recommended Action Box */}
                                            <div className="bg-gray-900/90 p-5 rounded-2xl border border-emerald-500/30">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <CheckCircle className="text-emerald-400" size={22} />
                                                    <h4 className="text-sm uppercase font-bold text-gray-300">Recommended Action</h4>
                                                </div>
                                                <div className="text-2xl font-bold text-emerald-400 mb-3">
                                                    {whatIfData.recommended_action}
                                                </div>
                                                <p className="text-xs text-gray-400">Calculated dynamically by SciPy Linear Programming optimization subject to hard budget constraints.</p>
                                            </div>

                                            {/* Why did the recommendation change? */}
                                            <div className="bg-gray-900/90 p-5 rounded-2xl border border-indigo-500/30 flex-1">
                                                <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Info size={18} className="text-indigo-400" /> Why did the recommendation change?
                                                </h4>
                                                <ul className="space-y-2 text-sm text-gray-300">
                                                    {whatIfData.why_changed.map((factor: string, i: number) => (
                                                        <li key={i} className="flex items-start space-x-2">
                                                            <ArrowRight size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                                                            <span>{factor}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Budget Safety Guardrail */}
                                            <div className={`p-4 rounded-xl border flex items-center justify-between ${
                                                whatIfData.execution_blocked 
                                                    ? 'bg-red-950/40 border-red-500/50 text-red-300' 
                                                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                            }`}>
                                                <div className="flex items-center space-x-3">
                                                    {whatIfData.execution_blocked ? <AlertTriangle className="text-red-400" size={24} /> : <ShieldCheck className="text-emerald-400" size={24} />}
                                                    <div>
                                                        <div className="font-bold text-sm">
                                                            {whatIfData.execution_blocked ? 'Execution Blocked: Constraint Violated' : 'Budget Safety Validation'}
                                                        </div>
                                                        <div className="text-xs opacity-80">
                                                            Cost: {whatIfData.what_if.cost_formatted} | Budget: {whatIfData.what_if.budget_formatted}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Chip 
                                                    label={whatIfData.constraint_status} 
                                                    color={whatIfData.execution_blocked ? "error" : "success"}
                                                    className="font-bold"
                                                />
                                            </div>
                                        </div>
                                    </Grid>
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Module 2: SHAP Custom Bar Chart Visualizations */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" className="font-bold mb-4">SHAP Feature Contributions (Local Explanation)</Typography>
                            <div className="w-full rounded-xl border border-gray-700 bg-gray-900 p-6 space-y-4">
                                {predictionData.top_features.map((feature: any, index: number) => {
                                    const maxImpact = Math.max(...predictionData.top_features.map((f: any) => f.impact));
                                    const widthPct = Math.max(5, (feature.impact / maxImpact) * 100);
                                    const isPositive = feature.contribution > 0;
                                    
                                    return (
                                        <div key={index} className="flex items-center">
                                            <div className="w-1/3 text-right pr-4 text-sm font-medium text-gray-300 truncate">
                                                {feature.business_name}
                                                <div className="text-xs text-gray-500">Value: {feature.value}</div>
                                            </div>
                                            <div className="w-2/3 flex items-center">
                                                {/* Left side (negative impact / reduces delay) */}
                                                <div className="w-1/2 flex justify-end pr-1">
                                                    {!isPositive && (
                                                        <div 
                                                            className="h-6 bg-green-500 rounded-l flex items-center justify-start pl-2 text-xs font-bold text-green-900" 
                                                            style={{ width: `${widthPct}%` }}
                                                        >
                                                            {feature.contribution}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Center line */}
                                                <div className="h-8 w-px bg-gray-600"></div>
                                                {/* Right side (positive impact / increases delay) */}
                                                <div className="w-1/2 flex justify-start pl-1">
                                                    {isPositive && (
                                                        <div 
                                                            className="h-6 bg-red-500 rounded-r flex items-center justify-end pr-2 text-xs font-bold text-red-900" 
                                                            style={{ width: `${widthPct}%` }}
                                                        >
                                                            +{feature.contribution}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Module 4 & 9: Recommendation Explanation & Before vs After */}
                {recommendationData && recommendationData.Recommendation && (
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'white', borderRadius: 3 }}>
                            <CardContent>
                                <div className="flex items-center space-x-3 mb-4">
                                    <CheckCircle className="text-emerald-400" size={32} />
                                    <Typography variant="h5" className="font-bold text-emerald-400">Prescriptive AI Recommendation: {recommendationData.Recommendation}</Typography>
                                </div>
                                
                                <p className="text-lg text-gray-200 mb-6 border-l-4 border-emerald-500 pl-4">{recommendationData.Reason}</p>
                                
                                <Grid container spacing={4}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <div className="bg-gray-800/80 p-5 rounded-xl border border-gray-700">
                                            <h4 className="text-gray-400 uppercase text-sm font-bold mb-3">Before Action</h4>
                                            <div className="flex justify-between items-center mb-2">
                                                <span>Predicted Delay:</span>
                                                <span className="text-red-400 font-bold text-lg">{predictionData.predicted_delay_mins} mins</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Risk Level:</span>
                                                <span className="text-red-400 font-bold">{predictionData.risk_level}</span>
                                            </div>
                                        </div>
                                    </Grid>
                                    
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <div className="bg-emerald-900/30 p-5 rounded-xl border border-emerald-500/30">
                                            <h4 className="text-emerald-400 uppercase text-sm font-bold mb-3">Expected Outcome</h4>
                                            <div className="flex justify-between items-center mb-2">
                                                <span>Delay Reduction:</span>
                                                <span className="text-emerald-400 font-bold text-lg">{recommendationData.ExpectedDelayReduction}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span>Expected Savings:</span>
                                                <span className="text-emerald-400 font-bold text-lg">{recommendationData.ExpectedSavings}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span>ROI:</span>
                                                <span className="text-emerald-400 font-bold text-lg">{recommendationData.ExpectedROI}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Confidence:</span>
                                                <span className="text-emerald-400 font-bold text-lg">{recommendationData.Confidence}</span>
                                            </div>
                                        </div>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </div>
    );
}
