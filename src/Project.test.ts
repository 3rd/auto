import test from "ava";
import sinon from "sinon";
import { stub } from "./utils/test";
import { Project } from "./Project";

test.beforeEach(() => {
  sinon.restore();
});

test("detects Go project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("go.mod").returns(true);
  t.true(Project.resolveFromPath().isGoProject);
});

test("detects JavaScript project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  t.true(Project.resolveFromPath().isJavaScriptProject);
});

test("detects TypeScript project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  hasFile.withArgs("tsconfig.json").returns(true);
  t.true(Project.resolveFromPath().isJavaScriptProject);
  t.true(Project.resolveFromPath().isTypeScriptProject);
});

test("detects Node project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  const readJSON = stub(Project.prototype, "readJSON");

  // not a Node project
  readJSON.returns({});
  t.false(Project.resolveFromPath().isNodeProject);

  // Node project with engines.node
  readJSON.returns({ engines: { node: "x" } });
  t.true(Project.resolveFromPath().isNodeProject);

  // Node project with @types/node
  readJSON.returns({ dependencies: { "@types/node": "x" } });
  t.true(Project.resolveFromPath().isNodeProject);
});

test("gets JavaScript dependencies", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  const readJSON = stub(Project.prototype, "readJSON");
  readJSON.returns({
    dependencies: { foo: "1.0.0" },
    devDependencies: { bar: "2.0.0" },
    peerDependencies: { baz: "3.0.0" },
  });
  t.deepEqual(Project.resolveFromPath().dependencies, [
    { name: "foo", version: "1.0.0" },
    { name: "bar", version: "2.0.0" },
    { name: "baz", version: "3.0.0" },
  ]);
});

test("gets Go dependencies", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("go.mod").returns(true);
  const readFile = stub(Project.prototype, "readFile");
  readFile.returns(`
    module github.com/owner/repo

    require (
      github.com/foo/bar v1.0.0
      github.com/baz/qux v2.0.0
    )
  `);
  t.deepEqual(Project.resolveFromPath().dependencies, [
    { name: "github.com/foo/bar", version: "v1.0.0" },
    { name: "github.com/baz/qux", version: "v2.0.0" },
  ]);
});

test("gets multi-source dependencies", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  hasFile.withArgs("go.mod").returns(true);
  const readJSON = stub(Project.prototype, "readJSON");
  readJSON.returns({
    dependencies: { foo: "1.0.0" },
    devDependencies: { bar: "2.0.0" },
    peerDependencies: { baz: "3.0.0" },
  });
  const readFile = stub(Project.prototype, "readFile");
  readFile.returns(`
    module github.com/owner/repo

    require (
      github.com/foo/bar v1.0.0
      github.com/baz/qux v2.0.0
    )
  `);
  t.deepEqual(Project.resolveFromPath().dependencies, [
    { name: "foo", version: "1.0.0" },
    { name: "bar", version: "2.0.0" },
    { name: "baz", version: "3.0.0" },
    { name: "github.com/foo/bar", version: "v1.0.0" },
    { name: "github.com/baz/qux", version: "v2.0.0" },
  ]);
});

test("checks if dependency exists", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  const readJSON = stub(Project.prototype, "readJSON");
  readJSON.returns({
    dependencies: { foo: "1.0.0" },
    devDependencies: { bar: "2.0.0" },
    peerDependencies: { baz: "3.0.0" },
  });
  t.true(Project.resolveFromPath().hasDependency("foo"));
  t.true(Project.resolveFromPath().hasDependency("bar"));
  t.true(Project.resolveFromPath().hasDependency("baz"));
  t.false(Project.resolveFromPath().hasDependency("brr"));
});

test("checks if any of dependency[] exists", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  const readJSON = stub(Project.prototype, "readJSON");
  readJSON.returns({
    dependencies: { foo: "1.0.0" },
  });
  t.true(Project.resolveFromPath().hasAnyDependency(["foo", "bar", "baz"]));
  t.false(Project.resolveFromPath().hasAnyDependency(["moo", "bar", "baz"]));
});
