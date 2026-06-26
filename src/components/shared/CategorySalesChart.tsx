import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  data: Array<{ name: string; value: number }>
}

const COLORS: Record<string, string> = {
  bakery:     '#6366f1',
  drinks:     '#a855f7',
  fruit:      '#10b981',
  vegetables: '#34d399',
  dairy:      '#f59e0b',
  meat:       '#f43f5e',
  other:      '#64748b',
}

const tooltipStyle = {
  contentStyle: { background: '#12182e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 },
  labelStyle: { color: '#c7c4d7', fontSize: 12 },
  itemStyle: { fontSize: 12 },
}

export default function CategorySalesChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-outline text-sm">
        No sales data yet
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#64748b'} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(v) => [Number(v ?? 0).toLocaleString('vi-VN') + ' đ', 'Revenue']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          formatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
