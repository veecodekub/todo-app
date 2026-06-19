import assert from "node:assert/strict";
import test from "node:test";

import {
  createOpenTodo,
  loadTodosFromStorage,
  parseStoredTodos,
  saveTodosToStorage,
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
