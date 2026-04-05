import axios from "axios";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";

type TicketStatus = "open" | "in_progress" | "resolved";

interface Ticket {
  id: string;
  subject: string;
  fromEmail: string;
  fromName: string | null;
  status: TicketStatus;
  createdAt: string;
}

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-yellow-50 text-yellow-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-green-50 text-green-700",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Tickets() {
  const { data, isPending, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: () =>
      axios.get<{ tickets: Ticket[] }>("/api/tickets").then((res) => res.data.tickets),
  });

  const tickets = data ?? [];
  const errorMessage = error
    ? ((error as any).response?.data?.error ?? error.message)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">Support requests received by email.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isPending ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-56" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-red-500">{errorMessage}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">No tickets yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((ticket) => {
                const displayName = ticket.fromName ?? ticket.fromEmail;
                return (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {ticket.fromName ? `${ticket.fromName} · ${ticket.fromEmail}` : ticket.fromEmail}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusStyles[ticket.status]}`}
                    >
                      {statusLabels[ticket.status]}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(ticket.createdAt)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {!isPending && !errorMessage && tickets.length > 0 && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
}
