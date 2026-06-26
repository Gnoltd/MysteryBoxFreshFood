import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: Array<{ name: string; rate: number; remaining: number }>
}

const tooltipStyle = {
  contentStyle: { background: '#12182e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 },
  labelStyle: { color: '#c7c4d7', fontSize: 12 },
  itemStyle: { fontSize: 12 },
}

function rateColor(rate: number) {
  if (rate >= 80) return '#10b981'
  if (rate >= 50) return '#6366f1'
  if (rate >= 25) return '#f59e0b'
  return '#f43f5e'
}

export default function SellThroughChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-outline text-sm">
        No listings yet
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number, _name, props) => [
            `${v}% sold · ${props.payload.remaining} remaining`,
            'Sell-through',
          ]}
        />
        <Bar dataKey="rate" radius={[0, 6, 6, 0]} maxBarSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 10, formatter: (v: number) => `${v}%` }}>
          {data.map(entry => (
            <Cell key={entry.name} fill={rateColor(entry.rate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
