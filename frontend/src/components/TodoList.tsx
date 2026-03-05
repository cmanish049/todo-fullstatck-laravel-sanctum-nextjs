"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import TodoItem from "./TodoItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

interface TodoListProps {
  refreshKey: number;
}

export default function TodoList({ refreshKey }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCompleted, setFilterCompleted] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortValue, setSortValue] = useState("created_at:desc");

  const fetchTodos = useCallback(async () => {
    const [sort, direction] = sortValue.split(":");
    const params: Record<string, string | number> = { page, sort, direction };
    if (search) params.search = search;
    if (filterCompleted !== "all") params.completed = filterCompleted;
    if (filterPriority !== "all") params.priority = filterPriority;

    const { data } = await api.get("/todos", { params });
    setTodos(data.data);
    setMeta({
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
    });
  }, [page, search, filterCompleted, filterPriority, sortValue]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos, refreshKey]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchTodos();
  }

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCompleted} onValueChange={(v) => { setFilterCompleted(v); setPage(1); }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1">Completed</SelectItem>
            <SelectItem value="0">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => { setFilterPriority(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortValue} onValueChange={(v) => { setSortValue(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at:desc">Newest</SelectItem>
            <SelectItem value="created_at:asc">Oldest</SelectItem>
            <SelectItem value="due_date:asc">Due Date (earliest)</SelectItem>
            <SelectItem value="due_date:desc">Due Date (latest)</SelectItem>
            <SelectItem value="priority:desc">Priority (high first)</SelectItem>
            <SelectItem value="priority:asc">Priority (low first)</SelectItem>
          </SelectContent>
        </Select>
      </form>

      <div className="space-y-3">
        {todos.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No todos found.</p>
        )}
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onUpdated={fetchTodos} />
        ))}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page} ({meta.total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
