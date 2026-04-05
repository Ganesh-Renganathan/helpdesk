import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";

type TicketStatus = "open" | "in_progress" | "resolved";

interface Ticket {
  id: string;
  subject: string;
  fromEmail: string;
  fromName: string | null;
  body: string;
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
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [draft, setDraft] = useState("");
  const [polishError, setPolishError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () =>
      axios.get<{ ticket: Ticket }>(`/api/tickets/${id}`).then((res) => res.data.ticket),
  });

  const polishMutation = useMutation({
    mutationFn: () =>
      axios
        .post<{ polished: string }>(`/api/tickets/${id}/polish`, { draft })
        .then((res) => res.data.polished),
    onSuccess: (polished) => {
      setDraft(polished);
      setPolishError(null);
    },
    onError: (err: any) => {
      setPolishError(err.response?.data?.error ?? err.message);
    },
  });

  const errorMessage = error
    ? ((error as any).response?.data?.error ?? error.message)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to tickets
        </Link>

        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : data ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{data.subject}</h1>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[data.status]}`}
                >
                  {statusLabels[data.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                From{" "}
                <span className="font-medium text-gray-700">
                  {data.fromName ? `${data.fromName} ` : ""}
                </span>
                <span className="text-gray-500">&lt;{data.fromEmail}&gt;</span>
                {" · "}
                {formatDate(data.createdAt)}
              </p>
            </div>

            {/* Email body */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                Message
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {data.body}
              </p>
            </div>

            {/* Reply composer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 space-y-4">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Reply
              </p>

              {polishError && (
                <Alert variant="destructive">
                  <AlertDescription>{polishError}</AlertDescription>
                </Alert>
              )}

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write your reply..."
                rows={7}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
                disabled={polishMutation.isPending}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => polishMutation.mutate()}
                  disabled={polishMutation.isPending || !draft.trim()}
                >
                  {polishMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Polishing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                      </svg>
                      Polish
                    </span>
                  )}
                </Button>
                <Button disabled={!draft.trim()}>Send Reply</Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
