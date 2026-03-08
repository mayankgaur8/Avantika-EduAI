import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";

const TABS = ["Quizzes", "Assignments", "Papers"];

function EmptyState({ type }) {
  const links = { Quizzes: "/dashboard/quiz", Assignments: "/dashboard/assignment", Papers: "/dashboard/paper" };
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{type === "Quizzes" ? "⚡" : type === "Assignments" ? "📝" : "📄"}</div>
      <p className="text-gray-500 font-medium">No {type.toLowerCase()} yet</p>
      <p className="text-sm text-gray-400 mt-1">Generate your first {type.toLowerCase().slice(0, -1)} to see it here</p>
      <Link to={links[type]} className="inline-block mt-4 bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
        Generate Now
      </Link>
    </div>
  );
}

export default function SavedPapers() {
  const [activeTab, setActiveTab] = useState("Quizzes");
  const [data, setData] = useState({ Quizzes: [], Assignments: [], Papers: [] });
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [q, a, p] = await Promise.all([
        api.get("/quiz/history?limit=50"),
        api.get("/assignment/history"),
        api.get("/papers/history"),
      ]);
      setData({
        Quizzes: q.data.data || [],
        Assignments: a.data.data || [],
        Papers: p.data.data || [],
      });
    } catch { toast.error("Failed to load saved papers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (type, id) => {
    if (!confirm("Delete this item?")) return;
    const endpoints = { Quizzes: "/quiz", Assignments: "/assignment", Papers: "/papers" };
    try {
      await api.delete(`${endpoints[type]}/${id}`);
      toast.success("Deleted");
      setData((prev) => ({ ...prev, [type]: prev[type].filter((i) => i.id !== id) }));
    } catch { toast.error("Delete failed"); }
  };

  const items = data[activeTab];

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Papers</h1>
        <p className="text-gray-500 text-sm mt-1">Your generated quizzes, assignments, and question papers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {tab} <span className="ml-1 text-xs text-gray-400">({data[tab].length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState type={activeTab} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-indigo-100 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">
                {activeTab === "Quizzes" ? "⚡" : activeTab === "Assignments" ? "📝" : "📄"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item.quiz_title || item.assignment_title || item.paper_title || `${item.subject} - ${item.topic || item.grade}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.subject} · {item.grade || ""} · {item.board || ""} · {item.difficulty || ""} · {formatDate(item.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.total_marks && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{item.total_marks}M</span>
                )}
                <button
                  onClick={() => handleDelete(activeTab, item.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
