"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  countTodosByStatus,
  createOpenTodo,
  deleteTodo,
  filters,
  filterTodosForDisplay,
  loadTodosFromStorage,
  saveTodosToStorage,
  toggleTodoStatus,
  updateTodoTitle,
  type Filter,
  type Todo,
} from "./todo";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: 1,
      title: "Review today’s priorities",
      status: "Open",
      createdAt: 3,
    },
    {
      id: 2,
      title: "Capture one quick win",
      status: "Open",
      createdAt: 2,
    },
    {
      id: 3,
      title: "Clear yesterday’s notes",
      status: "Completed",
      createdAt: 1,
    },
  ]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hasLoadedStoredTodos, setHasLoadedStoredTodos] = useState(false);
  const shouldSkipNextEditingBlur = useRef(false);

  useEffect(() => {
    const loadStoredTodos = window.setTimeout(() => {
      const storedTodos = loadTodosFromStorage(window.localStorage);

      if (storedTodos) {
        setTodos(storedTodos);
      }

      setHasLoadedStoredTodos(true);
    }, 0);

    return () => window.clearTimeout(loadStoredTodos);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredTodos) return;

    saveTodosToStorage(window.localStorage, todos);
  }, [hasLoadedStoredTodos, todos]);

  const todoSummaryCounts = useMemo(() => countTodosByStatus(todos), [todos]);

  const visibleTodos = useMemo(() => {
    return filterTodosForDisplay(todos, filter);
  }, [filter, todos]);

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTodo = createOpenTodo(title);
    if (!nextTodo) return;

    setTodos((currentTodos) => [nextTodo, ...currentTodos]);
    setTitle("");
  }

  function toggleTodo(id: number) {
    setTodos((currentTodos) => toggleTodoStatus(currentTodos, id));
  }

  function removeTodo(id: number) {
    if (editingTodoId === id) {
      setEditingTodoId(null);
      setEditingTitle("");
      shouldSkipNextEditingBlur.current = false;
    }

    setTodos((currentTodos) => deleteTodo(currentTodos, id));
  }

  function startEditingTodo(todo: Todo) {
    shouldSkipNextEditingBlur.current = false;
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
  }

  function saveEditingTodo() {
    if (shouldSkipNextEditingBlur.current) {
      shouldSkipNextEditingBlur.current = false;
      return;
    }

    if (editingTodoId === null) return;

    setTodos((currentTodos) =>
      updateTodoTitle(currentTodos, editingTodoId, editingTitle),
    );
    setEditingTodoId(null);
    setEditingTitle("");
  }

  function cancelEditingTodo() {
    shouldSkipNextEditingBlur.current = true;
    setEditingTodoId(null);
    setEditingTitle("");
  }

  function handleEditingKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditingTodo();
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();
    saveEditingTodo();
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              Personal Todo
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Todo
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-56">
            <div className="rounded-2xl bg-stone-100 p-3">
              <p className="text-stone-500">Open</p>
              <p className="text-2xl font-semibold">{todoSummaryCounts.Open}</p>
            </div>
            <div className="rounded-2xl bg-stone-100 p-3">
              <p className="text-stone-500">Completed</p>
              <p className="text-2xl font-semibold">{todoSummaryCounts.Completed}</p>
            </div>
          </div>
        </header>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addTodo}>
          <label className="sr-only" htmlFor="todo-title">
            Todo Title
          </label>
          <input
            id="todo-title"
            className="min-h-12 flex-1 rounded-2xl border border-stone-300 bg-white px-4 text-base outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-200"
            placeholder="Add a Todo Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button
            className="min-h-12 rounded-2xl bg-stone-950 px-5 font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            type="submit"
            disabled={!title.trim()}
          >
            Add Todo
          </button>
        </form>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-2xl bg-stone-100 p-1">
            {filters.map((nextFilter) => (
              <button
                key={nextFilter}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition sm:flex-none ${
                  filter === nextFilter
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-500 hover:text-stone-950"
                }`}
                type="button"
                onClick={() => setFilter(nextFilter)}
              >
                {nextFilter}
              </button>
            ))}
          </div>
          <button
            className="rounded-2xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={todoSummaryCounts.Completed === 0}
            onClick={() =>
              setTodos((currentTodos) =>
                currentTodos.filter((todo) => todo.status !== "Completed"),
              )
            }
          >
            Clear completed
          </button>
        </div>

        <ul className="flex flex-col gap-3" aria-label="Todo list">
          {visibleTodos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs"
            >
              <button
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                  todo.status === "Completed"
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-300 text-transparent hover:border-stone-950"
                }`}
                type="button"
                aria-label={`Mark ${todo.title} as ${
                  todo.status === "Open" ? "Completed" : "Open"
                }`}
                onClick={() => toggleTodo(todo.id)}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                {editingTodoId === todo.id ? (
                  <input
                    className="min-h-10 w-full rounded-xl border border-stone-300 bg-white px-3 font-medium text-stone-950 outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-200"
                    aria-label={`Edit Title for ${todo.title}`}
                    value={editingTitle}
                    autoFocus
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onBlur={saveEditingTodo}
                    onKeyDown={handleEditingKeyDown}
                  />
                ) : (
                  <button
                    className={`block max-w-full truncate text-left font-medium underline-offset-4 transition hover:underline focus:outline-none focus:ring-4 focus:ring-stone-200 ${
                      todo.status === "Completed"
                        ? "text-stone-400 line-through"
                        : "text-stone-950"
                    }`}
                    type="button"
                    aria-label={`Edit Title for ${todo.title}`}
                    onClick={() => startEditingTodo(todo)}
                  >
                    {todo.title}
                  </button>
                )}
                <p className="text-sm text-stone-500">{todo.status}</p>
              </div>
              <button
                className="shrink-0 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
                type="button"
                aria-label={`Delete ${todo.title}`}
                onClick={() => removeTodo(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        {visibleTodos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
            No Todos to show for {filter}.
          </div>
        ) : null}
      </section>
    </main>
  );
}
