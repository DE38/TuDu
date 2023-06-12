const request = require("supertest");
const sinon = require('sinon');
const api = require("../src/api");
const JWTmiddleware = require("../src/jwt_auth_middleware")
const pool = require("../src/db")
const createRandomItem = require("./generateMockData/item.model");

// mock middleware to circumvent authentication
const originalMiddleware = api._router.stack.find(layer => layer.handle === JWTmiddleware).handle;
const middlewareMock = jest.fn((req, res, next) => {
    next();
});
api._router.stack.forEach(layer => {
    if (layer.handle === originalMiddleware) {
        layer.handle = middlewareMock;
    }
});

const userEmail = "test@gmail.com";

describe('GET /v1/tasks', function () {
    let items;

    beforeEach(() => {
        items = [createRandomItem(), createRandomItem()];
    });

    afterEach(() => {
        sinon.restore();
    });

    it('make the right SQL queries', async () => {
        let fakeMethod = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { "rows": ["touch grass"] }
                );
            }
        })
        sinon.replace(pool, 'query', fakeMethod)

        const response = await request(api)
            .get("/v1/tasks")
            .send({ email: userEmail })
        expect(response.status).toBe(200);
        expect(fakeMethod.called).toBe(true);
    });

    it('query & return all tasks by user ID', async () => {
        let fakeMethod = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { "rows": items }
                );
            }
        })
        sinon.replace(pool, 'query', fakeMethod)

        const response = await request(api)
            .get("/v1/tasks")
            .send({ email: userEmail })
        expect(response.status).toBe(200);
        expect(fakeMethod.called).toBe(true);
        expect(JSON.parse(response.text).tasks).toStrictEqual(items);
    });

    it('no tasks received; wrong data', async () => {
        let fakeMethod = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { "rows": items }
                );
            }
        })
        sinon.replace(pool, 'query', fakeMethod)

        const response = await request(api)
            .get("/v1/tasks")
            .send({ email: "karl" })
        expect(response.status).toBe(500);
        expect(fakeMethod.called).toBe(true);
    });
})

describe('GET /v1/:list_id/tasks/', function () {
    let items;
    const list_id = 5;

    beforeEach(() => {
        items = [createRandomItem(list_id), createRandomItem(list_id), createRandomItem()];
    });

    afterEach(() => {
        sinon.restore();
    });

    it('get all tasks of list_id', async () => {
        let fakeGetTasks = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE user_id = $1 AND list_id = $2' && JSON.stringify(param2) === JSON.stringify([43, list_id.toString()])) {
                return (
                    { "rows": items.filter(task => task.list_id == list_id) }
                );
            }
        });
        sinon.replace(pool, 'query', fakeGetTasks);

        const response = await request(api)
            .get(`/v1/list/${list_id}/tasks`)
            .send({ email: userEmail })
        expect(response.status).toBe(200);
        expect(fakeGetTasks.called).toBe(true);
        expect(JSON.parse(response.text).tasks).toStrictEqual(items.filter(task => task.list_id == list_id));        
    });

    it('get all tasks of list_id', async () => {
        let fakeGetTasks = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE user_id = $1 AND list_id = $2' && JSON.stringify(param2) === JSON.stringify([43, "0"])) {
                return (
                    { "rows": items.filter(task => task.list_id == list_id) }
                );
            }
        });
        sinon.replace(pool, 'query', fakeGetTasks);

        const response = await request(api)
            .get(`/v1/list/${list_id}/tasks`)
            .send({ email: userEmail })
        expect(fakeGetTasks.called).toBe(true);
        expect(response.status).toBe(500);
    });
});

describe('GET /v1/list/:list_id/task/:task_id', function () {
    let new_task;

    beforeEach(() => {
        new_task = createRandomItem();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('get task by IDs', async () => {
        let fakeGetTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ user_id: new_task.user_id }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE task_id = $1 AND user_id = $2 AND list_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.task_id.toString(), new_task.user_id, new_task.list_id.toString()])) {
                return (
                    { rows: [new_task], rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeGetTask);

        const response = await request(api)
            .get(`/v1/list/${new_task.list_id}/task/${new_task.task_id}`)
            .send({ email: userEmail });

        expect(response.status).toBe(200);
        expect(fakeGetTask.called).toBe(true);
        expect(JSON.parse(response.text).task).toStrictEqual(new_task);
    })
})

