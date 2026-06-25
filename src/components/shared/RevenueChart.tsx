import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'

interface Props {
  data: Array<{ i: number; revenue: number }>
}

export default function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="url(#lineGrad)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#c0c1ff', stroke: '#494bd6' }}
        />
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#494bd6" />
            <stop offset="100%" stopColor="#ddb7ff" />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ background: '#12182e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, backdropFilter: 'blur(12px)' }}
          labelStyle={{ color: '#c7c4d7', fontSize: 12 }}
          itemStyle={{ color: '#c0c1ff', fontSize: 12 }}
          formatter={(v) => [v != null ? Number(v).toLocaleString('vi-VN') + ' đ' : '–', 'Revenue']}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
