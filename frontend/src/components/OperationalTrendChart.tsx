import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface OperationalTrendChartProps {
  title?: string
  data?: number[]
  labels?: string[]
}

export function OperationalTrendChart({ title = 'Operations', data = [10, 12, 16, 14, 18, 20], labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }: OperationalTrendChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const chart = echarts.init(chartRef.current!)
    chart.setOption({
      title: { text: title, left: 'center', textStyle: { color: '#0f172a' } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Live volume'] },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#475569' },
      },
      yAxis: { type: 'value', axisLabel: { color: '#475569' } },
      series: [
        {
          name: 'Live volume',
          type: 'line',
          smooth: true,
          data,
          lineStyle: { color: '#2563eb' },
          itemStyle: { color: '#2563eb' },
          areaStyle: { color: 'rgba(37, 99, 235, 0.12)' },
        },
      ],
    })

    const resize = () => chart.resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      chart.dispose()
    }
  }, [data, labels, title])

  return <div ref={chartRef} className="h-64 w-full" />
}
