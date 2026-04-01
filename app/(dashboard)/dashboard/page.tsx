"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#f97316"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: "Total Income", value: data?.totalIncomes || 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", trend: "up" },
    { label: "Total Expense", value: data?.totalExpenses || 0, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50", trend: "down" },
    { label: "Net Balance", value: data?.netBalance || 0, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50", trend: data?.netBalance >= 0 ? "up" : "down" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">
                ₹{Number(s.value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="ml-auto">
              {s.trend === "up"
                ? <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                : <ArrowDownRight className="w-5 h-5 text-red-500" />}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Expense by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data?.categoryChart || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {(data?.categoryChart || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v?: number) => `₹${v?.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Project-wise Summary</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.projectChart || []}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v?: number) => `₹${v?.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="incomes" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Expenses</h3>
          <div className="space-y-3">
            {(data?.recentExpenses || []).map((e: any) => (
              <div key={e.ExpenseID} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-700">{e.ExpenseDetail || "Expense"}</p>
                  <p className="text-xs text-slate-400">{e.categories?.CategoryName} • {new Date(e.ExpenseDate).toLocaleDateString()}</p>
                </div>
                <span className="text-red-500 font-semibold text-sm">-₹{Number(e.Amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incomes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Incomes</h3>
          <div className="space-y-3">
            {(data?.recentIncomes || []).map((i: any) => (
              <div key={i.IncomeID} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-700">{i.IncomeDetail || "Income"}</p>
                  <p className="text-xs text-slate-400">{i.categories?.CategoryName} • {new Date(i.IncomeDate).toLocaleDateString()}</p>
                </div>
                <span className="text-emerald-500 font-semibold text-sm">+₹{Number(i.Amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}