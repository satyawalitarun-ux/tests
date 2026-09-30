const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => taskService._reset());

  test('creates tasks with defaults and finds them by id', () => {
    const task = taskService.create({ title: 'Write tests' });

    expect(task).toMatchObject({
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toEqual(expect.any(String));
    expect(task.createdAt).toEqual(expect.any(String));
    expect(taskService.findById(task.id)).toEqual(task);
  });

  test('lists tasks, filters by status, and paginates from the requested page', () => {
    const first = taskService.create({ title: 'First' });
    const second = taskService.create({ title: 'Second', status: 'in_progress' });
    const third = taskService.create({ title: 'Third' });

    expect(taskService.getAll()).toEqual([first, second, third]);
    expect(taskService.getByStatus('todo')).toEqual([first, third]);
    expect(taskService.getPaginated(1, 2)).toEqual([first, second]);
    expect(taskService.getPaginated(2, 2)).toEqual([third]);
  });

  test('returns counts by status and counts only unfinished overdue tasks', () => {
    taskService.create({ title: 'Todo overdue', dueDate: '2000-01-01' });
    taskService.create({ title: 'Active overdue', status: 'in_progress', dueDate: '2000-01-01' });
    taskService.create({ title: 'Done overdue', status: 'done', dueDate: '2000-01-01' });
    taskService.create({ title: 'Future', dueDate: '2999-01-01' });

    expect(taskService.getStats()).toEqual({ todo: 2, in_progress: 1, done: 1, overdue: 2 });
  });

  test('updates existing tasks and returns null for a missing task', () => {
    const task = taskService.create({ title: 'Original' });

    expect(taskService.update(task.id, { title: 'Updated' })).toMatchObject({ title: 'Updated' });
    expect(taskService.update('missing', { title: 'No task' })).toBeNull();
    expect(taskService.findById(task.id).title).toBe('Updated');
  });

  test('removes existing tasks and reports missing tasks', () => {
    const task = taskService.create({ title: 'Remove me' });

    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.findById(task.id)).toBeUndefined();
    expect(taskService.remove(task.id)).toBe(false);
  });

  test('completes a task and returns null for a missing task', () => {
    const task = taskService.create({ title: 'Finish me', priority: 'high' });

    const completed = taskService.completeTask(task.id);
    expect(completed).toMatchObject({ status: 'done', priority: 'high' });
    expect(completed.completedAt).toEqual(expect.any(String));
    expect(taskService.completeTask('missing')).toBeNull();
  });

  test('assigns a task and returns null for a missing task', () => {
    const task = taskService.create({ title: 'Assign me' });

    expect(taskService.assign(task.id, 'Sam')).toMatchObject({ assignee: 'Sam' });
    expect(taskService.assign('missing', 'Sam')).toBeNull();
  });
});
