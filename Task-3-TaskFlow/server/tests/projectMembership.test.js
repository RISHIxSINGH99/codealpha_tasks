import test from "node:test";
import assert from "node:assert/strict";
import Project from "../src/models/Project.js";

test("Project membership helpers accept populated user documents", () => {
  const project = {
    owner: { _id: "507f191e810c19729de860ea" },
    members: [{ user: { _id: "507f191e810c19729de860eb" }, role: "member" }],
  };

  assert.equal(Project.prototype.isMember.call(project, "507f191e810c19729de860ea"), true);
  assert.equal(Project.prototype.isMember.call(project, "507f191e810c19729de860eb"), true);
  assert.equal(Project.prototype.isMember.call(project, "507f191e810c19729de860ec"), false);

  assert.equal(Project.prototype.getMemberRole.call(project, "507f191e810c19729de860ea"), "owner");
  assert.equal(Project.prototype.getMemberRole.call(project, "507f191e810c19729de860eb"), "member");
  assert.equal(Project.prototype.getMemberRole.call(project, "507f191e810c19729de860ec"), null);
});
