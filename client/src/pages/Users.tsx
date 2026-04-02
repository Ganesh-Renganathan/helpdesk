import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";

type Role = "admin" | "agent";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Users() {
  const { data, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      axios.get<{ users: User[] }>("/api/users").then((res) => res.data.users),
  });

  const users = data ?? [];
  const errorMessage = error
    ? ((error as any).response?.data?.error ?? error.message)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage team members and their roles.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isPending ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 bg-gray-100 rounded" />
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-14 bg-gray-100 rounded-full" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-red-500">{errorMessage}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">No users found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(user.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isPending && !errorMessage && users.length > 0 && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
}
