"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";

export default function TodosPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <TodoForm onCreated={() => setRefreshKey((k) => k + 1)} />
        <TodoList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
