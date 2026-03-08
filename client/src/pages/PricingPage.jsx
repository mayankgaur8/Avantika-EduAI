import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    desc: "Perfect for individual teachers getting started",
    features: [
      "10 quizzes per month",
      "MCQ question type",
      "Basic question display",
      "Email support",
    ],
    cta: "Start Free",
    to: "/signup",
    highlight: false,
  },
  {
    name: "Pro Teacher",
    price: "₹299",
    period: "/month",
    desc: "For active teachers who need more power",
    features: [
      "200 quizzes per month",
      "All question types (MCQ, Short, Long, Numerical)",
      "Assignment generator",
      "PDF & Word export",
      "Answer key generation",
      "Priority email support",
    ],
    cta: "Start Pro Trial",
    to: "/signup",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Institute",
    price: "₹999",
    period: "/month",
    desc: "For coaching institutes with multiple teachers",
    features: [
      "Unlimited quizzes",
      "Multi-teacher access",
      "Question paper generator",
      "Section A/B/C papers",
      "Analytics dashboard",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    to: "/signup",
    highlight: false,
  },
];

const comparisons = [
  { feature: "Quizzes/month", free: "10", pro: "200", institute: "Unlimited" },
  { feature: "Assignment Generator", free: "✗", pro: "✓", institute: "✓" },
  { feature: "Question Paper Generator", free: "✗", pro: "✗", institute: "✓" },
  { feature: "PDF Export", free: "✗", pro: "✓", institute: "✓" },
  { feature: "Answer Keys", free: "✗", pro: "✓", institute: "✓" },
  { feature: "Multi-teacher", free: "✗", pro: "✗", institute: "✓" },
  { feature: "Analytics", free: "Basic", pro: "Full", institute: "Full + API" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/"><BrandLogo size="sm" /></Link>
        <div className="flex gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 font-medium">Login</Link>
          <Link to="/signup" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">Choose the plan that fits your needs. Upgrade or downgrade anytime.</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-6 border-2 ${plan.highlight ? "border-indigo-500 relative" : "border-gray-200"}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.desc}</p>
              </div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-400">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-indigo-500 mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.to}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlight ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Plan Comparison</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Feature</th>
                  <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Free</th>
                  <th className="px-5 py-3 text-center text-sm font-semibold text-indigo-700 bg-indigo-50">Pro Teacher</th>
                  <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Institute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisons.map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-700">{row.feature}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-500">{row.free}</td>
                    <td className="px-5 py-3 text-sm text-center font-medium text-indigo-700 bg-indigo-50/50">{row.pro}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-500">{row.institute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Have questions?</h2>
          <p className="text-gray-500">Contact us at <a href="mailto:hello@avantika.ai" className="text-indigo-600 hover:underline">hello@avantika.ai</a> or <Link to="/" className="text-indigo-600 hover:underline">visit our homepage</Link> for more information.</p>
        </div>
      </div>
    </div>
  );
}
