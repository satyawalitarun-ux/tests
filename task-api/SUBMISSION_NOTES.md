# Submission Notes

The first-page pagination offset was the main surprise: both the service and API looked straightforward, but a two-page test immediately showed page 1 began at the third task. With more time, I would test malformed JSON, invalid pagination values, date boundary behavior, and repeated completion or assignment requests.

Before production, I would ask whether task data must persist across restarts, who is allowed to update or assign tasks, whether reassignment should be supported, and what date/time zone rules the API promises. I would also clarify whether `completedAt` should be cleared when a task is moved back out of `done`.
