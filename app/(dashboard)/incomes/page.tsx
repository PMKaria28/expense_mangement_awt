"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Download, Pencil, Trash2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRole } from "@/hooks/useRole";

export default function IncomesPage() {
  const { isAdmin, userId } = useRole();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [peoples, setPeoples] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [subCats, setSubCats] = useState<any[]>([]);
  const [form, setForm] = useState({
    IncomeDate: new Date().toISOString().split("T")[0],
    CategoryID: "", SubCategoryID: "", PeopleID: "", ProjectID: "",
    Amount: "", IncomeDetail: "", Description: "", AttachmentPath: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => { fetchIncomes(); }, [page, search]);
  useEffect(() => { fetchDropdowns(); }, []);

  async function fetchIncomes() {
    const res = await fetch(`/api/incomes?page=${page}&limit=10&search=${search}`, { headers });
    const d = await res.json();
    setIncomes(d.incomes || []);
    setTotal(d.total || 0);
  }

  async function fetchDropdowns() {
    const [c, p, pr] = await Promise.all([
      fetch("/api/categories", { headers }).then((r) => r.json()),
      fetch("/api/peoples", { headers }).then((r) => r.json()),
      fetch("/api/projects", { headers }).then((r) => r.json()),
    ]);
    setCategories(c.categories || []);
    setPeoples(p.peoples || []);
    setProjects(pr.projects || []);
  }

  async function fetchSubCats(catId: string) {
    if (!catId) return;
    const res = await fetch(`/api/sub-categories?categoryId=${catId}`, { headers });
    const d = await res.json();
    setSubCats(d.subCategories || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editItem ? `/api/incomes/${editItem.IncomeID}` : "/api/incomes";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? "Income updated!" : "Income added!");
      setShowForm(false);
      setEditItem(null);
      resetForm();
      fetchIncomes();
    } else {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this income?")) return;
    const res = await fetch(`/api/incomes/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      toast.success("Income deleted!");
      fetchIncomes();
    } else {
      toast.error("Something went wrong");
    }
  }

  function resetForm() {
    setForm({ IncomeDate: new Date().toISOString().split("T")[0], CategoryID: "", SubCategoryID: "", PeopleID: "", ProjectID: "", Amount: "", IncomeDetail: "", Description: "", AttachmentPath: "" });
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({
      IncomeDate: item.IncomeDate?.split("T")[0] || "",
      CategoryID: item.CategoryID?.toString() || "",
      SubCategoryID: item.SubCategoryID?.toString() || "",
      PeopleID: item.PeopleID?.toString() || "",
      ProjectID: item.ProjectID?.toString() || "",
      Amount: item.Amount?.toString() || "",
      IncomeDetail: item.IncomeDetail || "",
      Description: item.Description || "",
      AttachmentPath: item.AttachmentPath || "",
    });
    setShowForm(true);
  }

  function exportExcel() {
    const rows = incomes.map((i) => ({
      Date: new Date(i.IncomeDate).toLocaleDateString(),
      Category: i.categories?.CategoryName || "",
      Person: i.peoples?.PeopleName || "",
      Project: i.projects?.ProjectName || "",
      Amount: i.Amount,
      Details: i.IncomeDetail || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incomes");
    XLSX.writeFile(wb, "incomes.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("Income Report", 14, 16);
    autoTable(doc, {
      head: [["Date", "Category", "Person", "Project", "Amount"]],
      body: incomes.map((i) => [
        new Date(i.IncomeDate).toLocaleDateString(),
        i.categories?.CategoryName || "",
        i.peoples?.PeopleName || "",
        i.projects?.ProjectName || "",
        `₹${Number(i.Amount).toLocaleString()}`,
      ]),
    });
    doc.save("incomes.pdf");
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Incomes</h1>
          <p className="text-slate-500 text-sm">{total} total records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition shadow-md shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search incomes..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date", "Category", "Sub Category", "Person", "Project", "Amount", "Details", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incomes.map((i) => (
                <tr key={i.IncomeID} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-slate-600">{new Date(i.IncomeDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">{i.categories?.CategoryName || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{i.sub_categories?.SubCategoryName || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{i.peoples?.PeopleName || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{i.projects?.ProjectName || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-500">₹{Number(i.Amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{i.IncomeDetail || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(i)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
{/*                       
                      <button onClick={() => handleDelete(i.IncomeID)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button> */}

                      {isAdmin || i.UserID === userId ? (
  <button onClick={() => handleDelete(i.ProjectID)}>
    <Trash2 />
  </button>
) : (
  <span title="No access"><Lock /></span>
)}
                    </div>
                  </td>
                </tr>
              ))}
              {incomes.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No incomes found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Income" : "Add New Income"}</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Date *</label>
                <input type="date" required value={form.IncomeDate} onChange={(e) => setForm({ ...form, IncomeDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount *</label>
                <input type="number" step="0.01" required value={form.Amount} onChange={(e) => setForm({ ...form, Amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                <select value={form.CategoryID} onChange={(e) => { setForm({ ...form, CategoryID: e.target.value, SubCategoryID: "" }); fetchSubCats(e.target.value); }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400">
                  <option value="">Select Category</option>
                  {categories.filter((c: any) => c.IsIncome).map((c: any) => (
                    <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Sub Category</label>
                <select value={form.SubCategoryID} onChange={(e) => setForm({ ...form, SubCategoryID: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400">
                  <option value="">Select Sub Category</option>
                  {subCats.map((s: any) => (
                    <option key={s.SubCategoryID} value={s.SubCategoryID}>{s.SubCategoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Person *</label>
                <select required value={form.PeopleID} onChange={(e) => setForm({ ...form, PeopleID: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400">
                  <option value="">Select Person</option>
                  {peoples.map((p: any) => (
                    <option key={p.PeopleID} value={p.PeopleID}>{p.PeopleName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Project</label>
                <select value={form.ProjectID} onChange={(e) => setForm({ ...form, ProjectID: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400">
                  <option value="">Select Project</option>
                  {projects.map((p: any) => (
                    <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Income Detail</label>
                <input value={form.IncomeDetail} onChange={(e) => setForm({ ...form, IncomeDetail: e.target.value })}
                  placeholder="Brief description"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Remarks</label>
                <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })}
                  placeholder="Optional notes" rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Attachment (Bill/Receipt)</label>
                <input type="file" accept="image/*,.pdf" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
                  const d = await res.json();
                  setForm({ ...form, AttachmentPath: d.path });
                  toast.success("File uploaded!");
                }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
                {form.AttachmentPath && <p className="text-xs text-emerald-500 mt-1">✓ {form.AttachmentPath}</p>}
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-emerald-500 hover:to-emerald-400 transition shadow-md shadow-emerald-500/20">
                  {editItem ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}