const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('task routes', () => {
  beforeEach(() => taskService._reset());

  test('GET /tasks lists all tasks and filters by status', async () => {
    await request(app).post('/tasks').send({ title: 'Todo task' }).expect(201);
    await request(app).post('/tasks').send({ title: 'Active task', status: 'in_progress' }).expect(201);

    const all = await request(app).get('/tasks').expect(200);
    expect(all.body).toHaveLength(2);
    const filtered = await request(app).get('/tasks?status=todo').expect(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].title).toBe('Todo task');
  });

  test('GET /tasks paginates from page one', async () => {
    for (const title of ['First', 'Second', 'Third']) {
      await request(app).post('/tasks').send({ title }).expect(201);
    }

    const firstPage = await request(app).get('/tasks?page=1&limit=2').expect(200);
    expect(firstPage.body.map((task) => task.title)).toEqual(['First', 'Second']);
    const secondPage = await request(app).get('/tasks?page=2&limit=2').expect(200);
    expect(secondPage.body.map((task) => task.title)).toEqual(['Third']);
  });

  test('POST /tasks creates tasks and validates required fields', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({ title: 'New task', description: 'Details', priority: 'high', dueDate: '2030-01-01' })
      .expect(201);

    expect(response.body).toMatchObject({ title: 'New task', description: 'Details', priority: 'high' });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    await request(app).post('/tasks').send({ title: '   ' }).expect(400);
    await request(app).post('/tasks').send({ title: 'Bad priority', priority: 'urgent' }).expect(400);
    await request(app).post('/tasks').send({ title: 'Bad date', dueDate: 'not-a-date' }).expect(400);
  });

  test('PUT /tasks/:id updates tasks and validates update fields', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Before' }).expect(201);
    const updated = await request(app).put(`/tasks/${created.body.id}`).send({ title: 'After' }).expect(200);
    expect(updated.body.title).toBe('After');
    await request(app).put(`/tasks/${created.body.id}`).send({ status: 'waiting' }).expect(400);
    await request(app).put('/tasks/missing').send({ title: 'After' }).expect(404);
  });

  test('DELETE /tasks/:id deletes tasks and returns 404 when absent', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Delete me' }).expect(201);
    await request(app).delete(`/tasks/${created.body.id}`).expect(204);
    await request(app).delete(`/tasks/${created.body.id}`).expect(404);
  });

  test('PATCH /tasks/:id/complete marks a task done and returns 404 when absent', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Complete me' }).expect(201);
    const completed = await request(app).patch(`/tasks/${created.body.id}/complete`).expect(200);
    expect(completed.body.status).toBe('done');
    expect(completed.body.completedAt).toEqual(expect.any(String));
    await request(app).patch('/tasks/missing/complete').expect(404);
  });

  test('GET /tasks/stats reports counts and overdue tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Overdue', dueDate: '2000-01-01' }).expect(201);
    await request(app).post('/tasks').send({ title: 'Done', status: 'done' }).expect(201);

    const response = await request(app).get('/tasks/stats').expect(200);
    expect(response.body).toEqual({ todo: 1, in_progress: 0, done: 1, overdue: 1 });
  });

  test('PATCH /tasks/:id/assign assigns once, validates the name, and handles missing tasks', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Delegate me' }).expect(201);
    const assigned = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 'Sam' })
      .expect(200);
    expect(assigned.body.assignee).toBe('Sam');

    await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: '   ' }).expect(400);
    await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: 'Alex' }).expect(409);
    await request(app).patch('/tasks/missing/assign').send({ assignee: 'Sam' }).expect(404);
  });
});
