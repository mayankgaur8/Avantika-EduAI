import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";
import BrandLogo from "../../components/BrandLogo";

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([api.get("/admin/stats"), api.get("/admin/users?limit=20")]);
      setStats(s.data.data);
      setUsers(u.data.data || []);
    } catch { toast.error("Failed to load admin data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updatePlan = async (userId, plan) => {
    try {
      await api.patch(`/admin/users/${userId}/plan`, { plan });
      toast.success("Plan updated");
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u));
    } catch { toast.error("Failed to update plan"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" showText={false} />
          <span className="font-bold text-gray-900">Admin Panel</span>
        </div>
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Back to Dashboard</Link>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats?.users?.total || 0, sub: `${stats?.users?.paid || 0} paid`, icon: "👥", color: "from-indigo-500 to-purple-500" },
                { label: "Quizzes", value: stats?.quizzes || 0, icon: "⚡", color: "from-blue-500 to-cyan-500" },
                { label: "Assignments", value: stats?.assignments || 0, icon: "📝", color: "from-green-500 to-teal-500" },
                { label: "Est. Monthly Revenue", value: `₹${(stats?.monthly_revenue || 0).toLocaleString("en-IN")}`, icon: "💰", color: "from-yellow-500 to-orange-500" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  {s.sub && <div className="text-xs text-green-600 mt-0.5">{s.sub}</div>}
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Name", "Email", "School", "Plan", "Quizzes", "Joined", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{u.name?.[0]}</div>
                            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{u.school_name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.plan === "free" ? "bg-gray-100 text-gray-600" : u.plan === "teacher" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{u.quiz_count || 0}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.plan}
                            onChange={(e) => updatePlan(u.id, e.target.value)}
                            className="text-xs rounded-lg border border-gray-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="free">Free</option>
                            <option value="teacher">Pro Teacher</option>
                            <option value="institute">Institute</option>
                            <option value="school">School</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
