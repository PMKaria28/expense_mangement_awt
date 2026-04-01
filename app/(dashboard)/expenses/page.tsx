"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Download, Pencil, Trash2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRole } from "@/hooks/useRole";


function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth-token") || "";
}
function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function ExpensesPage() {
  const { isAdmin, userId } = useRole();
  const [expenses, setExpenses] = useState<any[]>([]);
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
    ExpenseDate: new Date().toISOString().split("T")[0],
    CategoryID: "", SubCategoryID: "", PeopleID: "", ProjectID: "",
    Amount: "", ExpenseDetail: "", Description: "", AttachmentPath: "",
  });

  useEffect(() => { fetchExpenses(); }, [page, search]);
  useEffect(() => { fetchDropdowns(); }, []);

  async function fetchExpenses() {
    try {
      const res = await fetch(`/api/expenses?page=${page}&limit=10&search=${search}`, { headers: getHeaders() });
      if (!res.ok) return;
      const d = await res.json();
      setExpenses(d.expenses || []);
      setTotal(d.total || 0);
    } catch (err) { console.error(err); }
  }

  async function fetchDropdowns() {
    try {
      const catRes = await fetch("/api/categories", { headers: getHeaders() });
      if (catRes.ok) setCategories((await catRes.json()).categories || []);
    } catch (err) { console.error(err); }
    try {
      const peopleRes = await fetch("/api/peoples", { headers: getHeaders() });
      if (peopleRes.ok) setPeoples((await peopleRes.json()).peoples || []);
    } catch (err) { console.error(err); }
    try {
      const projRes = await fetch("/api/projects", { headers: getHeaders() });
      if (projRes.ok) setProjects((await projRes.json()).projects || []);
    } catch (err) { console.error(err); }
  }

  async function fetchSubCats(catId: string) {
    if (!catId) return;
    try {
      const res = await fetch(`/api/sub-categories?categoryId=${catId}`, { headers: getHeaders() });
      if (res.ok) setSubCats((await res.json()).subCategories || []);
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editItem ? `/api/expenses/${editItem.ExpenseID}` : "/api/expenses";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? "Expense updated!" : "Expense added!");
      setShowForm(false); setEditItem(null); resetForm(); fetchExpenses();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong");
    }
  }

  async function handleDelete(id: number, ownerId: number) {
    // Normal user cannot delete others' records
    if (!isAdmin && ownerId !== userId) {
      toast.error("You can only delete your own expenses");
      return;
    }
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE", headers: getHeaders() });
    if (res.ok) {
      toast.success("Expense deleted!");
      fetchExpenses();
    } else {
      const d = await res.json();
      toast.error(d.error || "Cannot delete");
    }
  }

  function canEditOrDelete(ownerId: number) {
    return isAdmin || ownerId === userId;
  }

  function resetForm() {
    setForm({ ExpenseDate: new Date().toISOString().split("T")[0], CategoryID: "", SubCategoryID: "", PeopleID: "", ProjectID: "", Amount: "", ExpenseDetail: "", Description: "", AttachmentPath: "" });
    setSubCats([]);
  }

  function openEdit(item: any) {
    if (!canEditOrDelete(item.UserID)) {
      toast.error("You can only edit your own expenses");
      return;
    }
    setEditItem(item);
    setForm({
      ExpenseDate: item.ExpenseDate?.split("T")[0] || "",
      CategoryID: item.CategoryID?.toString() || "",
      SubCategoryID: item.SubCategoryID?.toString() || "",
      PeopleID: item.PeopleID?.toString() || "",
      ProjectID: item.ProjectID?.toString() || "",
      Amount: item.Amount?.toString() || "",
      ExpenseDetail: item.ExpenseDetail || "",
      Description: item.Description || "",
      AttachmentPath: item.AttachmentPath || "",
    });
    if (item.CategoryID) fetchSubCats(item.CategoryID.toString());
    setShowForm(true);
  }

  function exportExcel() {
    const rows = expenses.map((e) => ({ Date: new Date(e.ExpenseDate).toLocaleDateString(), Category: e.categories?.CategoryName || "", Person: e.peoples?.PeopleName || "", Project: e.projects?.ProjectName || "", Amount: e.Amount, Details: e.ExpenseDetail || "" }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("Expense Report", 14, 16);
    autoTable(doc, {
      head: [["Date", "Category", "Person", "Project", "Amount"]],
      body: expenses.map((e) => [new Date(e.ExpenseDate).toLocaleDateString(), e.categories?.CategoryName || "", e.peoples?.PeopleName || "", e.projects?.ProjectName || "", `₹${Number(e.Amount).toLocaleString()}`]),
    });
    doc.save("expenses.pdf");
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Role badge */}
      {!isAdmin && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <Lock className="w-4 h-4" />
          You can only edit and delete your own expenses. Admin can manage all records.
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search expenses..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm" />
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
              {expenses.map((e) => (
                <tr key={e.ExpenseID} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-slate-600">{new Date(e.ExpenseDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{e.categories?.CategoryName || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{e.sub_categories?.SubCategoryName || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{e.peoples?.PeopleName || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{e.projects?.ProjectName || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-red-500">₹{Number(e.Amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{e.ExpenseDetail || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canEditOrDelete(e.UserID) ? (
                        <>
                          <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(e.ExpenseID, e.UserID)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> No access
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No expenses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Expense" : "Add New Expense"}</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Date *</label>
                <input type="date" required value={form.ExpenseDate} onChange={(e) => setForm({ ...form, ExpenseDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount *</label>
                <input type="number" step="0.01" required value={form.Amount} onChange={(e) => setForm({ ...form, Amount: e.target.value })} placeholder="0.00"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                <select value={form.CategoryID} onChange={(e) => { setForm({ ...form, CategoryID: e.target.value, SubCategoryID: "" }); fetchSubCats(e.target.value); }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                  <option value="">Select Category</option>
                  {categories.filter((c: any) => c.IsExpense).map((c: any) => (
                    <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Sub Category</label>
                <select value={form.SubCategoryID} onChange={(e) => setForm({ ...form, SubCategoryID: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                  <option value="">Select Sub Category</option>
                  {subCats.map((s: any) => <option key={s.SubCategoryID} value={s.SubCategoryID}>{s.SubCategoryName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Person *</label>
                <select required value={form.PeopleID} onChange={(e) => setForm({ ...form, PeopleID: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                  <option value="">Select Person</option>
                  {peoples.map((p: any) => <option key={p.PeopleID} value={p.PeopleID}>{p.PeopleName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Project</label>
                <select value={form.ProjectID} onChange={(e) => setForm({ ...form, ProjectID: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                  <option value="">Select Project</option>
                  {projects.map((p: any) => <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Expense Detail</label>
                <input value={form.ExpenseDetail} onChange={(e) => setForm({ ...form, ExpenseDetail: e.target.value })} placeholder="Brief description"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Remarks</label>
                <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} placeholder="Optional notes" rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Attachment</label>
                <input type="file" accept="image/*,.pdf" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const fd = new FormData(); fd.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
                  const d = await res.json();
                  setForm({ ...form, AttachmentPath: d.path });
                  toast.success("File uploaded!");
                }} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm" />
                {form.AttachmentPath && <p className="text-xs text-green-500 mt-1">✓ {form.AttachmentPath}</p>}
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
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


// "use client";
// import { useEffect, useState } from "react";
// import { Plus, Search, Download, Pencil, Trash2 } from "lucide-react";
// import toast from "react-hot-toast";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// function getToken() {
//   if (typeof window === "undefined") return "";
//   return localStorage.getItem("auth-token") || "";
// }

// function getHeaders() {
//   return {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${getToken()}`,
//   };
// }

// export default function ExpensesPage() {
//   const [expenses, setExpenses] = useState<any[]>([]);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editItem, setEditItem] = useState<any>(null);
//   const [categories, setCategories] = useState<any[]>([]);
//   const [peoples, setPeoples] = useState<any[]>([]);
//   const [projects, setProjects] = useState<any[]>([]);
//   const [subCats, setSubCats] = useState<any[]>([]);
//   const [form, setForm] = useState({
//     ExpenseDate: new Date().toISOString().split("T")[0],
//     CategoryID: "",
//     SubCategoryID: "",
//     PeopleID: "",
//     ProjectID: "",
//     Amount: "",
//     ExpenseDetail: "",
//     Description: "",
//     AttachmentPath: "",
//   });

//   useEffect(() => {
//     fetchExpenses();
//   }, [page, search]);

//   useEffect(() => {
//     fetchDropdowns();
//   }, []);

//   async function fetchExpenses() {
//     try {
//       const res = await fetch(
//         `/api/expenses?page=${page}&limit=10&search=${search}`,
//         { headers: getHeaders() }
//       );
//       if (!res.ok) return;
//       const d = await res.json();
//       setExpenses(d.expenses || []);
//       setTotal(d.total || 0);
//     } catch (err) {
//       console.error("fetchExpenses error:", err);
//     }
//   }

//   async function fetchDropdowns() {
//     try {
//       const catRes = await fetch("/api/categories", { headers: getHeaders() });
//       if (catRes.ok) {
//         const catData = await catRes.json();
//         setCategories(catData.categories || []);
//       }
//     } catch (err) {
//       console.error("fetchCategories error:", err);
//     }

//     try {
//       const peopleRes = await fetch("/api/peoples", { headers: getHeaders() });
//       if (peopleRes.ok) {
//         const peopleData = await peopleRes.json();
//         setPeoples(peopleData.peoples || []);
//       }
//     } catch (err) {
//       console.error("fetchPeoples error:", err);
//     }

//     try {
//       const projRes = await fetch("/api/projects", { headers: getHeaders() });
//       if (projRes.ok) {
//         const projData = await projRes.json();
//         setProjects(projData.projects || []);
//       }
//     } catch (err) {
//       console.error("fetchProjects error:", err);
//     }
//   }

//   async function fetchSubCats(catId: string) {
//     if (!catId) return;
//     try {
//       const res = await fetch(`/api/sub-categories?categoryId=${catId}`, {
//         headers: getHeaders(),
//       });
//       if (res.ok) {
//         const d = await res.json();
//         setSubCats(d.subCategories || []);
//       }
//     } catch (err) {
//       console.error("fetchSubCats error:", err);
//     }
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const url = editItem
//       ? `/api/expenses/${editItem.ExpenseID}`
//       : "/api/expenses";
//     const method = editItem ? "PUT" : "POST";
//     try {
//       const res = await fetch(url, {
//         method,
//         headers: getHeaders(),
//         body: JSON.stringify(form),
//       });
//       if (res.ok) {
//         toast.success(editItem ? "Expense updated!" : "Expense added!");
//         setShowForm(false);
//         setEditItem(null);
//         resetForm();
//         fetchExpenses();
//       } else {
//         toast.error("Something went wrong");
//       }
//     } catch (err) {
//       toast.error("Network error");
//     }
//   }

//   async function handleDelete(id: number) {
//     if (!confirm("Delete this expense?")) return;
//     try {
//       const res = await fetch(`/api/expenses/${id}`, {
//         method: "DELETE",
//         headers: getHeaders(),
//       });
//       if (res.ok) {
//         toast.success("Expense deleted!");
//         fetchExpenses();
//       } else {
//         toast.error("Something went wrong");
//       }
//     } catch (err) {
//       toast.error("Network error");
//     }
//   }

//   function resetForm() {
//     setForm({
//       ExpenseDate: new Date().toISOString().split("T")[0],
//       CategoryID: "",
//       SubCategoryID: "",
//       PeopleID: "",
//       ProjectID: "",
//       Amount: "",
//       ExpenseDetail: "",
//       Description: "",
//       AttachmentPath: "",
//     });
//     setSubCats([]);
//   }

//   function openEdit(item: any) {
//     setEditItem(item);
//     setForm({
//       ExpenseDate: item.ExpenseDate?.split("T")[0] || "",
//       CategoryID: item.CategoryID?.toString() || "",
//       SubCategoryID: item.SubCategoryID?.toString() || "",
//       PeopleID: item.PeopleID?.toString() || "",
//       ProjectID: item.ProjectID?.toString() || "",
//       Amount: item.Amount?.toString() || "",
//       ExpenseDetail: item.ExpenseDetail || "",
//       Description: item.Description || "",
//       AttachmentPath: item.AttachmentPath || "",
//     });
//     if (item.CategoryID) fetchSubCats(item.CategoryID.toString());
//     setShowForm(true);
//   }

//   function exportExcel() {
//     const rows = expenses.map((e) => ({
//       Date: new Date(e.ExpenseDate).toLocaleDateString(),
//       Category: e.categories?.CategoryName || "",
//       Person: e.peoples?.PeopleName || "",
//       Project: e.projects?.ProjectName || "",
//       Amount: e.Amount,
//       Details: e.ExpenseDetail || "",
//     }));
//     const ws = XLSX.utils.json_to_sheet(rows);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Expenses");
//     XLSX.writeFile(wb, "expenses.xlsx");
//   }

//   function exportPDF() {
//     const doc = new jsPDF();
//     doc.text("Expense Report", 14, 16);
//     autoTable(doc, {
//       head: [["Date", "Category", "Person", "Project", "Amount"]],
//       body: expenses.map((e) => [
//         new Date(e.ExpenseDate).toLocaleDateString(),
//         e.categories?.CategoryName || "",
//         e.peoples?.PeopleName || "",
//         e.projects?.ProjectName || "",
//         `₹${Number(e.Amount).toLocaleString()}`,
//       ]),
//     });
//     doc.save("expenses.pdf");
//   }

//   const totalPages = Math.ceil(total / 10);

//   return (
//     <div className="space-y-5">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
//           <p className="text-slate-500 text-sm">{total} total records</p>
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={exportExcel}
//             className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600"
//           >
//             <Download className="w-4 h-4" /> Excel
//           </button>
//           <button
//             onClick={exportPDF}
//             className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600"
//           >
//             <Download className="w-4 h-4" /> PDF
//           </button>
//           <button
//             onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
//             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20"
//           >
//             <Plus className="w-4 h-4" /> Add Expense
//           </button>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//         <input
//           value={search}
//           onChange={(e) => { setSearch(e.target.value); setPage(1); }}
//           placeholder="Search expenses..."
//           className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
//         />
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr>
//                 {["Date","Category","Sub Category","Person","Project","Amount","Details","Actions"].map((h) => (
//                   <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {expenses.map((e) => (
//                 <tr key={e.ExpenseID} className="hover:bg-slate-50/50 transition">
//                   <td className="px-4 py-3 text-slate-600">{new Date(e.ExpenseDate).toLocaleDateString("en-IN")}</td>
//                   <td className="px-4 py-3">
//                     <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
//                       {e.categories?.CategoryName || "—"}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 text-slate-500">{e.sub_categories?.SubCategoryName || "—"}</td>
//                   <td className="px-4 py-3 text-slate-700">{e.peoples?.PeopleName || "—"}</td>
//                   <td className="px-4 py-3 text-slate-500">{e.projects?.ProjectName || "—"}</td>
//                   <td className="px-4 py-3 font-semibold text-red-500">₹{Number(e.Amount).toLocaleString("en-IN")}</td>
//                   <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{e.ExpenseDetail || "—"}</td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-2">
//                       <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">
//                         <Pencil className="w-3.5 h-3.5" />
//                       </button>
//                       <button onClick={() => handleDelete(e.ExpenseID)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
//                         <Trash2 className="w-3.5 h-3.5" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//               {expenses.length === 0 && (
//                 <tr>
//                   <td colSpan={8} className="text-center py-12 text-slate-400">No expenses found</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {totalPages > 1 && (
//           <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
//             <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
//             <div className="flex gap-2">
//               <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
//                 className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
//               <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
//                 className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modal Form */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-slate-800">
//                 {editItem ? "Edit Expense" : "Add New Expense"}
//               </h2>
//               <button
//                 onClick={() => { setShowForm(false); setEditItem(null); }}
//                 className="text-slate-400 hover:text-slate-600 text-xl"
//               >✕</button>
//             </div>
//             <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Date *</label>
//                 <input type="date" required value={form.ExpenseDate}
//                   onChange={(e) => setForm({ ...form, ExpenseDate: e.target.value })}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount *</label>
//                 <input type="number" step="0.01" required value={form.Amount}
//                   onChange={(e) => setForm({ ...form, Amount: e.target.value })}
//                   placeholder="0.00"
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
//                 <select value={form.CategoryID}
//                   onChange={(e) => { setForm({ ...form, CategoryID: e.target.value, SubCategoryID: "" }); fetchSubCats(e.target.value); }}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
//                   <option value="">Select Category</option>
//                   {categories.filter((c: any) => c.IsExpense).map((c: any) => (
//                     <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Sub Category</label>
//                 <select value={form.SubCategoryID}
//                   onChange={(e) => setForm({ ...form, SubCategoryID: e.target.value })}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
//                   <option value="">Select Sub Category</option>
//                   {subCats.map((s: any) => (
//                     <option key={s.SubCategoryID} value={s.SubCategoryID}>{s.SubCategoryName}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Person *</label>
//                 <select required value={form.PeopleID}
//                   onChange={(e) => setForm({ ...form, PeopleID: e.target.value })}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
//                   <option value="">Select Person</option>
//                   {peoples.map((p: any) => (
//                     <option key={p.PeopleID} value={p.PeopleID}>{p.PeopleName}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Project</label>
//                 <select value={form.ProjectID}
//                   onChange={(e) => setForm({ ...form, ProjectID: e.target.value })}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
//                   <option value="">Select Project</option>
//                   {projects.map((p: any) => (
//                     <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="col-span-2">
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Expense Detail</label>
//                 <input value={form.ExpenseDetail}
//                   onChange={(e) => setForm({ ...form, ExpenseDetail: e.target.value })}
//                   placeholder="Brief description"
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//               </div>
//               <div className="col-span-2">
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Remarks</label>
//                 <textarea value={form.Description}
//                   onChange={(e) => setForm({ ...form, Description: e.target.value })}
//                   placeholder="Optional notes" rows={2}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" />
//               </div>
//               <div className="col-span-2">
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Attachment (Bill/Receipt)</label>
//                 <input type="file" accept="image/*,.pdf"
//                   onChange={async (e) => {
//                     const file = e.target.files?.[0];
//                     if (!file) return;
//                     const fd = new FormData();
//                     fd.append("file", file);
//                     const res = await fetch("/api/upload", {
//                       method: "POST",
//                       headers: { Authorization: `Bearer ${getToken()}` },
//                       body: fd,
//                     });
//                     const d = await res.json();
//                     setForm({ ...form, AttachmentPath: d.path });
//                     toast.success("File uploaded!");
//                   }}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm" />
//                 {form.AttachmentPath && (
//                   <p className="text-xs text-green-500 mt-1">✓ {form.AttachmentPath}</p>
//                 )}
//               </div>
//               <div className="col-span-2 flex gap-3 pt-2">
//                 <button type="button"
//                   onClick={() => { setShowForm(false); setEditItem(null); }}
//                   className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium">
//                   Cancel
//                 </button>
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


// "use client";
// import { useEffect, useState } from "react";
// import { Plus, Search, Download, Pencil, Trash2, Eye } from "lucide-react";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// export default function ExpensesPage() {
//   const [expenses, setExpenses] = useState<any[]>([]);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editItem, setEditItem] = useState<any>(null);
//   const [categories, setCategories] = useState<any[]>([]);
//   const [peoples, setPeoples] = useState<any[]>([]);
//   const [projects, setProjects] = useState<any[]>([]);
//   const [subCats, setSubCats] = useState<any[]>([]);
//   const [form, setForm] = useState({
//     ExpenseDate: new Date().toISOString().split("T")[0],
//     CategoryID: "", SubCategoryID: "", PeopleID: "", ProjectID: "",
//     Amount: "", ExpenseDetail: "", Description: "", AttachmentPath: ""
//   });

//   const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : "";
//   const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

//   useEffect(() => { fetchExpenses(); }, [page, search]);
//   useEffect(() => { fetchDropdowns(); }, []);

//   async function fetchExpenses() {
//     const res = await fetch(`/api/expenses?page=${page}&limit=10&search=${search}`, { headers });
//     const d = await res.json();
//     setExpenses(d.expenses || []);
//     setTotal(d.total || 0);
//   }

//   async function fetchDropdowns() {
//     const [c, p, pr] = await Promise.all([
//       fetch("/api/categories", { headers }).then(r => r.json()),
//       fetch("/api/peoples", { headers }).then(r => r.json()),
//       fetch("/api/projects", { headers }).then(r => r.json()),
//     ]);
//     setCategories(c.categories || c);
//     setPeoples(p.peoples || p);
//     setProjects(pr.projects || pr);
//   }

//   async function fetchSubCats(catId: string) {
//     if (!catId) return;
//     const res = await fetch(`/api/sub-categories?categoryId=${catId}`, { headers });
//     const d = await res.json();
//     setSubCats(d.subCategories || d);
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const url = editItem ? `/api/expenses/${editItem.ExpenseID}` : "/api/expenses";
//     const method = editItem ? "PUT" : "POST";
//     await fetch(url, { method, headers, body: JSON.stringify(form) });
//     setShowForm(false);
//     setEditItem(null);
//     resetForm();
//     fetchExpenses();
//   }

//   async function handleDelete(id: number) {
//     if (!confirm("Delete this expense?")) return;
//     await fetch(`/api/expenses/${id}`, { method: "DELETE", headers });
//     fetchExpenses();
//   }

//   function resetForm() {
//     setForm({ ExpenseDate: new Date().toISOString().split("T")[0], CategoryID: "", SubCategoryID: "", PeopleID: "", ProjectID: "", Amount: "", ExpenseDetail: "", Description: "", AttachmentPath: "" });
//   }

//   function openEdit(item: any) {
//     setEditItem(item);
//     setForm({
//       ExpenseDate: item.ExpenseDate?.split("T")[0] || "",
//       CategoryID: item.CategoryID?.toString() || "",
//       SubCategoryID: item.SubCategoryID?.toString() || "",
//       PeopleID: item.PeopleID?.toString() || "",
//       ProjectID: item.ProjectID?.toString() || "",
//       Amount: item.Amount?.toString() || "",
//       ExpenseDetail: item.ExpenseDetail || "",
//       Description: item.Description || "",
//       AttachmentPath: item.AttachmentPath || "",
//     });
//     setShowForm(true);
//   }

//   function exportExcel() {
//     const rows = expenses.map(e => ({
//       Date: new Date(e.ExpenseDate).toLocaleDateString(),
//       Category: e.categories?.CategoryName || "",
//       Person: e.peoples?.PeopleName || "",
//       Project: e.projects?.ProjectName || "",
//       Amount: e.Amount,
//       Details: e.ExpenseDetail || "",
//     }));
//     const ws = XLSX.utils.json_to_sheet(rows);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Expenses");
//     XLSX.writeFile(wb, "expenses.xlsx");
//   }

//   function exportPDF() {
//     const doc = new jsPDF();
//     doc.text("Expense Report", 14, 16);
//     autoTable(doc, {
//       head: [["Date", "Category", "Person", "Project", "Amount"]],
//       body: expenses.map(e => [
//         new Date(e.ExpenseDate).toLocaleDateString(),
//         e.categories?.CategoryName || "",
//         e.peoples?.PeopleName || "",
//         e.projects?.ProjectName || "",
//         `₹${Number(e.Amount).toLocaleString()}`,
//       ]),
//     });
//     doc.save("expenses.pdf");
//   }

//   const totalPages = Math.ceil(total / 10);

//   return (
//     <div className="space-y-5">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
//           <p className="text-slate-500 text-sm">{total} total records</p>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600">
//             <Download className="w-4 h-4" /> Excel
//           </button>
//           <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600">
//             <Download className="w-4 h-4" /> PDF
//           </button>
//           <button onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
//             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20">
//             <Plus className="w-4 h-4" /> Add Expense
//           </button>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//         <input
//           value={search}
//           onChange={(e) => { setSearch(e.target.value); setPage(1); }}
//           placeholder="Search expenses..."
//           className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
//         />
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr>
//                 {["Date", "Category", "Sub Category", "Person", "Project", "Amount", "Details", "Actions"].map(h => (
//                   <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {expenses.map((e) => (
//                 <tr key={e.ExpenseID} className="hover:bg-slate-50/50 transition">
//                   <td className="px-4 py-3 text-slate-600">{new Date(e.ExpenseDate).toLocaleDateString("en-IN")}</td>
//                   <td className="px-4 py-3">
//                     <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{e.categories?.CategoryName || "—"}</span>
//                   </td>
//                   <td className="px-4 py-3 text-slate-500">{e.sub_categories?.SubCategoryName || "—"}</td>
//                   <td className="px-4 py-3 text-slate-700">{e.peoples?.PeopleName || "—"}</td>
//                   <td className="px-4 py-3 text-slate-500">{e.projects?.ProjectName || "—"}</td>
//                   <td className="px-4 py-3 font-semibold text-red-500">₹{Number(e.Amount).toLocaleString("en-IN")}</td>
//                   <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{e.ExpenseDetail || "—"}</td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-2">
//                       <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition">
//                         <Pencil className="w-3.5 h-3.5" />
//                       </button>
//                       <button onClick={() => handleDelete(e.ExpenseID)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
//                         <Trash2 className="w-3.5 h-3.5" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//               {expenses.length === 0 && (
//                 <tr><td colSpan={8} className="text-center py-12 text-slate-400">No expenses found</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
//             <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
//             <div className="flex gap-2">
//               <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
//                 className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
//               <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
//                 className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modal Form */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Expense" : "Add New Expense"}</h2>
//               <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
//             </div>
//             <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
//               {/* Date */}
//               <div className="col-span-1">
//                 <label className="label">Date *</label>
//                 <input type="date" required value={form.ExpenseDate} onChange={e => setForm({...form, ExpenseDate: e.target.value})} className="input" />
//               </div>
//               {/* Amount */}
//               <div>
//                 <label className="label">Amount *</label>
//                 <input type="number" step="0.01" required value={form.Amount} onChange={e => setForm({...form, Amount: e.target.value})} className="input" placeholder="0.00" />
//               </div>
//               {/* Category */}
//               <div>
//                 <label className="label">Category</label>
//                 <select value={form.CategoryID} onChange={e => { setForm({...form, CategoryID: e.target.value, SubCategoryID: ""}); fetchSubCats(e.target.value); }} className="input">
//                   <option value="">Select Category</option>
//                   {categories.filter((c: any) => c.IsExpense).map((c: any) => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
//                 </select>
//               </div>
//               {/* Sub Category */}
//               <div>
//                 <label className="label">Sub Category</label>
//                 <select value={form.SubCategoryID} onChange={e => setForm({...form, SubCategoryID: e.target.value})} className="input">
//                   <option value="">Select Sub Category</option>
//                   {subCats.map((s: any) => <option key={s.SubCategoryID} value={s.SubCategoryID}>{s.SubCategoryName}</option>)}
//                 </select>
//               </div>
//               {/* People */}
//               <div>
//                 <label className="label">Person *</label>
//                 <select required value={form.PeopleID} onChange={e => setForm({...form, PeopleID: e.target.value})} className="input">
//                   <option value="">Select Person</option>
//                   {peoples.map((p: any) => <option key={p.PeopleID} value={p.PeopleID}>{p.PeopleName}</option>)}
//                 </select>
//               </div>
//               {/* Project */}
//               <div>
//                 <label className="label">Project</label>
//                 <select value={form.ProjectID} onChange={e => setForm({...form, ProjectID: e.target.value})} className="input">
//                   <option value="">Select Project</option>
//                   {projects.map((p: any) => <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>)}
//                 </select>
//               </div>
//               {/* Detail */}
//               <div className="col-span-2">
//                 <label className="label">Expense Detail</label>
//                 <input value={form.ExpenseDetail} onChange={e => setForm({...form, ExpenseDetail: e.target.value})} className="input" placeholder="Brief description" />
//               </div>
//               {/* Description */}
//               <div className="col-span-2">
//                 <label className="label">Remarks</label>
//                 <textarea value={form.Description} onChange={e => setForm({...form, Description: e.target.value})} className="input" rows={2} placeholder="Optional notes" />
//               </div>
//               {/* Attachment */}
//               <div className="col-span-2">
//                 <label className="label">Attachment (Bill/Receipt)</label>
//                 <input type="file" accept="image/*,.pdf" onChange={async (e) => {
//                   const file = e.target.files?.[0];
//                   if (!file) return;
//                   const fd = new FormData();
//                   fd.append("file", file);
//                   const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
//                   const d = await res.json();
//                   setForm({ ...form, AttachmentPath: d.path });
//                 }} className="input" />
//                 {form.AttachmentPath && <p className="text-xs text-green-500 mt-1">✓ {form.AttachmentPath}</p>}
//               </div>
//               <div className="col-span-2 flex gap-3 justify-end pt-2">
//                 <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm">Cancel</button>
//                 <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20">
//                   {editItem ? "Update" : "Save"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Add these styles globally or in a style tag */}
//       <style jsx global>{`
//         .label { display: block; font-size: 0.75rem; font-weight: 500; color: #64748b; margin-bottom: 0.375rem; }
//         .input { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.15s; background: white; }
//         .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
//       `}</style>
//     </div>
//   );
// }