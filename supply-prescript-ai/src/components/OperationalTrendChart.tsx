import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

export function OperationalTrendChart() {
  const chartRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const chart = echarts.init(chartRef.current!)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Forecast', 'Actual'] },
      xAxis: {
        type: 'category',
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Forecast',
          type: 'line',
          smooth: true,
          data: [120, 132, 145, 160, 155, 170],
          lineStyle: { color: '#2563eb' },
          itemStyle: { color: '#2563eb' },
        },
        {
          name: 'Actual',
          type: 'bar',
          data: [110, 128, 140, 148, 152, 168],
          itemStyle: { color: '#22c55e' },
        },
      ],
    })

    const resize = () => chart.resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      chart.dispose()
    }
  }, [])

  return <div ref={chartRef} className="h-64 w-full" />
}
