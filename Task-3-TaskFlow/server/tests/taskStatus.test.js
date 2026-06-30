import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTaskStatus, isValidTaskStatus } from '../src/utils/taskStatus.js';

test('normalizes legacy completed statuses to done', () => {
  assert.equal(normalizeTaskStatus('completed'), 'done');
  assert.equal(normalizeTaskStatus('done'), 'done');
});

test('accepts the kanban statuses and legacy completed alias', () => {
  assert.equal(isValidTaskStatus('todo'), true);
  assert.equal(isValidTaskStatus('in-progress'), true);
  assert.equal(isValidTaskStatus('review'), true);
  assert.equal(isValidTaskStatus('done'), true);
  assert.equal(isValidTaskStatus('completed'), true);
  assert.equal(isValidTaskStatus('blocked'), false);
});
