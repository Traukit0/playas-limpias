"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Ene",
    total: 8,
  },
  {
    name: "Feb",
    total: 12,
  },
  {
    name: "Mar",
    total: 15,
  },
  {
    name: "Abr",
    total: 10,
  },
  {
    name: "May",
    total: 18,
  },
  {
    name: "Jun",
    total: 22,
  },
  {
    name: "Jul",
    total: 19,
  },
  {
    name: "Ago",
    total: 23,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
