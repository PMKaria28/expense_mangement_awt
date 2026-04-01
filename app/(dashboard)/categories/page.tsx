"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Tags, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "@/hooks/useRole";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth-token") || "";
}
function getHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export default function CategoriesPage() {
  const { isAdmin } = useRole();
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ CategoryName: "", Description: "", IsExpense: true, IsIncome: false, IsActive: true, Sequence: "" });

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories", { headers: getHeaders() });
      if (res.ok) setCategories((await res.json()).categories || []);
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editItem ? `/api/categories/${editItem.CategoryID}` : "/api/categories";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? "Category updated!" : "Category created!");
      setShowForm(false); setEditItem(null); resetForm(); fetchCategories();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    if (!isAdmin) { toast.error("Only admin can delete categories"); return; }
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE", headers: getHeaders() });
    if (res.ok) { toast.success("Deleted!"); fetchCategories(); }
    else { const d = await res.json(); toast.error(d.error || "Cannot delete"); }
  }

  function resetForm() {
    setForm({ CategoryName: "", Description: "", IsExpense: true, IsIncome: false, IsActive: true, Sequence: "" });
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({ CategoryName: item.CategoryName || "", Description: item.Description || "", IsExpense: item.IsExpense ?? true, IsIncome: item.IsIncome ?? false, IsActive: item.IsActive ?? true, Sequence: item.Sequence?.toString() || "" });
    setShowForm(true);
  }

  const filtered = categories.filter((c) => c.CategoryName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
          <p className="text-slate-500 text-sm">{filtered.length} total categories</p>
        </div>
        <button onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <Lock className="w-4 h-4" />
          Only admin can delete categories.
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["#", "Category Name", "Type", "Sequence", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((c, i) => (
              <tr key={c.CategoryID} className="hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Tags className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">{c.CategoryName}</p>
                      {c.Description && <p className="text-xs text-slate-400">{c.Description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {c.IsExpense && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">Expense</span>}
                    {c.IsIncome && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">Income</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{c.Sequence || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.IsActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {c.IsActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin ? (
                      <button onClick={() => handleDelete(c.CategoryID)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span title="Only admin can delete" className="p-1.5 text-slate-300 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">No categories found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Category Name *</label>
                <input required value={form.CategoryName} onChange={(e) => setForm({ ...form, CategoryName: e.target.value })} placeholder="e.g. Travel, Food, Salary"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} placeholder="Optional" rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Sequence</label>
                <input type="number" step="0.1" value={form.Sequence} onChange={(e) => setForm({ ...form, Sequence: e.target.value })} placeholder="e.g. 1.0"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={form.IsExpense} onChange={(e) => setForm({ ...form, IsExpense: e.target.checked })} className="accent-blue-500" /> Expense
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={form.IsIncome} onChange={(e) => setForm({ ...form, IsIncome: e.target.checked })} className="accent-blue-500" /> Income
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.IsActive} onChange={(e) => setForm({ ...form, IsActive: e.target.checked })} className="accent-blue-500" /> Active
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition">
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
// "use client";
// import { useEffect, useState } from "react";
// import { Plus, Search, Pencil, Trash2, Tags } from "lucide-react";
// import toast from "react-hot-toast";

// export default function CategoriesPage() {
//   const [categories, setCategories] = useState<any[]>([]);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editItem, setEditItem] = useState<any>(null);
//   const [form, setForm] = useState({
//     CategoryName: "",
//     Description: "",
//     IsExpense: true,
//     IsIncome: false,
//     IsActive: true,
//     Sequence: "",
//   });

//   const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : "";
//   const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

//   useEffect(() => { fetchCategories(); }, [search]);

//   async function fetchCategories() {
//     const res = await fetch(`/api/categories?search=${search}`, { headers });
//     const d = await res.json();
//     setCategories(d.categories || []);
//     setTotal(d.categories?.length || 0);
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const url = editItem ? `/api/categories/${editItem.CategoryID}` : "/api/categories";
//     const method = editItem ? "PUT" : "POST";
//     const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
//     if (res.ok) {
//       toast.success(editItem ? "Category updated!" : "Category created!");
//       setShowForm(false);
//       setEditItem(null);
//       resetForm();
//       fetchCategories();
//     } else {
//       toast.error("Something went wrong");
//     }
//   }

//   async function handleDelete(id: number) {
//     if (!confirm("Delete this category?")) return;
//     const res = await fetch(`/api/categories/${id}`, { method: "DELETE", headers });
//     if (res.ok) {
//       toast.success("Category deleted!");
//       fetchCategories();
//     } else {
//       toast.error("Cannot delete — subcategories or expenses may be linked.");
//     }
//   }

//   function resetForm() {
//     setForm({ CategoryName: "", Description: "", IsExpense: true, IsIncome: false, IsActive: true, Sequence: "" });
//   }

//   function openEdit(item: any) {
//     setEditItem(item);
//     setForm({
//       CategoryName: item.CategoryName || "",
//       Description: item.Description || "",
//       IsExpense: item.IsExpense ?? true,
//       IsIncome: item.IsIncome ?? false,
//       IsActive: item.IsActive ?? true,
//       Sequence: item.Sequence?.toString() || "",
//     });
//     setShowForm(true);
//   }

//   const filtered = categories.filter((c) =>
//     c.CategoryName.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="space-y-5">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
//           <p className="text-slate-500 text-sm">{total} total categories</p>
//         </div>
//         <button
//           onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
//           className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20"
//         >
//           <Plus className="w-4 h-4" /> Add Category
//         </button>
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search categories..."
//           className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
//         />
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr>
//                 {["#", "Category Name", "Type", "Sequence", "Status", "Actions"].map((h) => (
//                   <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {filtered.map((c, i) => (
//                 <tr key={c.CategoryID} className="hover:bg-slate-50/50 transition">
//                   <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
//                         <Tags className="w-4 h-4 text-blue-500" />
//                       </div>
//                       <div>
//                         <p className="font-medium text-slate-700">{c.CategoryName}</p>
//                         {c.Description && <p className="text-xs text-slate-400">{c.Description}</p>}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex gap-1">
//                       {c.IsExpense && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">Expense</span>}
//                       {c.IsIncome && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">Income</span>}
//                     </div>
//                   </td>
//                   <td className="px-4 py-3 text-slate-500">{c.Sequence || "—"}</td>
//                   <td className="px-4 py-3">
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.IsActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
//                       {c.IsActive ? "Active" : "Inactive"}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-2">
//                       <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">
//                         <Pencil className="w-3.5 h-3.5" />
//                       </button>
//                       <button onClick={() => handleDelete(c.CategoryID)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
//                         <Trash2 className="w-3.5 h-3.5" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//               {filtered.length === 0 && (
//                 <tr><td colSpan={6} className="text-center py-12 text-slate-400">No categories found</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
//             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Category" : "Add Category"}</h2>
//               <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
//             </div>
//             <form onSubmit={handleSubmit} className="p-6 space-y-4">
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Category Name *</label>
//                 <input required value={form.CategoryName} onChange={(e) => setForm({ ...form, CategoryName: e.target.value })}
//                   placeholder="e.g. Travel, Food, Salary"
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
//                 <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })}
//                   placeholder="Optional description" rows={2}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" />
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Sequence</label>
//                 <input type="number" step="0.1" value={form.Sequence} onChange={(e) => setForm({ ...form, Sequence: e.target.value })}
//                   placeholder="e.g. 1.0"
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//               </div>
//               <div className="space-y-2">
//                 <label className="block text-xs font-medium text-slate-500">Type</label>
//                 <div className="flex gap-4">
//                   <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
//                     <input type="checkbox" checked={form.IsExpense} onChange={(e) => setForm({ ...form, IsExpense: e.target.checked })} className="accent-blue-500" />
//                     Expense Category
//                   </label>
//                   <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
//                     <input type="checkbox" checked={form.IsIncome} onChange={(e) => setForm({ ...form, IsIncome: e.target.checked })} className="accent-blue-500" />
//                     Income Category
//                   </label>
//                 </div>
//               </div>
//               <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
//                 <input type="checkbox" checked={form.IsActive} onChange={(e) => setForm({ ...form, IsActive: e.target.checked })} className="accent-blue-500" />
//                 Active
//               </label>
//               <div className="flex gap-3 pt-2">
//                 <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }}
//                   className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancel</button>
//                 <button type="submit"
//                   className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20">
//                   {editItem ? "Update" : "Save"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }