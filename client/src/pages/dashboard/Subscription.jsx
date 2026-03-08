import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "₹0/month",
    features: ["10 quizzes/month", "MCQ & Short Answer", "Basic export", "Email support"],
    color: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
  },
  {
    id: "teacher",
    name: "Pro Teacher",
    price: 299,
    priceLabel: "₹299/month",
    features: ["200 quizzes/month", "All question types", "PDF & Word export", "Assignment generator", "Priority support"],
    color: "border-indigo-500",
    badge: "bg-indigo-100 text-indigo-700",
    highlight: true,
  },
  {
    id: "institute",
    name: "Institute",
    price: 999,
    priceLabel: "₹999/month",
    features: ["Unlimited quizzes", "Multi-teacher access", "Question paper generator", "Analytics dashboard", "Dedicated support"],
    color: "border-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.get("/payment/subscription").then((res) => setSubscription(res.data.data)).catch(() => {});
  }, []);

  const handleUpgrade = async (plan) => {
    if (plan.id === "free") return;
    setProcessing(plan.id);
    try {
      const res = await api.post("/payment/create-order", { plan: plan.id });
      const { order_id, amount, currency, key } = res.data.data;

      if (!window.Razorpay) {
        toast.error("Razorpay not loaded. Please refresh.");
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount,
        currency,
        name: "Avantika EduAI",
        image: `${window.location.origin}/avantika-eduai-logo.svg`,
        description: plan.name,
        order_id,
        handler: async (response) => {
          try {
            await api.post("/payment/verify", { ...response, plan: plan.id });
            toast.success("Payment successful! Plan activated.");
            window.location.reload();
          } catch { toast.error("Payment verification failed"); }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#6366f1" },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || "Payment failed");
    } finally { setProcessing(false); }
  };

  const currentPlan = user?.plan || "free";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your plan and billing</p>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 capitalize">{currentPlan === "teacher" ? "Pro Teacher" : currentPlan}</p>
            {subscription?.expiry_date && (
              <p className="text-sm text-gray-500 mt-1">Renews on {new Date(subscription.expiry_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            )}
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${subscription?.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {currentPlan === "free" ? "Free Plan" : "Active"}
          </span>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 p-5 ${plan.highlight ? "border-indigo-500" : "border-gray-200"} ${isCurrent ? "opacity-75" : ""}`}>
                {plan.highlight && <div className="text-xs font-bold text-indigo-600 mb-2">MOST POPULAR</div>}
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1 mb-4">{plan.priceLabel}</p>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-indigo-500">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || processing === plan.id || plan.id === "free"}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isCurrent ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                    plan.id === "free" ? "bg-gray-100 text-gray-500 cursor-default" :
                    plan.highlight ? "bg-indigo-600 text-white hover:bg-indigo-700" :
                    "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {isCurrent ? "Current Plan" : processing === plan.id ? "Processing..." : plan.id === "free" ? "Free Plan" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">Payments processed securely via Razorpay. Cancel anytime.</p>
    </div>
  );
}
