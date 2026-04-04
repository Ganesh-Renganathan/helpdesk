import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Users from "./Users";

vi.mock("axios");
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    session: { user: { name: "Test Admin", role: "admin" } },
    isPending: false,
    error: null,
  }),
}));

const mockedAxios = vi.mocked(axios);

function renderUsers() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Users />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const MOCK_USERS = [
  { id: "1", name: "Alice Admin", email: "alice@example.com", role: "admin", createdAt: "2026-01-01T12:00:00.000Z" },
  { id: "2", name: "Bob Agent", email: "bob@example.com", role: "agent", createdAt: "2026-02-15T12:00:00.000Z" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Users page", () => {
  describe("loading state", () => {
    it("renders skeleton rows while fetching", () => {
      mockedAxios.get = vi.fn(() => new Promise(() => {})); // never resolves
      renderUsers();
      // 4 skeleton rows — each has an avatar, name/email, badge, date skeleton
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not show user data while loading", () => {
      mockedAxios.get = vi.fn(() => new Promise(() => {}));
      renderUsers();
      expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
    });
  });

  describe("successful fetch", () => {
    beforeEach(() => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: MOCK_USERS } });
    });

    it("renders the page heading", async () => {
      renderUsers();
      expect(await screen.findByRole("heading", { name: /users/i })).toBeInTheDocument();
    });

    it("renders all users", async () => {
      renderUsers();
      expect(await screen.findByText("Alice Admin")).toBeInTheDocument();
      expect(await screen.findByText("Bob Agent")).toBeInTheDocument();
    });

    it("renders user emails", async () => {
      renderUsers();
      expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
      expect(await screen.findByText("bob@example.com")).toBeInTheDocument();
    });

    it("renders user initials in avatar", async () => {
      renderUsers();
      expect(await screen.findByText("AA")).toBeInTheDocument();
      expect(await screen.findByText("BA")).toBeInTheDocument();
    });

    it("renders role badges", async () => {
      renderUsers();
      expect(await screen.findByText("admin")).toBeInTheDocument();
      expect(await screen.findByText("agent")).toBeInTheDocument();
    });

    it("renders formatted join dates", async () => {
      renderUsers();
      expect(await screen.findByText("Jan 1, 2026")).toBeInTheDocument();
      expect(await screen.findByText("Feb 15, 2026")).toBeInTheDocument();
    });

    it("renders the user count", async () => {
      renderUsers();
      expect(await screen.findByText("2 users")).toBeInTheDocument();
    });

    it("renders singular 'user' when only one user", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: [MOCK_USERS[0]] } });
      renderUsers();
      expect(await screen.findByText("1 user")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("renders empty message when no users returned", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: [] } });
      renderUsers();
      expect(await screen.findByText("No users found.")).toBeInTheDocument();
    });

    it("does not render user count on empty list", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: [] } });
      renderUsers();
      await screen.findByText("No users found.");
      expect(screen.queryByText(/user(s)?$/)).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders server error message from response", async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({
        response: { data: { error: "Forbidden" } },
        message: "Request failed with status code 403",
      });
      renderUsers();
      expect(await screen.findByText("Forbidden")).toBeInTheDocument();
    });

    it("falls back to error.message when no response body", async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({ message: "Network Error" });
      renderUsers();
      expect(await screen.findByText("Network Error")).toBeInTheDocument();
    });

    it("does not render user count on error", async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({ message: "Network Error" });
      renderUsers();
      await screen.findByText("Network Error");
      expect(screen.queryByText(/user(s)?$/)).not.toBeInTheDocument();
    });
  });
});
