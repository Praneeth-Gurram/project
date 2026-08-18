import { useMemo, useState } from 'react'
import { Card, CardContent, Typography, LinearProgress, Grid, Chip, Divider, CircularProgress, Button } from '@mui/material'
import { CheckCircle, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  getConfidenceScores,
  getPredictionExplanation,
  getRecommendationExplanation,
} from '../lib/api'

export default function XAIDashboard() {
  const [shipmentId, setShipmentId] = useState(1)

  const {
    data: predictionData,
    isLoading: isPredictionLoading,
    isError: isPredictionError,
  } = useQuery({
    queryKey: ['prediction-explanation', shipmentId],
    queryFn: () => getPredictionExplanation(shipmentId),
  })

  const {
    data: recommendationData,
    isLoading: isRecommendationLoading,
  } = useQuery({
    queryKey: ['recommendation-explanation', shipmentId],
    queryFn: () => getRecommendationExplanation(shipmentId),
  })

  const {
    data: confidenceData,
    isLoading: isConfidenceLoading,
  } = useQuery({
    queryKey: ['confidence-score', shipmentId],
    queryFn: () => getConfidenceScores(shipmentId),
  })

  const maxContribution = useMemo(() => {
    if (!predictionData?.top_features?.length) return 1
    return Math.max(...predictionData.top_features.map((feature) => Number(feature.impact || 0)))
  }, [predictionData])

  if (isPredictionLoading || isRecommendationLoading || isConfidenceLoading || !predictionData) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white"><CircularProgress /></div>
  }

  if (isPredictionError) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Unable to load XAI explanation for this shipment.</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 font-sans">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Supply Prescript: Explainable AI</h1>
          <p className="mt-1 text-gray-400">Transparent AI-driven predictive logistics and prescriptive recommendations</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="contained" color="primary" onClick={() => setShipmentId((value) => Math.max(1, value - 1))}>Prev Shipment</Button>
          <Chip label={`Shipment ID: ${shipmentId}`} color="secondary" className="text-lg font-bold" />
          <Button variant="contained" color="primary" onClick={() => setShipmentId((value) => value + 1)}>Next Shipment</Button>
        </div>
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <Typography variant="h5" className="font-bold">Shipment Risk Assessment</Typography>
                <Chip label={predictionData.risk_level} color={predictionData.risk_level === 'High' ? 'error' : predictionData.risk_level === 'Medium' ? 'warning' : 'success'} />
              </div>

              <Grid container spacing={3} className="mb-6">
                <Grid size={{ xs: 4 }}>
                  <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-center">
                    <p className="text-sm uppercase text-gray-400">Predicted Delay</p>
                    <p className="text-3xl font-bold text-red-400">{predictionData.predicted_delay_mins} mins</p>
                  </div>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-center">
                    <p className="text-sm uppercase text-gray-400">Probability</p>
                    <p className="text-3xl font-bold text-yellow-400">{predictionData.delay_probability}</p>
                  </div>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-center">
                    <p className="text-sm uppercase text-gray-400">AI Confidence</p>
                    <p className="text-3xl font-bold text-green-400">{predictionData.confidence_score}</p>
                  </div>
                </Grid>
              </Grid>

              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 3 }} />

              <div className="flex items-start space-x-4 rounded-xl border border-blue-500/30 bg-blue-900/20 p-5">
                <Info className="mt-1 flex-shrink-0 text-blue-400" size={28} />
                <div>
                  <h3 className="mb-1 text-lg font-bold text-blue-300">Why did the AI predict this?</h3>
                  <p className="text-lg leading-relaxed text-gray-300">{predictionData.business_explanation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" className="mb-4 font-bold">System Confidence Indicators</Typography>
              {confidenceData && Object.entries(confidenceData).map(([key, val]) => (
                <div key={key} className="mb-5">
                  <div className="mb-1 flex justify-between">
                    <span className="text-gray-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-bold">{val}%</span>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={Number(val)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': { bgcolor: Number(val) > 90 ? '#4ade80' : Number(val) > 75 ? '#fbbf24' : '#f87171' },
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" className="mb-4 font-bold">SHAP Feature Contributions (Local Explanation)</Typography>
              <div className="w-full space-y-4 rounded-xl border border-gray-700 bg-gray-900 p-6">
                {predictionData.top_features.map((feature, index) => {
                  const widthPct = Math.max(5, (Number(feature.impact || 0) / maxContribution) * 100)
                  const isPositive = Number(feature.contribution) > 0

                  return (
                    <div key={`${feature.feature}-${index}`} className="flex items-center">
                      <div className="w-1/3 pr-4 text-right text-sm font-medium text-gray-300">
                        {feature.business_name}
                        <div className="text-xs text-gray-500">Value: {feature.value}</div>
                      </div>
                      <div className="flex w-2/3 items-center">
                        <div className="flex w-1/2 justify-end pr-1">
                          {!isPositive && (
                            <div className="flex h-6 items-center justify-start rounded-l bg-green-500 pl-2 text-xs font-bold text-green-900" style={{ width: `${widthPct}%` }}>
                              {feature.contribution}
                            </div>
                          )}
                        </div>
                        <div className="h-8 w-px bg-gray-600" />
                        <div className="flex w-1/2 justify-start pl-1">
                          {isPositive && (
                            <div className="flex h-6 items-center justify-end rounded-r bg-red-500 pr-2 text-xs font-bold text-red-900" style={{ width: `${widthPct}%` }}>
                              +{feature.contribution}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </Grid>

        {recommendationData && recommendationData.Recommendation && (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <div className="mb-4 flex items-center space-x-3">
                  <CheckCircle className="text-emerald-400" size={32} />
                  <Typography variant="h5" className="font-bold text-emerald-400">Prescriptive AI Recommendation: {recommendationData.Recommendation}</Typography>
                </div>

                <p className="mb-6 border-l-4 border-emerald-500 pl-4 text-lg text-gray-200">{recommendationData.Reason}</p>

                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-5">
                      <h4 className="mb-3 text-sm font-bold uppercase text-gray-400">Before Action</h4>
                      <div className="mb-2 flex items-center justify-between">
                        <span>Predicted Delay:</span>
                        <span className="text-lg font-bold text-red-400">{predictionData.predicted_delay_mins} mins</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Risk Level:</span>
                        <span className="font-bold text-red-400">{predictionData.risk_level}</span>
                      </div>
                    </div>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/30 p-5">
                      <h4 className="mb-3 text-sm font-bold uppercase text-emerald-400">Expected Outcome</h4>
                      <div className="mb-2 flex items-center justify-between">
                        <span>Delay Reduction:</span>
                        <span className="text-lg font-bold text-emerald-400">{recommendationData.ExpectedDelayReduction}</span>
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span>Expected Savings:</span>
                        <span className="text-lg font-bold text-emerald-400">{recommendationData.ExpectedSavings}</span>
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span>ROI:</span>
                        <span className="text-lg font-bold text-emerald-400">{recommendationData.ExpectedROI}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Confidence:</span>
                        <span className="text-lg font-bold text-emerald-400">{recommendationData.Confidence}</span>
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
  )
}

