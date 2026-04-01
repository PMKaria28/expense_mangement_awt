"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Tag } from "lucide-react";
import toast from "react-hot-toast";

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    CategoryID: "",
    SubCategoryName: "",
    Description: "",
    IsExpense: true,
    IsIncome: false,
    IsActive: true,
    Sequence: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSubCategories();
    fetchCategories();
  }, []);

  async function fetchSubCategories() {
    const res = await fetch(`/api/sub-categories`, { headers });
    const d = await res.json();
    setSubCategories(d.subCategories || []);
  }

  async function fetchCategories() {
    const res = await fetch(`/api/categories`, { headers });
    const d = await res.json();
    setCategories(d.categories || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editItem ? `/api/sub-categories/${editItem.SubCategoryID}` : "/api/sub-categories";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? "Sub-category updated!" : "Sub-category created!");
      setShowForm(false);
      setEditItem(null);
      resetForm();
      fetchSubCategories();
    } else {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this sub-category?")) return;
    const res = await fetch(`/api/sub-categories/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      toast.success("Sub-category deleted!");
      fetchSubCategories();
    } else {
      toast.error("Cannot delete — expenses may be linked.");
    }
  }

  function resetForm() {
    setForm({ CategoryID: "", SubCategoryName: "", Description: "", IsExpense: true, IsIncome: false, IsActive: true, Sequence: "" });
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({
      CategoryID: item.CategoryID?.toString() || "",
      SubCategoryName: item.SubCategoryName || "",
      Description: item.Description || "",
      IsExpense: item.IsExpense ?? true,
      IsIncome: item.IsIncome ?? false,
      IsActive: item.IsActive ?? true,
      Sequence: item.Sequence?.toString() || "",
    });
    setShowForm(true);
  }

  const filtered = subCategories.filter((s) =>
    s.SubCategoryName.toLowerCase().includes(search.toLowerCase()) ||
    s.categories?.CategoryName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sub-Categories</h1>
          <p className="text-slate-500 text-sm">{filtered.length} total sub-categories</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Add Sub-Category
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sub-categories..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["#", "Sub-Category Name", "Parent Category", "Type", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s, i) => (
                <tr key={s.SubCategoryID} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{s.SubCategoryName}</p>
                        {s.Description && <p className="text-xs text-slate-400">{s.Description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                      {s.categories?.CategoryName || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {s.IsExpense && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">Expense</span>}
                      {s.IsIncome && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">Income</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.IsActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                      {s.IsActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.SubCategoryID)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No sub-categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Sub-Category" : "Add Sub-Category"}</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Parent Category *</label>
                <select required value={form.CategoryID} onChange={(e) => setForm({ ...form, CategoryID: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Sub-Category Name *</label>
                <input required value={form.SubCategoryName} onChange={(e) => setForm({ ...form, SubCategoryName: e.target.value })}
                  placeholder="e.g. Taxi, Train, Bus"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })}
                  placeholder="Optional description" rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Sequence</label>
                <input type="number" step="0.1" value={form.Sequence} onChange={(e) => setForm({ ...form, Sequence: e.target.value })}
                  placeholder="e.g. 1.1"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={form.IsExpense} onChange={(e) => setForm({ ...form, IsExpense: e.target.checked })} className="accent-blue-500" />
                    Expense
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={form.IsIncome} onChange={(e) => setForm({ ...form, IsIncome: e.target.checked })} className="accent-blue-500" />
                    Income
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.IsActive} onChange={(e) => setForm({ ...form, IsActive: e.target.checked })} className="accent-blue-500" />
                Active
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20">
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