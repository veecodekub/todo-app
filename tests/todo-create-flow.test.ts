import assert from "node:assert/strict";
import test from "node:test";

import {
  clearCompletedTodos,
  countTodosByStatus,
  createOpenTodo,
  deleteTodo,
  filterTodosForDisplay,
  loadTodosFromStorage,
  parseStoredTodos,
  saveTodosToStorage,
  sortTodosForDisplay,
  toggleTodoStatus,
  updateTodoTitle,
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

  todos = deleteTodo(todos, 801);
  assert.deepEqual(countTodosByStatus(todos), { Open: 1, Completed: 1 });

  todos = clearCompletedTodos(todos);
  assert.deepEqual(countTodosByStatus(todos), { Open: 1, Completed: 0 });
});

test("permanently deletes individual Open and Completed Todos", () => {
  const todos: Todo[] = [
    { id: 1001, title: "Open task", status: "Open", createdAt: 1001 },
    { id: 1002, title: "Completed task", status: "Completed", createdAt: 1002 },
    { id: 1003, title: "Keep task", status: "Open", createdAt: 1003 },
  ];

  const withoutOpen = deleteTodo(todos, 1001);
  assert.deepEqual(
    withoutOpen.map((todo) => todo.title),
    ["Completed task", "Keep task"],
  );
  assert.deepEqual(countTodosByStatus(withoutOpen), { Open: 1, Completed: 1 });

  const withoutCompleted = deleteTodo(withoutOpen, 1002);
  assert.deepEqual(
    filterTodosForDisplay(withoutCompleted, "All").map((todo) => todo.title),
    ["Keep task"],
  );
  assert.deepEqual(countTodosByStatus(withoutCompleted), {
    Open: 1,
    Completed: 0,
  });
});

test("keeps deleted Todos out of persisted browser storage", () => {
  const storage = createMemoryStorage();
  const todos: Todo[] = [
    { id: 1011, title: "Persisted Open", status: "Open", createdAt: 1011 },
    {
      id: 1012,
      title: "Deleted Completed",
      status: "Completed",
      createdAt: 1012,
    },
  ];

  saveTodosToStorage(storage, deleteTodo(todos, 1012));

  assert.deepEqual(loadTodosFromStorage(storage), [
    { id: 1011, title: "Persisted Open", status: "Open", createdAt: 1011 },
  ]);
});

test("updates a Todo Title from valid inline edit text", () => {
  const todos: Todo[] = [
    { id: 901, title: "Draft plan", status: "Open", createdAt: 901 },
    { id: 902, title: "Keep this", status: "Completed", createdAt: 902 },
  ];

  const nextTodos = updateTodoTitle(todos, 901, "  Final plan  ");

  assert.equal(nextTodos[0].title, "Final plan");
  assert.equal(nextTodos[1].title, "Keep this");
});

test("does not overwrite the old Title when inline edit text is blank", () => {
  const todos: Todo[] = [
    { id: 911, title: "Original Title", status: "Open", createdAt: 911 },
  ];

  assert.deepEqual(updateTodoTitle(todos, 911, "   \n\t  "), todos);
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


test("clears all Completed Todos while preserving Open Todos", () => {
  const todos: Todo[] = [
    { id: 1101, title: "Keep newest open", status: "Open", createdAt: 1101 },
    { id: 1102, title: "Remove older completed", status: "Completed", createdAt: 1102 },
    { id: 1103, title: "Keep older open", status: "Open", createdAt: 1103 },
    { id: 1104, title: "Remove newest completed", status: "Completed", createdAt: 1104 },
  ];

  const nextTodos = clearCompletedTodos(todos);

  assert.deepEqual(
    filterTodosForDisplay(nextTodos, "All").map((todo) => todo.title),
    ["Keep older open", "Keep newest open"],
  );
  assert.deepEqual(filterTodosForDisplay(nextTodos, "Completed"), []);
  assert.deepEqual(countTodosByStatus(nextTodos), { Open: 2, Completed: 0 });
});

test("persists cleared Completed Todos so they do not return after reload", () => {
  const storage = createMemoryStorage();
  const todos: Todo[] = [
    { id: 1201, title: "Keep after reload", status: "Open", createdAt: 1201 },
    { id: 1202, title: "Clear before reload", status: "Completed", createdAt: 1202 },
  ];

  const clearedTodos = clearCompletedTodos(todos);
  saveTodosToStorage(storage, clearedTodos);

  assert.deepEqual(loadTodosFromStorage(storage), [
    { id: 1201, title: "Keep after reload", status: "Open", createdAt: 1201 },
  ]);
});

test("clear completed is a no-op when there are no Completed Todos", () => {
  const todos: Todo[] = [
    { id: 1301, title: "Only open", status: "Open", createdAt: 1301 },
  ];

  assert.deepEqual(clearCompletedTodos(todos), todos);
  assert.equal(countTodosByStatus(todos).Completed, 0);
});
