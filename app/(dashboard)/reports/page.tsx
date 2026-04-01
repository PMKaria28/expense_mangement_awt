"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend, CartesianGrid
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

const COLORS = ["#3b82f6","#06b6d4","#8b5cf6","#f59e0b","#ef4444","#10b981","#f97316","#ec4899"];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState({ type: "monthly", year: new Date().getFullYear().toString() });
  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : "";

  useEffect(() => {
    fetch(`/api/reports?type=${filter.type}&year=${filter.year}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setData);
  }, [filter]);

  function exportExcel() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.monthly || []), "Monthly");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.categories || []), "Categories");
    XLSX.writeFile(wb, "report.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Expense Manager Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Year: ${filter.year}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [["Month", "Income", "Expense", "Balance"]],
      body: (data?.monthly || []).map((m: any) => [m.month, `₹${m.income}`, `₹${m.expense}`, `₹${m.income - m.expense}`]),
    });
    doc.save("report.pdf");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm">Visualize your financial data</p>
        </div>
        <div className="flex gap-2">
          <select value={filter.year} onChange={e => setFilter({...filter, year: e.target.value})}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400">
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 text-slate-600">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 text-slate-600">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Income", value: data?.summary?.totalIncome || 0, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Expense", value: data?.summary?.totalExpense || 0, color: "text-red-600", bg: "bg-red-50" },
          { label: "Net Balance", value: (data?.summary?.totalIncome || 0) - (data?.summary?.totalExpense || 0), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Transactions", value: data?.summary?.count || 0, color: "text-purple-600", bg: "bg-purple-50", prefix: "" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color} mt-1`}>
              {s.prefix !== "" ? `₹${Number(s.value).toLocaleString("en-IN")}` : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Monthly Income vs Expense ({filter.year})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.monthly || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v?: number) => `₹${v?.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" radius={[4,4,0,0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Category-wise Expense Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              {/* <Pie data={data?.categories || []} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}> */}
              <Pie data={data?.categories || []} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => {
  if (percent === undefined) return name;
  return `${name} ${(percent * 100).toFixed(0)}%`;
}} >
                
                {(data?.categories || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v?: number) => `₹${v?.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project Summary Table */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Project-wise Summary</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2 text-xs text-slate-500">Project</th>
                <th className="text-right p-2 text-xs text-slate-500">Income</th>
                <th className="text-right p-2 text-xs text-slate-500">Expense</th>
                <th className="text-right p-2 text-xs text-slate-500">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(data?.projects || []).map((p: any) => (
                <tr key={p.name} className="border-t border-slate-50">
                  <td className="p-2 text-slate-700">{p.name}</td>
                  <td className="p-2 text-right text-emerald-600">₹{Number(p.income).toLocaleString()}</td>
                  <td className="p-2 text-right text-red-500">₹{Number(p.expense).toLocaleString()}</td>
                  <td className={`p-2 text-right font-medium ${p.income - p.expense >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    ₹{(p.income - p.expense).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}