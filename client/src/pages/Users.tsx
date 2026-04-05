import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";

type Role = "admin" | "agent";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
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

function validate(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim() || name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "A valid email is required.";
  }
  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

export default function Users() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      axios.get<{ users: User[] }>("/api/users").then((res) => res.data.users),
  });

  const mutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      axios.post<{ user: User }>("/api/users", payload).then((res) => res.data.user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
    onError: (err: any) => {
      setApiError(err.response?.data?.error ?? err.message);
    },
  });

  function openModal() {
    setName("");
    setEmail("");
    setPassword("");
    setFormErrors({});
    setApiError(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setName("");
    setEmail("");
    setPassword("");
    setFormErrors({});
    setApiError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(name, email, password);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError(null);
    mutation.mutate({ name: name.trim(), email, password });
  }

  const users = data ?? [];
  const errorMessage = error
    ? ((error as any).response?.data?.error ?? error.message)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-sm text-gray-500">Manage team members and their roles.</p>
          </div>
          <Button onClick={openModal}>Add User</Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isPending ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-3 w-20" />
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add User</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {apiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  disabled={mutation.isPending}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  disabled={mutation.isPending}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-password">Password</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={mutation.isPending}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Adding..." : "Add User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
