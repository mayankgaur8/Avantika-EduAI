import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../../api/client";

const COLORS = ["#6366f1", "#3b82f6", "#f97316", "#10b981"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/quiz/history?limit=50"),
      api.get("/assignment/history"),
      api.get("/papers/history"),
    ]).then(([q, a, p]) => {
      const quizzes = q.data.data || [];
      const assignments = a.data.data || [];
      const papers = p.data.data || [];

      // Subject breakdown
      const subjectMap = {};
      [...quizzes, ...assignments, ...papers].forEach((item) => {
        subjectMap[item.subject] = (subjectMap[item.subject] || 0) + 1;
      });
      const subjectData = Object.entries(subjectMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

      // Monthly trend (last 6 months)
      const monthMap = {};
      [...quizzes, ...assignments, ...papers].forEach((item) => {
        const month = new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        monthMap[month] = (monthMap[month] || 0) + 1;
      });
      const monthData = Object.entries(monthMap).map(([month, count]) => ({ month, count })).slice(-6);

      // Type distribution
      const typeData = [
        { name: "Quizzes", value: quizzes.length },
        { name: "Assignments", value: assignments.length },
        { name: "Papers", value: papers.length },
      ].filter(d => d.value > 0);

      setData({ quizzes: quizzes.length, assignments: assignments.length, papers: papers.length, subjectData, monthData, typeData });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  const total = (data?.quizzes || 0) + (data?.assignments || 0) + (data?.papers || 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Your content generation statistics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Generated", value: total, icon: "📊", color: "bg-indigo-50 text-indigo-700" },
          { label: "Quizzes", value: data?.quizzes, icon: "⚡", color: "bg-purple-50 text-purple-700" },
          { label: "Assignments", value: data?.assignments, icon: "📝", color: "bg-blue-50 text-blue-700" },
          { label: "Papers", value: data?.papers, icon: "📄", color: "bg-orange-50 text-orange-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        {data?.monthData?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Generated" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Type distribution */}
        {data?.typeData?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Content Distribution</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={data.typeData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {data.typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {data.typeData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subject breakdown */}
      {data?.subjectData?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Subjects</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.subjectData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {total === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500">No data yet. Start generating quizzes to see analytics!</p>
        </div>
      )}
    </div>
  );
}
