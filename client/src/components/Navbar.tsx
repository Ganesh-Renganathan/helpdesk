import { useNavigate, Link } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate("/login", { replace: true }),
      },
    });
  };

  const initials = session?.user.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <nav className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900">Helpdesk</span>
      </div>

      <div className="flex items-center gap-4">
        {session?.user.role === "admin" && (
          <Link to="/users" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Users
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {session && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="ml-1 text-sm text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
