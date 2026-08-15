import { useState } from 'react'
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material'
import { TrendingUp, Brain, Route, AlertTriangle } from 'lucide-react'

import {
  DataTable,
  PageHeader,
  SearchBar,
  StatCard,
  FilterPanel,
  OperationalTrendChart,
} from '../components'

import { orders, stats } from '../data/mockData'

interface Prediction {
  asset_id: string
  delay_probability: number
}

interface Recommendation {
  asset_id: string
  action: string
  priority: string
  reason: string
  estimated_cost: number
  expected_benefit: number
}

export function DashboardPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runAIAnalysis = async () => {
    setLoading(true)
    setError('')

    try {
      const logisticsData = [
        {
          asset_id: 'A101',
          Latitude: 19.076,
          Longitude: 72.8777,
          Inventory_Level: 250,
          Temperature: 30,
          Humidity: 70,
          Waiting_Time: 25,
          User_Transaction_Amount: 1500,
          User_Purchase_Frequency: 5,
          Asset_Utilization: 65,
          Demand_Forecast: 250,
          Hour: 14,
          DayOfWeek: 2,
          Month: 8,
          IsWeekend: 0,
        },
        {
          asset_id: 'A102',
          Latitude: 19.076,
          Longitude: 72.8777,
          Inventory_Level: 180,
          Temperature: 29,
          Humidity: 68,
          Waiting_Time: 10,
          User_Transaction_Amount: 900,
          User_Purchase_Frequency: 3,
          Asset_Utilization: 50,
          Demand_Forecast: 180,
          Hour: 14,
          DayOfWeek: 2,
          Month: 8,
          IsWeekend: 0,
        },
      ]

      // Step 1: XGBoost prediction
      const predictionResponse = await fetch(
        'http://127.0.0.1:8000/predict',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: logisticsData,
          }),
        },
      )

      if (!predictionResponse.ok) {
        throw new Error('Prediction request failed')
      }

      const predictionResult = await predictionResponse.json()

      setPredictions(predictionResult.predictions)

      // Step 2: Send predictions to optimization engine
      const predictionMap: Record<string, number> = {}

      predictionResult.predictions.forEach(
        (prediction: Prediction) => {
          predictionMap[prediction.asset_id] =
            prediction.delay_probability
        },
      )

      const optimizationResponse = await fetch(
        'http://127.0.0.1:8000/optimize',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            predictions: predictionMap,
          }),
        },
      )

      if (!optimizationResponse.ok) {
        throw new Error('Optimization request failed')
      }

      const optimizationResult = await optimizationResponse.json()

      setRecommendations(optimizationResult.recommendations)
    } catch (err) {
      console.error(err)
      setError(
        'Unable to connect to the SupplyPrescript AI backend.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Monitor supply chain performance, order health, and forecast accuracy from one workspace."
        action={<SearchBar />}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Typography
                  variant="h6"
                  className="font-semibold text-slate-900"
                >
                  Operational trend
                </Typography>

                <Typography
                  variant="body2"
                  className="text-slate-500"
                >
                  Forecasted demand vs. actual fulfillment
                </Typography>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                <TrendingUp size={16} />
                +8.2% QoQ
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-2">
              <OperationalTrendChart />
            </div>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <FilterPanel />
        </Grid>
      </Grid>

      {/* AI Analysis */}
      <Box className="mt-6">
        <Paper className="rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Brain size={24} />
              </div>

              <div>
                <Typography
                  variant="h6"
                  className="font-semibold text-slate-900"
                >
                  AI Prescriptive Analysis
                </Typography>

                <Typography
                  variant="body2"
                  className="text-slate-500"
                >
                  Predict logistics delays and generate recommended actions.
                </Typography>
              </div>
            </div>

            <Button
              variant="contained"
              onClick={runAIAnalysis}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Run AI Analysis'
              )}
            </Button>
          </div>

          {error && (
            <Box className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </Box>
          )}

          {predictions.length > 0 && (
            <Box className="mt-6">
              <Typography
                variant="subtitle1"
                className="mb-3 font-semibold"
              >
                Delay Predictions
              </Typography>

              <div className="grid gap-3 md:grid-cols-2">
                {predictions.map((prediction) => {
                  const probability =
                    prediction.delay_probability * 100

                  return (
                    <div
                      key={prediction.asset_id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <Typography className="font-semibold">
                          {prediction.asset_id}
                        </Typography>

                        <Chip
                          icon={<AlertTriangle size={16} />}
                          label={`${probability.toFixed(2)}% delay risk`}
                          color={
                            probability >= 50
                              ? 'error'
                              : 'success'
                          }
                          size="small"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Box>
          )}

          {recommendations.length > 0 && (
            <Box className="mt-6">
              <Typography
                variant="subtitle1"
                className="mb-3 font-semibold"
              >
                Prescriptive Recommendations
              </Typography>

              <div className="grid gap-3 md:grid-cols-2">
                {recommendations.map((recommendation) => (
                  <div
                    key={recommendation.asset_id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Typography className="font-semibold">
                          {recommendation.asset_id}
                        </Typography>

                        <div className="mt-2 flex items-center gap-2">
                          <Route size={18} />

                          <Typography className="capitalize">
                            {recommendation.action.replace(
                              '_',
                              ' ',
                            )}
                          </Typography>
                        </div>
                      </div>

                      <Chip
                        label={recommendation.priority}
                        color="error"
                        size="small"
                      />
                    </div>

                    <Typography
                      variant="body2"
                      className="mt-3 text-slate-500"
                    >
                      {recommendation.reason}
                    </Typography>

                    <Typography
                      variant="body2"
                      className="mt-2 font-medium"
                    >
                      Expected benefit:{' '}
                      {recommendation.expected_benefit.toFixed(2)}
                    </Typography>
                  </div>
                ))}
              </div>
            </Box>
          )}
        </Paper>
      </Box>

      <Box className="mt-6">
        <DataTable
          rows={orders.map((row) => ({
            ...row,
            id: row.id,
            name: row.name,
            category: row.category,
            status: row.status,
            value: row.value,
            region: row.region,
          }))}
          title="Recent orders"
        />
      </Box>
    </div>
  )
}