import assert from "node:assert/strict";
import test from "node:test";

import {
  countTodosByStatus,
  createOpenTodo,
  filterTodosForDisplay,
  loadTodosFromStorage,
  parseStoredTodos,
  saveTodosToStorage,
  sortTodosForDisplay,
  toggleTodoStatus,
  todosStorageKey,
  type Todo,
} from "../app/todo";

test("creates an Open Todo from a short valid Title", () => {
  const todo = createOpenTodo("Buy milk", 100);

  assert.deepEqual(todo, {
    id: 100,
    title: "Buy milk",
    status: "Open",
    createdAt: 100,
  });
});

test("trims valid Title before creating the Todo", () => {
  const todo = createOpenTodo("  Walk dog  ", 101);

  assert.equal(todo?.title, "Walk dog");
  assert.equal(todo?.status, "Open");
});

test("does not create a Todo from an empty or whitespace-only Title", () => {
  assert.equal(createOpenTodo("", 102), null);
  assert.equal(createOpenTodo("   \n\t  ", 103), null);
});

test("allows duplicate Titles to produce separate Open Todos", () => {
  const existingTodos: Todo[] = [createOpenTodo("Call home", 104)!];
  const duplicateTodo = createOpenTodo("Call home", 105);

  assert.equal(duplicateTodo?.status, "Open");
  assert.equal(duplicateTodo?.title, existingTodos[0].title);
  assert.notEqual(duplicateTodo?.id, existingTodos[0].id);
});

test("marks an Open Todo as Completed while keeping it visible", () => {
  const todos: Todo[] = [
    { id: 110, title: "Check inbox", status: "Open", createdAt: 110 },
    { id: 111, title: "Update notes", status: "Open", createdAt: 111 },
  ];

  const nextTodos = toggleTodoStatus(todos, 110);

  assert.equal(nextTodos.length, 2);
  assert.deepEqual(nextTodos[0], {
    id: 110,
    title: "Check inbox",
    status: "Completed",
    createdAt: 110,
  });
  assert.equal(nextTodos[1].status, "Open");
});

test("marks a Completed Todo back as Open", () => {
  const todos: Todo[] = [
    { id: 120, title: "Fix typo", status: "Completed", createdAt: 120 },
  ];

  const nextTodos = toggleTodoStatus(todos, 120);

  assert.deepEqual(nextTodos, [
    { id: 120, title: "Fix typo", status: "Open", createdAt: 120 },
  ]);
});

test("leaves visible Todos unchanged when toggling an unknown Todo", () => {
  const todos: Todo[] = [
    { id: 130, title: "Plan week", status: "Open", createdAt: 130 },
    { id: 131, title: "Archive receipt", status: "Completed", createdAt: 131 },
  ];

  assert.deepEqual(toggleTodoStatus(todos, 999), todos);
});

test("saves and reloads persisted Todo Titles and states from browser storage", () => {
  const storage = createMemoryStorage();
  const todos: Todo[] = [
    { id: 201, title: "Write release notes", status: "Open", createdAt: 201 },
    { id: 202, title: "Ship DEV-4", status: "Completed", createdAt: 202 },
  ];

  saveTodosToStorage(storage, todos);

  assert.equal(storage.getItem(todosStorageKey), JSON.stringify(todos));
  assert.deepEqual(loadTodosFromStorage(storage), todos);
});

test("treats empty, old, or unreadable storage as no persisted Todos", () => {
  assert.equal(parseStoredTodos(null), null);
  assert.equal(parseStoredTodos("not json"), null);
  assert.equal(parseStoredTodos(JSON.stringify({ todos: [] })), null);
  assert.equal(
    parseStoredTodos(
      JSON.stringify([
        { id: 301, title: "Old Todo", status: "Cancelled", createdAt: 301 },
      ]),
    ),
    null,
  );
});

