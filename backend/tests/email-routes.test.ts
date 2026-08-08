import test from "node:test";
import assert from "node:assert/strict";
import emailRouter from "../src/routes/email.routes";

test("registers sent-email deletion routes", () => {
  const routePaths = (emailRouter as { stack: Array<{ route?: { path?: string } }> }).stack
    .map((layer) => layer.route?.path)
    .filter((path): path is string => Boolean(path));

  assert.ok(routePaths.includes("/emails/sent/:id"));
  assert.ok(routePaths.includes("/emails/sent/delete"));
});
