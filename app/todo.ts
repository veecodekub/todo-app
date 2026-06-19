export type TodoStatus = "Open" | "Completed";

export type Todo = {
  id: number;
  title: string;
  status: TodoStatus;
  createdAt: number;
};

export type Filter = "All" | TodoStatus;

export const filters: Filter[] = ["All", "Open", "Completed"];
export const todosStorageKey = "personal-todo.todos.v1";

export type TodoSummaryCounts = Record<TodoStatus, number>;

export function countTodosByStatus(todos: Todo[]): TodoSummaryCounts {
  return todos.reduce<TodoSummaryCounts>(
    (counts, todo) => ({
      ...counts,
      [todo.status]: counts[todo.status] + 1,
    }),
    { Open: 0, Completed: 0 },
  );
}

export function filterTodosForDisplay(todos: Todo[], filter: Filter): Todo[] {
  return sortTodosForDisplay(
    todos.filter((todo) => filter === "All" || todo.status === filter),
  );
}

export function sortTodosForDisplay(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "Open" ? -1 : 1;
    }

    return b.createdAt - a.createdAt;
  });
}

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

export function updateTodoTitle(
  todos: Todo[],
  id: number,
  title: string,
): Todo[] {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return todos;
  }

  return todos.map((todo) =>
    todo.id === id ? { ...todo, title: trimmedTitle } : todo,
  );
}

export function toggleTodoStatus(todos: Todo[], id: number): Todo[] {
  return todos.map((todo) =>
    todo.id === id
      ? {
          ...todo,
          status: todo.status === "Open" ? "Completed" : "Open",
        }
      : todo,
  );
}

export function deleteTodo(todos: Todo[], id: number): Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

export function parseStoredTodos(storedValue: string | null): Todo[] | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    const todos = parsedValue.filter(isTodo);

    return todos.length === parsedValue.length ? todos : null;
  } catch {
    return null;
  }
}

export function loadTodosFromStorage(storage: Pick<Storage, "getItem">): Todo[] | null {
  return parseStoredTodos(storage.getItem(todosStorageKey));
}

export function saveTodosToStorage(
  storage: Pick<Storage, "setItem">,
  todos: Todo[],
): void {
  storage.setItem(todosStorageKey, JSON.stringify(todos));
}

function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const possibleTodo = value as Record<string, unknown>;

  return (
    typeof possibleTodo.id === "number" &&
    Number.isFinite(possibleTodo.id) &&
    typeof possibleTodo.title === "string" &&
    possibleTodo.title.trim().length > 0 &&
    (possibleTodo.status === "Open" || possibleTodo.status === "Completed") &&
    typeof possibleTodo.createdAt === "number" &&
    Number.isFinite(possibleTodo.createdAt)
  );
}
