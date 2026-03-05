"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Calendar } from "lucide-react";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
}

interface TodoItemProps {
  todo: Todo;
  onUpdated: () => void;
}

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  medium: "outline",
  high: "destructive",
};

export default function TodoItem({ todo, onUpdated }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || "");
  const [priority, setPriority] = useState(todo.priority);
  const [dueDate, setDueDate] = useState(todo.due_date || "");

  async function handleToggle() {
    await api.patch(`/todos/${todo.id}/toggle`);
    onUpdated();
  }

  async function handleDelete() {
    await api.delete(`/todos/${todo.id}`);
    onUpdated();
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    await api.put(`/todos/${todo.id}`, {
      title,
      description: description || null,
      priority,
      due_date: dueDate || null,
    });
    setEditing(false);
    onUpdated();
  }

  if (editing) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`edit-title-${todo.id}`}>Title</Label>
              <Input
                id={`edit-title-${todo.id}`}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-desc-${todo.id}`}>Description</Label>
              <Textarea
                id={`edit-desc-${todo.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Todo["priority"])}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-due-${todo.id}`}>Due Date</Label>
                <Input
                  id={`edit-due-${todo.id}`}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={todo.completed ? "opacity-60" : ""}>
      <CardContent className="flex items-start gap-3 pt-4">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={handleToggle}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${todo.completed ? "text-muted-foreground line-through" : ""}`}>
              {todo.title}
            </span>
            <Badge variant={priorityVariant[todo.priority]}>
              {todo.priority}
            </Badge>
          </div>
          {todo.description && (
            <p className={`mt-1 text-sm ${todo.completed ? "text-muted-foreground" : "text-muted-foreground"}`}>
              {todo.description}
            </p>
          )}
          {todo.due_date && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {todo.due_date}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