describe('POST /v1/tasks', function () {
    let new_task;
    beforeEach(() => {
        new_task = createRandomItem();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('create new task', async () => {
        let fakePostTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": new_task.user_id }] }
                );
            } else if (param1 === 'INSERT INTO tasks (user_id, list_id, title, isEditable, isCompleted, dueDate, contents, reoccuring_rule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)' && JSON.stringify(param2) === JSON.stringify([new_task.user_id, new_task.list_id, new_task.title, new_task.isEditable, new_task.isCompleted, new_task.dueDate, new_task.contents, new_task.reoccuring_rule])) {
                return (
                    { rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePostTask);

        const response = await request(api)
            .post('/v1/tasks')
            .send({ email: userEmail, title: new_task.title, list_id: new_task.list_id, reoccuring_rule: new_task.reoccuring_rule, isEditable: new_task.isEditable, isCompleted: new_task.isCompleted, dueDate: new_task.dueDate, contents: new_task.contents });
        expect(response.status).toBe(201);
        expect(fakePostTask.called).toBe(true);
    });

    it('no new task; internal server error', async () => {
        let fakePostTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": new_task.user_id }] }
                );
            } else if (param1 === 'INSERT INTO tasks (user_id, list_id, title, isEditable, isCompleted, dueDate, contents, reoccuring_rule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)' && JSON.stringify(param2) === JSON.stringify([new_task.user_id, new_task.list_id, new_task.title, new_task.isEditable, new_task.isCompleted, new_task.dueDate, new_task.contents, new_task.reoccuring_rule])) {
                return (
                    { rowCount: 0 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePostTask);

        const response = await request(api)
            .post('/v1/tasks')
            .send({ email: userEmail, title: new_task.title, list_id: new_task.list_id, reoccuring_rule: new_task.reoccuring_rule, isEditable: new_task.isEditable, isCompleted: new_task.isCompleted, dueDate: new_task.dueDate, contents: new_task.contents });
        expect(fakePostTask.called).toBe(true);
        expect(response.status).toBe(500);
    })
})

describe('PATCH (update task) /v1/list/:list_id/task/:task_id', function () {
    let new_task;

    beforeEach(() => {
        new_task = createRandomItem();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('update task by ID', async () => {
        let fakePatchTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": new_task.user_id }] }
                );
            } else if (param1 === 'UPDATE tasks SET title = $4, dueDate = $5, contents = $6, reoccuring_rule = $7 WHERE user_id = $1 AND list_id = $2 AND task_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.user_id, new_task.list_id.toString(), new_task.task_id.toString(), new_task.title, new_task.dueDate, new_task.contents, new_task.reoccuring_rule])) {
                return (
                    { rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePatchTask);

        const response = await request(api)
            .patch(`/v1/list/${new_task.list_id}/task/${new_task.task_id}`)
            .send({ email: userEmail, title: new_task.title, list_id: new_task.list_id, reoccuring_rule: new_task.reoccuring_rule, isEditable: new_task.isEditable, isCompleted: new_task.isCompleted, dueDate: new_task.dueDate, contents: new_task.contents });
        expect(response.status).toBe(200);
        expect(fakePatchTask.called).toBe(true);
        expect(JSON.parse(response.text).text).toStrictEqual(`The task has been updated successfully.`);
    });

    it('no updated task; internal server error', async () => {
        let fakePatchTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": new_task.user_id }] }
                );
            } else if (param1 === 'UPDATE tasks SET title = $4, dueDate = $5, contents = $6, reoccuring_rule = $7 WHERE user_id = $1 AND list_id = $2 AND task_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.user_id, new_task.list_id.toString(), new_task.task_id.toString(), new_task.title, new_task.dueDate, new_task.contents, new_task.reoccuring_rule])) {
                return (
                    { rowCount: 0 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePatchTask);

        const response = await request(api)
            .patch(`/v1/list/${new_task.list_id}/task/${new_task.task_id}`)
            .send({ email: userEmail, title: new_task.title, list_id: new_task.list_id, reoccuring_rule: new_task.reoccuring_rule, isEditable: new_task.isEditable, isCompleted: new_task.isCompleted, dueDate: new_task.dueDate, contents: new_task.contents });
        expect(fakePatchTask.called).toBe(true);
        expect(response.status).toBe(500);
        expect(JSON.parse(response.text).text).toStrictEqual(`could not find a task matching this ID`);
    });
})

describe('PATCH (mark Task complete) /v1/tasks/:id', function () {
    let new_task;

    beforeEach(() => {
        new_task = createRandomItem();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('check task by ID', async () => {
        let fakePatchTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": new_task.user_id }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE task_id = $1 AND user_id = $2 AND list_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.task_id.toString(), new_task.user_id, new_task.list_id.toString()])) {
                return ({ rows: [new_task] });
            } else if (param1 === 'UPDATE tasks SET isCompleted = $4 WHERE user_id = $1 AND list_id = $2 AND task_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.user_id, new_task.list_id.toString(), new_task.task_id.toString(), !new_task.isCompleted])) {
                new_task.isCompleted = !new_task.isCompleted;
                return (
                    { rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePatchTask);

        const response = await request(api)
            .patch(`/v1/list/${new_task.list_id}/task/${new_task.task_id}/check`)
            .send({ email: userEmail, title: new_task.title, list_id: new_task.list_id, reoccuring_rule: new_task.reoccuring_rule, isEditable: new_task.isEditable, isCompleted: new_task.isCompleted, dueDate: new_task.dueDate, contents: new_task.contents });
        expect(response.status).toBe(200);
        expect(fakePatchTask.called).toBe(true);
        expect(JSON.parse(response.text).text).toStrictEqual(`Task ${new_task.task_id} has been set to ${new_task.isCompleted}.`);
    });

    it('no checked task; mismatch ID', async () => {
        let fakePatchTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": new_task.user_id }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE task_id = $1 AND user_id = $2 AND list_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.task_id.toString(), new_task.user_id, new_task.list_id.toString()])) {
                return ({ rows: [new_task] });
            } else if (param1 === 'UPDATE tasks SET isCompleted = $4 WHERE user_id = $1 AND list_id = $2 AND task_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.user_id, new_task.list_id.toString(), new_task.task_id.toString(), !new_task.isCompleted])) {
                new_task.isCompleted = !new_task.isCompleted;
                return (
                    { rowCount: 0 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePatchTask);

        const response = await request(api)
            .patch(`/v1/list/${new_task.list_id}/task/${new_task.task_id}/check`)
            .send({ email: userEmail, title: new_task.title, list_id: new_task.list_id, reoccuring_rule: new_task.reoccuring_rule, isEditable: new_task.isEditable, isCompleted: new_task.isCompleted, dueDate: new_task.dueDate, contents: new_task.contents });
        expect(fakePatchTask.called).toBe(true);
        expect(response.status).toBe(500);
        expect(JSON.parse(response.text).text).toStrictEqual(`could not find a task matching this ID`);
    });
})

describe('DELETE /v1/list/:list_id/task/:task_id', function () {
    let task;
    beforeEach(() => {
        task = createRandomItem();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('delete task by ID', async () => {
        let fakeDeleteTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": task.user_id }] }
                );
            } else if (param1 === 'DELETE FROM tasks WHERE user_id = $1 AND list_id = $2 AND task_id = $3' && JSON.stringify(param2) === JSON.stringify([task.user_id, task.list_id.toString(), task.task_id.toString()])) {
                return (
                    { rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeDeleteTask);

        const response = await request(api)
            .delete(`/v1/list/${task.list_id}/task/${task.task_id}`)
            .send({ email: userEmail });

        expect(response.status).toBe(200);
        expect(fakeDeleteTask.called).toBe(true);
        expect(JSON.parse(response.text).text).toStrictEqual(`A Task has been deleted successfully.`);
    });

    it('no deleted task; mismatch ID', async () => {
        let fakeDeleteTask = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { "rows": [{ "user_id": task.user_id }] }
                );
            } else if (param1 === 'DELETE FROM tasks WHERE user_id = $1 AND list_id = $2 AND task_id = $3' && JSON.stringify(param2) === JSON.stringify([task.user_id, task.list_id.toString(), task.task_id.toString()])) {
                return (
                    { rowCount: 0 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeDeleteTask);

        const response = await request(api)
            .delete(`/v1/list/${task.list_id}/task/${task.task_id}`)
            .send({ email: userEmail });
        expect(fakeDeleteTask.called).toBe(true);
        expect(response.status).toBe(500);
        expect(JSON.parse(response.text).text).toStrictEqual(`could not find a task matching this ID`);
    });
})