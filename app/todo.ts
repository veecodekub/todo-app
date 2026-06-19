export type TodoStatus = "Open" | "Completed";

export type Todo = {
  id: number;
  title: string;
  status: TodoStatus;
  createdAt: number;
};

export type Filter = "All" | TodoStatus;

export const filters: Filter[] = ["All", "Open", "Completed"];

export function createOpenTodo(title: string, timestamp = Date.now()): Todo | null {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return null;
  }

  return {
    id: timestamp,
    title: trimmedTitle,
    status: "Open",
    createdAt: timestamp,
  };
}
