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
    setPredictions([])
    setRecommendations([])

    try {
      /*
       * Sample logistics record sent to the FastAPI /analyze endpoint.
       *
       * The backend performs:
       * 1. XGBoost delay prediction
       * 2. PuLP optimization
       * 3. Recommendation generation
       */
      const logisticsData = [
        {
          Asset_ID: 'A101',
          Timestamp: '2026-07-20 10:00:00',
          Latitude: 20,
          Longitude: 72,
          Inventory_Level: 150,
          Shipment_Status: 'Delayed',
          Temperature: 25,
          Humidity: 60,
          Traffic_Status: 'Heavy',
          Waiting_Time: 50,
          User_Transaction_Amount: 500,
          User_Purchase_Frequency: 5,
          Logistics_Delay_Reason: 'Traffic Congestion',
          Asset_Utilization: 90,
          Demand_Forecast: 250,
        },
      ]

      /*
       * Single backend call.
       *
       * /analyze combines prediction + optimization.
       */
      const response = await fetch(
        '/analyze',
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

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`,
        )
      }

      const result = await response.json()

      /*
       * Backend returns predictions as:
       *
       * {
       *   "A101": 0.9783
       * }
       *
       * Convert that object into the format
       * expected by the React UI.
       */
      const predictionList: Prediction[] = Object.entries(
        result.predictions || {},
      ).map(([asset_id, probability]) => ({
        asset_id,
        delay_probability: Number(probability),
      }))

      setPredictions(predictionList)

      /*
       * Backend already returns optimization
       * recommendations in JSON-ready format.
       */
      setRecommendations(result.recommendations || [])
    } catch (err) {
      console.error('AI Analysis Error:', err)

      setError(
        'Unable to connect to the SupplyPrescript AI backend. Make sure FastAPI is running on port 8000.',
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

      {/* Dashboard Statistics */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            item={item}
          />
        ))}
      </div>

      {/* Operational Overview */}
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

      {/* AI Prescriptive Analysis */}
      <Box className="mt-6">
        <Paper className="rounded-2xl border border-slate-200 p-6 shadow-sm">
          {/* Header */}
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
                <CircularProgress
                  size={22}
                  color="inherit"
                />
              ) : (
                'Run AI Analysis'
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <Box className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </Box>
          )}

          {/* Delay Predictions */}
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
                          icon={
                            <AlertTriangle size={16} />
                          }
                          label={`${probability.toFixed(
                            2,
                          )}% delay risk`}
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

          {/* Optimization Recommendations */}
          {recommendations.length > 0 && (
            <Box className="mt-6">
              <Typography
                variant="subtitle1"
                className="mb-3 font-semibold"
              >
                Prescriptive Recommendations
              </Typography>

              <div className="grid gap-3 md:grid-cols-2">
                {recommendations.map(
                  (recommendation) => (
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
                        {Number(
                          recommendation.expected_benefit,
                        ).toFixed(2)}
                      </Typography>
                    </div>
                  ),
                )}
              </div>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Recent Orders */}
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