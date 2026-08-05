import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, LinearProgress, Grid, Chip, Divider, CircularProgress, Button } from '@mui/material';
import { CheckCircle, Info } from 'lucide-react';

const API_BASE = "http://localhost:8001";

export default function XAIDashboard() {
    const [shipmentId, setShipmentId] = useState(0);
    const [predictionData, setPredictionData] = useState<any>(null);
    const [recommendationData, setRecommendationData] = useState<any>(null);
    const [confidenceData, setConfidenceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            
        } catch (error) {
            console.error("Error fetching XAI data", error);
        }
        setLoading(false);
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
                <Grid item xs={12} md={7}>
                    <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <CardContent>
                            <div className="flex justify-between items-center mb-4">
                                <Typography variant="h5" className="font-bold">Shipment Risk Assessment</Typography>
                                <Chip label={predictionData.risk_level} color={predictionData.risk_level === 'High' ? 'error' : 'warning'} />
                            </div>
                            
                            <Grid container spacing={3} className="mb-6">
                                <Grid item xs={4}>
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                        <p className="text-gray-400 text-sm uppercase">Predicted Delay</p>
                                        <p className="text-3xl font-bold text-red-400">{predictionData.predicted_delay_mins} mins</p>
                                    </div>
                                </Grid>
                                <Grid item xs={4}>
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                        <p className="text-gray-400 text-sm uppercase">Probability</p>
                                        <p className="text-3xl font-bold text-yellow-400">{predictionData.delay_probability}</p>
                                    </div>
                                </Grid>
                                <Grid item xs={4}>
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
                <Grid item xs={12} md={5}>
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

                {/* Module 2: SHAP Custom Bar Chart Visualizations */}
                <Grid item xs={12}>
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
                    <Grid item xs={12}>
                        <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'white', borderRadius: 3 }}>
                            <CardContent>
                                <div className="flex items-center space-x-3 mb-4">
                                    <CheckCircle className="text-emerald-400" size={32} />
                                    <Typography variant="h5" className="font-bold text-emerald-400">Prescriptive AI Recommendation: {recommendationData.Recommendation}</Typography>
                                </div>
                                
                                <p className="text-lg text-gray-200 mb-6 border-l-4 border-emerald-500 pl-4">{recommendationData.Reason}</p>
                                
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
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
                                    
                                    <Grid item xs={12} md={6}>
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
