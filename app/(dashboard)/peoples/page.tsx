"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "@/hooks/useRole";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth-token") || "";
}
function getHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export default function PeoplesPage() {
  const { isAdmin } = useRole();
  const [peoples, setPeoples] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ PeopleCode: "", PeopleName: "", Email: "", MobileNo: "", Password: "", Description: "", IsActive: true });

  useEffect(() => { fetchPeoples(); }, [search]);

  async function fetchPeoples() {
    try {
      const res = await fetch(`/api/peoples?search=${search}`, { headers: getHeaders() });
      if (res.ok) { const d = await res.json(); setPeoples(d.peoples || []); setTotal(d.total || 0); }
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editItem ? `/api/peoples/${editItem.PeopleID}` : "/api/peoples";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? "Person updated!" : "Person added!");
      setShowForm(false); setEditItem(null); resetForm(); fetchPeoples();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    if (!isAdmin) { toast.error("Only admin can delete people"); return; }
    if (!confirm("Delete this person?")) return;
    const res = await fetch(`/api/peoples/${id}`, { method: "DELETE", headers: getHeaders() });
    if (res.ok) { toast.success("Deleted!"); fetchPeoples(); }
    else { const d = await res.json(); toast.error(d.error || "Cannot delete"); }
  }

  function resetForm() {
    setForm({ PeopleCode: "", PeopleName: "", Email: "", MobileNo: "", Password: "", Description: "", IsActive: true });
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({ PeopleCode: item.PeopleCode || "", PeopleName: item.PeopleName || "", Email: item.Email || "", MobileNo: item.MobileNo || "", Password: "", Description: item.Description || "", IsActive: item.IsActive ?? true });
    setShowForm(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Peoples</h1>
          <p className="text-slate-500 text-sm">{total} total people</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add Person
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <Lock className="w-4 h-4" />
          You have view-only access. Only admin can add, edit or delete people.
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or mobile..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {peoples.map((p) => (
          <div key={p.PeopleID} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {p.PeopleName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{p.PeopleName}</h3>
                  {p.PeopleCode && <p className="text-xs text-slate-400">#{p.PeopleCode}</p>}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.IsActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                {p.IsActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{p.Email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400" /><span>{p.MobileNo}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              {isAdmin ? (
                <button onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-300 rounded-lg font-medium cursor-not-allowed" title="Only admin can edit">
                  <Lock className="w-3.5 h-3.5" /> Edit
                </span>
              )}
              {isAdmin ? (
                <button onClick={() => handleDelete(p.PeopleID)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition font-medium">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              ) : (
                <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-300 rounded-lg font-medium cursor-not-allowed" title="Only admin can delete">
                  <Lock className="w-3.5 h-3.5" /> Delete
                </span>
              )}
            </div>
          </div>
        ))}
        {peoples.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No people found.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Person" : "Add Person"}</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Person Code</label>
                  <input value={form.PeopleCode} onChange={(e) => setForm({ ...form, PeopleCode: e.target.value })} placeholder="e.g. P001"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
                  <input required value={form.PeopleName} onChange={(e) => setForm({ ...form, PeopleName: e.target.value })} placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email *</label>
                <input required type="email" value={form.Email} onChange={(e) => setForm({ ...form, Email: e.target.value })} placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Mobile No *</label>
                <input required value={form.MobileNo} onChange={(e) => setForm({ ...form, MobileNo: e.target.value })} placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              {!editItem && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Password *</label>
                  <input required type="password" value={form.Password} onChange={(e) => setForm({ ...form, Password: e.target.value })} placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} placeholder="Role or notes..." rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" />
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
// import { Plus, Search, Pencil, Trash2, Users, Mail, Phone } from "lucide-react";
// import toast from "react-hot-toast";

// export default function PeoplesPage() {
//   const [peoples, setPeoples] = useState<any[]>([]);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editItem, setEditItem] = useState<any>(null);
//   const [form, setForm] = useState({
//     PeopleCode: "",
//     PeopleName: "",
//     Email: "",
//     MobileNo: "",
//     Password: "",
//     Description: "",
//     IsActive: true,
//   });

//   const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : "";
//   const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

//   useEffect(() => { fetchPeoples(); }, [search]);

//   async function fetchPeoples() {
//     const res = await fetch(`/api/peoples?search=${search}&limit=100`, { headers });
//     const d = await res.json();
//     setPeoples(d.peoples || []);
//     setTotal(d.total || 0);
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const url = editItem ? `/api/peoples/${editItem.PeopleID}` : "/api/peoples";
//     const method = editItem ? "PUT" : "POST";
//     const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
//     if (res.ok) {
//       toast.success(editItem ? "Person updated!" : "Person added!");
//       setShowForm(false);
//       setEditItem(null);
//       resetForm();
//       fetchPeoples();
//     } else {
//       toast.error("Something went wrong");
//     }
//   }

//   async function handleDelete(id: number) {
//     if (!confirm("Delete this person?")) return;
//     const res = await fetch(`/api/peoples/${id}`, { method: "DELETE", headers });
//     if (res.ok) {
//       toast.success("Person deleted!");
//       fetchPeoples();
//     } else {
//       toast.error("Cannot delete — expenses/incomes may be linked.");
//     }
//   }

//   function resetForm() {
//     setForm({ PeopleCode: "", PeopleName: "", Email: "", MobileNo: "", Password: "", Description: "", IsActive: true });
//   }

//   function openEdit(item: any) {
//     setEditItem(item);
//     setForm({
//       PeopleCode: item.PeopleCode || "",
//       PeopleName: item.PeopleName || "",
//       Email: item.Email || "",
//       MobileNo: item.MobileNo || "",
//       Password: item.Password || "",
//       Description: item.Description || "",
//       IsActive: item.IsActive ?? true,
//     });
//     setShowForm(true);
//   }

//   return (
//     <div className="space-y-5">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-800">Peoples</h1>
//           <p className="text-slate-500 text-sm">{total} total people</p>
//         </div>
//         <button
//           onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
//           className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20"
//         >
//           <Plus className="w-4 h-4" /> Add Person
//         </button>
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search by name, email or mobile..."
//           className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
//         />
//       </div>

//       {/* Cards Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {peoples.map((p) => (
//           <div key={p.PeopleID} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
//             <div className="flex items-start justify-between mb-4">
//               <div className="flex items-center gap-3">
//                 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
//                   {p.PeopleName?.[0]?.toUpperCase()}
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-slate-800">{p.PeopleName}</h3>
//                   {p.PeopleCode && <p className="text-xs text-slate-400">#{p.PeopleCode}</p>}
//                 </div>
//               </div>
//               <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.IsActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
//                 {p.IsActive ? "Active" : "Inactive"}
//               </span>
//             </div>

//             <div className="space-y-2 mb-4">
//               <div className="flex items-center gap-2 text-sm text-slate-500">
//                 <Mail className="w-3.5 h-3.5 text-slate-400" />
//                 <span className="truncate">{p.Email}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-slate-500">
//                 <Phone className="w-3.5 h-3.5 text-slate-400" />
//                 <span>{p.MobileNo}</span>
//               </div>
//               {p.Description && (
//                 <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.Description}</p>
//               )}
//             </div>

//             <div className="flex gap-2 pt-3 border-t border-slate-100">
//               <button onClick={() => openEdit(p)}
//                 className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium">
//                 <Pencil className="w-3.5 h-3.5" /> Edit
//               </button>
//               <button onClick={() => handleDelete(p.PeopleID)}
//                 className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition font-medium">
//                 <Trash2 className="w-3.5 h-3.5" /> Delete
//               </button>
//             </div>
//           </div>
//         ))}

//         {peoples.length === 0 && (
//           <div className="col-span-3 text-center py-16 text-slate-400">
//             <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
//             <p>No people found. Add your first person!</p>
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Person" : "Add Person"}</h2>
//               <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
//             </div>
//             <form onSubmit={handleSubmit} className="p-6 space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-slate-500 mb-1.5">Person Code</label>
//                   <input value={form.PeopleCode} onChange={(e) => setForm({ ...form, PeopleCode: e.target.value })}
//                     placeholder="e.g. P001"
//                     className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
//                   <input required value={form.PeopleName} onChange={(e) => setForm({ ...form, PeopleName: e.target.value })}
//                     placeholder="John Doe"
//                     className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Email *</label>
//                 <input required type="email" value={form.Email} onChange={(e) => setForm({ ...form, Email: e.target.value })}
//                   placeholder="john@example.com"
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Mobile No *</label>
//                 <input required value={form.MobileNo} onChange={(e) => setForm({ ...form, MobileNo: e.target.value })}
//                   placeholder="9876543210"
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//               </div>
//               {!editItem && (
//                 <div>
//                   <label className="block text-xs font-medium text-slate-500 mb-1.5">Password *</label>
//                   <input required type="password" value={form.Password} onChange={(e) => setForm({ ...form, Password: e.target.value })}
//                     placeholder="••••••••"
//                     className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
//                 </div>
//               )}
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
//                 <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })}
//                   placeholder="Role or notes..." rows={2}
//                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none" />
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