test("sorts Open Todos before Completed Todos with newest first in each state", () => {
  const todos: Todo[] = [
    { id: 401, title: "Older completed", status: "Completed", createdAt: 401 },
    { id: 404, title: "Newest open", status: "Open", createdAt: 404 },
    { id: 402, title: "Older open", status: "Open", createdAt: 402 },
    { id: 405, title: "Newest completed", status: "Completed", createdAt: 405 },
  ];

  assert.deepEqual(
    sortTodosForDisplay(todos).map((todo) => todo.title),
    ["Newest open", "Older open", "Newest completed", "Older completed"],
  );
});

test("keeps ordering correct after creating and toggling Todos", () => {
  const olderOpen = createOpenTodo("Older open", 501)!;
  const newerOpen = createOpenTodo("Newer open", 502)!;
  const completedNewest = toggleTodoStatus(
    [createOpenTodo("Completed newest", 503)!],
    503,
  )[0];
  const completedOlder = toggleTodoStatus(
    [createOpenTodo("Completed older", 500)!],
    500,
  )[0];

  const sortedTodos = sortTodosForDisplay([
    completedNewest,
    olderOpen,
    completedOlder,
    newerOpen,
  ]);

  assert.deepEqual(
    sortedTodos.map((todo) => `${todo.status}: ${todo.title}`),
    [
      "Open: Newer open",
      "Open: Older open",
      "Completed: Completed newest",
      "Completed: Completed older",
    ],
  );
});

test("filters the visible Todo list by All, Open, and Completed", () => {
  const todos: Todo[] = [
    { id: 601, title: "Older completed", status: "Completed", createdAt: 601 },
    { id: 604, title: "Newest open", status: "Open", createdAt: 604 },
    { id: 602, title: "Older open", status: "Open", createdAt: 602 },
    { id: 605, title: "Newest completed", status: "Completed", createdAt: 605 },
  ];

  assert.deepEqual(
    filterTodosForDisplay(todos, "All").map((todo) => todo.title),
    ["Newest open", "Older open", "Newest completed", "Older completed"],
  );
  assert.deepEqual(
    filterTodosForDisplay(todos, "Open").map((todo) => todo.title),
    ["Newest open", "Older open"],
  );
  assert.deepEqual(
    filterTodosForDisplay(todos, "Completed").map((todo) => todo.title),
    ["Newest completed", "Older completed"],
  );
});

test("reflects create and toggle behavior in the current filter", () => {
  const firstOpen = createOpenTodo("First Open", 701)!;
  const secondOpen = createOpenTodo("Second Open", 702)!;
  const completedTodo = toggleTodoStatus([firstOpen, secondOpen], 701)[0];
  const todos = [completedTodo, secondOpen];

  assert.deepEqual(
    filterTodosForDisplay(todos, "Open").map((todo) => todo.title),
    ["Second Open"],
  );
  assert.deepEqual(
    filterTodosForDisplay(todos, "Completed").map((todo) => todo.title),
    ["First Open"],
  );
});

test("summarizes Open and Completed Todo counts after create, toggle, delete, and clear", () => {
  const firstOpen = createOpenTodo("Plan sprint", 801)!;
  const secondOpen = createOpenTodo("Review PR", 802)!;
  const thirdOpen = createOpenTodo("Write notes", 803)!;

  let todos: Todo[] = [thirdOpen, secondOpen, firstOpen];
  assert.deepEqual(countTodosByStatus(todos), { Open: 3, Completed: 0 });

  todos = toggleTodoStatus(todos, 802);
  assert.deepEqual(countTodosByStatus(todos), { Open: 2, Completed: 1 });

  todos = todos.filter((todo) => todo.id !== 801);
  assert.deepEqual(countTodosByStatus(todos), { Open: 1, Completed: 1 });

  todos = todos.filter((todo) => todo.status !== "Completed");
  assert.deepEqual(countTodosByStatus(todos), { Open: 1, Completed: 0 });
});

function createMemoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}
