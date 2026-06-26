import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Props {
  data: Array<{ day: string; revenue: number; orders: number }>
}

const tooltipStyle = {
  contentStyle: { background: '#12182e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, backdropFilter: 'blur(12px)' },
  labelStyle: { color: '#c7c4d7', fontSize: 12 },
  itemStyle: { fontSize: 12 },
}

export default function DailyRevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
        <YAxis
          yAxisId="rev"
          orientation="left"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          width={40}
        />
        <YAxis
          yAxisId="ord"
          orientation="right"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={28}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(v, name) =>
            name === 'revenue'
              ? [Number(v).toLocaleString('vi-VN') + ' đ', 'Revenue']
              : [v, 'Orders']
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
          formatter={v => v === 'revenue' ? 'Revenue (đ)' : 'Orders'}
        />
        <Bar yAxisId="rev" dataKey="revenue" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Line
          yAxisId="ord"
          type="monotone"
          dataKey="orders"
          stroke="#a855f7"
          strokeWidth={2}
          dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#ddd6fe' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
