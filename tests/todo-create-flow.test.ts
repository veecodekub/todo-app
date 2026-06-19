import assert from "node:assert/strict";
import test from "node:test";

import { createOpenTodo, type Todo } from "../app/todo";

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
