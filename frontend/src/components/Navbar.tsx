"use client";

import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { clearTokens, getRefreshToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.post("/logout", { refresh_token: getRefreshToken() });
    } catch {
      // ignore
    }
    clearTokens();
    router.push("/login");
  }

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold">Todo App</h1>
        <Button variant="destructive" size="sm" onClick={handleLogout}>
          <LogOut />
          Logout
        </Button>
      </div>
    </nav>
  );
}
