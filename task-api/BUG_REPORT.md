# Bug Report

## Pagination skips the first page (fixed)

- **Expected:** `GET /tasks?page=1&limit=2` returns the first two tasks.
- **Actual:** It returned tasks starting at index 2, skipping the first two.
- **Discovered:** Added a service unit test and a Supertest integration test for pages 1 and 2; both failed against the original offset calculation.
- **Fix:** Calculate the slice offset as `(page - 1) * limit` in `taskService.getPaginated`.

## Completing a task resets its priority (fixed)

- **Expected:** Completing a task changes its status and sets `completedAt`, while preserving its priority.
- **Actual:** `completeTask` replaced every task's priority with `medium`.
- **Discovered:** A service unit test completing a high-priority task showed the priority changed.
- **Fix:** Leave `priority` unchanged when building the completed task, and assert that a high-priority task remains high in the unit test.
