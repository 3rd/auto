import test from "ava";
import sinon from "sinon";
import { stub } from "./utils/test";
import Project from "./Project";

test.beforeEach(() => {
  sinon.restore();
});

test("detects Go project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("go.mod").returns(true);
  t.true(Project.resolveFromDirectory().isGoProject);
});

test("detects JavaScript project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  t.true(Project.resolveFromDirectory().isJavaScriptProject);
});

test("detects TypeScript project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  hasFile.withArgs("tsconfig.json").returns(true);
  t.true(Project.resolveFromDirectory().isJavaScriptProject);
  t.true(Project.resolveFromDirectory().isTypeScriptProject);
});

test("detects Node project", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  const readJSON = stub(Project.prototype, "readJSON");

  // not a Node project
  readJSON.returns({});
  t.false(Project.resolveFromDirectory().isNodeProject);

  // Node project with engines.node
  readJSON.returns({ engines: { node: "x" } });
  t.true(Project.resolveFromDirectory().isNodeProject);

  // Node project with @types/node
  readJSON.returns({ dependencies: { "@types/node": "x" } });
  t.true(Project.resolveFromDirectory().isNodeProject);
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
  t.deepEqual(Project.resolveFromDirectory().dependencies, [
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
  t.deepEqual(Project.resolveFromDirectory().dependencies, [
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
  t.deepEqual(Project.resolveFromDirectory().dependencies, [
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
  t.true(Project.resolveFromDirectory().hasDependency("foo"));
  t.true(Project.resolveFromDirectory().hasDependency("bar"));
  t.true(Project.resolveFromDirectory().hasDependency("baz"));
  t.false(Project.resolveFromDirectory().hasDependency("brr"));
});

test("checks if any of dependency[] exists", async (t) => {
  const hasFile = stub(Project.prototype, "hasFile");
  hasFile.returns(false);
  hasFile.withArgs("package.json").returns(true);
  const readJSON = stub(Project.prototype, "readJSON");
  readJSON.returns({
    dependencies: { foo: "1.0.0" },
  });
  t.true(Project.resolveFromDirectory().hasAnyDependency(["foo", "bar", "baz"]));
  t.false(Project.resolveFromDirectory().hasAnyDependency(["moo", "bar", "baz"]));
});
