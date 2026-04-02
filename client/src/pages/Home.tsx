import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { session } = useAuth();
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () => axios.get<{ status: string }>("/api/health").then((res) => res.data),
  });

  const status = isError ? "error" : (data?.status ?? null);

  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-gray-500">Here's what's happening with your helpdesk today.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Open Tickets", value: "—", color: "bg-indigo-50 text-indigo-600" },
            { label: "In Progress", value: "—", color: "bg-amber-50 text-amber-600" },
            { label: "Resolved Today", value: "—", color: "bg-emerald-50 text-emerald-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold mb-3 ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* System status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          {isPending ? (
            <>
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </>
          ) : (
            <>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="text-sm text-gray-600">
                System status:{" "}
                <span className={`font-medium ${status === "ok" ? "text-emerald-600" : "text-red-600"}`}>
                  {status === "ok" ? "All systems operational" : "Unreachable"}
                </span>
              </span>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
