"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, FolderKanban, Calendar, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "@/hooks/useRole";

export default function ProjectsPage() {
  const { isAdmin, userId } = useRole();
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    ProjectName: "",
    ProjectStartDate: "",
    ProjectEndDate: "",
    ProjectDetail: "",
    Description: "",
    IsActive: true,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProjects();
  }, [search]);

  async function fetchProjects() {
    const res = await fetch(`/api/projects?search=${search}&limit=100`, { headers });
    const d = await res.json();
    setProjects(d.projects || []);
    setTotal(d.total || 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editItem ? `/api/projects/${editItem.ProjectID}` : "/api/projects";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? "Project updated!" : "Project created!");
      setShowForm(false);
      setEditItem(null);
      resetForm();
      fetchProjects();
    } else {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this project?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      toast.success("Project deleted!");
      fetchProjects();
    } else {
      toast.error("Cannot delete — it may have expenses/incomes linked.");
    }
  }

  function resetForm() {
    setForm({ ProjectName: "", ProjectStartDate: "", ProjectEndDate: "", ProjectDetail: "", Description: "", IsActive: true });
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({
      ProjectName: item.ProjectName || "",
      ProjectStartDate: item.ProjectStartDate ? item.ProjectStartDate.split("T")[0] : "",
      ProjectEndDate: item.ProjectEndDate ? item.ProjectEndDate.split("T")[0] : "",
      ProjectDetail: item.ProjectDetail || "",
      Description: item.Description || "",
      IsActive: item.IsActive ?? true,
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 text-sm">{total} total projects</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.ProjectID} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-blue-500" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.IsActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                {p.IsActive ? "Active" : "Inactive"}
              </span>
            </div>

            <h3 className="font-semibold text-slate-800 text-lg mb-1">{p.ProjectName}</h3>
            <p className="text-slate-500 text-sm mb-3 line-clamp-2">{p.ProjectDetail || p.Description || "No description"}</p>

            {(p.ProjectStartDate || p.ProjectEndDate) && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                <Calendar className="w-3 h-3" />
                {p.ProjectStartDate && new Date(p.ProjectStartDate).toLocaleDateString("en-IN")}
                {p.ProjectStartDate && p.ProjectEndDate && " → "}
                {p.ProjectEndDate && new Date(p.ProjectEndDate).toLocaleDateString("en-IN")}
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => openEdit(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              {/* <button
                onClick={() => handleDelete(p.ProjectID)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button> */}
              {isAdmin || p.UserID === userId ? (
  <button onClick={() => handleDelete(p.ProjectID)}>
    <Trash2 className="w-3.5 h-3.5" />
  </button>
) : (
  <span title="No access" className="p-1.5 text-slate-300 cursor-not-allowed">
    <Lock className="w-3.5 h-3.5" />
  </span>
)}
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No projects found. Add your first project!</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editItem ? "Edit Project" : "Add New Project"}</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Project Name *</label>
                <input
                  required
                  value={form.ProjectName}
                  onChange={(e) => setForm({ ...form, ProjectName: e.target.value })}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.ProjectStartDate}
                    onChange={(e) => setForm({ ...form, ProjectStartDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={form.ProjectEndDate}
                    onChange={(e) => setForm({ ...form, ProjectEndDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Project Detail</label>
                <textarea
                  value={form.ProjectDetail}
                  onChange={(e) => setForm({ ...form, ProjectDetail: e.target.value })}
                  placeholder="What is this project about?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea
                  value={form.Description}
                  onChange={(e) => setForm({ ...form, Description: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.IsActive}
                  onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-600">Active Project</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditItem(null); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition shadow-md shadow-blue-500/20"
                >
                  {editItem ? "Update Project" : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}