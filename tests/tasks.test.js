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
        expect(JSON.parse(response.text).tasks).toStrictEqual(items);
        expect(fakeMethod.called).toBe(true);
    });
})

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
        expect(JSON.parse(response.text).task).toStrictEqual(new_task);
        expect(fakeGetTask.called).toBe(true);
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

    it('update taks by ID', async () => {
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
    })
})

// describe('PATCH (mark Task complete) /v1/tasks/:id', function () {
//     let new_task;

//     beforeEach(() => {
//         new_task = createRandomItem();
//     });

//     afterEach(() => {
//         sinon.restore();
//     });

//     it('check taks by ID', async () => {
//         let fakePatchList = sinon.fake((param1, param2) => {
//             console.log(param2)
//             console.log(JSON.stringify([new_task.task_id.toString(), new_task.user_id, new_task.list_id.toString()]))
//             if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
//                 return (
//                     { rows: [{ "user_id": new_task.user_id }] }
//                 );
//             } else if (param1 === 'UPDATE tasks SET isCompleted = $4 WHERE user_id = $1 AND list_id = $2 AND task_id = $3' && JSON.stringify(param2) === JSON.stringify([new_task.task_id.toString(), new_task.user_id, new_task.list_id.toString()])) {
//                 return (
//                     { rowCount: 1 }
//                 );
//             } else {
//                 console.log(param1, param2)
//             }
//         });
//         sinon.replace(pool, 'query', fakePatchList);

//         const response = await request(api)
//             .patch(`/v1/list/${new_task.list_id}/task/${new_task.task_id}/check`)
//             .send({ email: userEmail, title: new_task.title, list_id: new_task.list_id, reoccuring_rule: new_task.reoccuring_rule, isEditable: new_task.isEditable, isCompleted: new_task.isCompleted, dueDate: new_task.dueDate, contents: new_task.contents });
//         expect(response.status).toBe(200);
//         expect(fakePatchTask.called).toBe(true);
//     })
// })

// describe('DELETE /v1/tasks/:id', function () {
//     afterEach(() => {
//         sinon.restore();
//     });

//     it('delete task by ID', async () => {
//         let fakePostList = sinon.fake((param1, param2) => {
//             if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
//                 return (
//                     { "rows": [{ "user_id": 43 }] }
//                 );
//             } else if (param1 === 'INSERT INTO tasks (title, user_id) VALUES ($1, $2)' && JSON.stringify(param2) === JSON.stringify([43])) {
//                 return (
//                     { "text": "A task has been created succesfully." }
//                 );
//             } else {
//                 console.log(param1, param2)
//             }
//         });
//         sinon.replace(pool, 'query', fakePostList);

//         const response = await request(api).post('/v1/tasks').send({ email: userEmail, title: "TEST_LIST_01" });
//         expect(response.status).toBe(201);
//         expect(fakeGetLists.called).toBe(true);
//     })
// })