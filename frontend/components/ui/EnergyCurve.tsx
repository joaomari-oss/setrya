"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  energyValues: number[];
  bpmValues?: number[];
  keyValues?: string[];
}

export default function EnergyCurve({ energyValues, bpmValues, keyValues }: Props) {
  const data = energyValues.map((e, i) => ({
    position: i + 1,
    energy: Math.round(e * 100),
    bpm: bpmValues?.[i],
    key: keyValues?.[i],
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#b4f47a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#b4f47a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
          <XAxis
            dataKey="position"
            tick={{ fill: "#555", fontSize: 10 }}
            axisLine={{ stroke: "#222" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#555", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "8px",
              color: "#f5f5f5",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "energy") return [`${value}%`, "Energy"];
              return [value, name];
            }}
          />
          <Area
            type="monotone"
            dataKey="energy"
            stroke="#b4f47a"
            strokeWidth={2}
            fill="url(#energyGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#b4f47a", stroke: "#080808", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
