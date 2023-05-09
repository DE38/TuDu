const request = require("supertest");
const sinon = require('sinon');
const api = require("../src/api");
const JWTmiddleware = require("../src/jwt_auth_middleware")
const pool = require("../src/db")
const createRandomItem = require("./generateMockData/model.item");

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


// tasks

describe('GET /v1/tasks', function () {
    let items;

    beforeEach(() => {
        items = [createRandomItem(0), createRandomItem(0)];
    });

    afterEach(() => {
        sinon.restore();
    });

    it('make the right SQL queries', async () => {
        let fakeMethod = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    {"rows": [{"user_id": 43}]}
                );
            } else if (param1 === 'SELECT * from tasks WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    {"rows": ["touch grass"]}
                );
            }
        })
        sinon.replace(pool, 'query', fakeMethod)

        const response = await request(api)
            .get("/v1/tasks")
            .send({email: "test@gmail.com"})
        expect(response.status).toBe(200);
        expect(fakeMethod.called).toBe(true);
    });

    it('query & return all tasks by user ID', async () => {
        let fakeMethod = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    {"rows": [{"user_id": 43}]}
                );
            } else if (param1 === 'SELECT * from tasks WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    {"rows": items}
                );
            }
        })
        sinon.replace(pool, 'query', fakeMethod)

        const response = await request(api)
            .get("/v1/tasks")
            .send({email: "test@gmail.com"})
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text).tasks).toStrictEqual(items);
        expect(fakeMethod.called).toBe(true);
    });
})

describe('GET /v1/tasks/:id', function () {
    const ID = Math.random();
    let new_task;

    beforeEach(() => {
        new_task = createRandomItem(ID);
    });
    
    afterEach(() => {
        sinon.restore();
    });

    it('get single task by its ID', async () => {
        let fakeGetList = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'SELECT * from tasks WHERE task_id = $1 AND user_id = $2' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { "task": new_task }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeGetList);

        const response = await request(api).get(`/v1/tasks/${ID}`).send({ email: "test@gmail.com" });
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text).task).toStrictEqual(new_task);
        expect(fakeGetLists.called).toBe(true);
    })
})

describe('POST /v1/tasks', function () {
    afterEach(() => {
        sinon.restore();
    });

    it('create new task', async () => {
        let fakePostList = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'INSERT INTO tasks (title, user_id) VALUES ($1, $2)' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { "text": "A task has been created succesfully." }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePostList);

        const response = await request(api).post('/v1/tasks').send({ email: "test@gmail.com", title: "TEST_LIST_01" });
        expect(response.status).toBe(201);
        expect(fakeGetLists.called).toBe(true);
    })
})

describe('PATCH /v1/tasks/:id', function () {
    afterEach(() => {
        sinon.restore();
    });

    it('update taks by ID', async () => {
        let fakePostList = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'INSERT INTO tasks (title, user_id) VALUES ($1, $2)' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { "text": "A task has been created succesfully." }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePostList);

        const response = await request(api).post('/v1/tasks').send({ email: "test@gmail.com", title: "TEST_LIST_01" });
        expect(response.status).toBe(201);
        expect(fakeGetLists.called).toBe(true);
    })
})

describe('DELETE /v1/tasks/:id', function () {
    afterEach(() => {
        sinon.restore();
    });

    it('delete task by ID', async () => {
        let fakePostList = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    { "rows": [{ "user_id": 43 }] }
                );
            } else if (param1 === 'INSERT INTO tasks (title, user_id) VALUES ($1, $2)' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { "text": "A task has been created succesfully." }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePostList);

        const response = await request(api).post('/v1/tasks').send({ email: "test@gmail.com", title: "TEST_LIST_01" });
        expect(response.status).toBe(201);
        expect(fakeGetLists.called).toBe(true);
    })
})


// LISTS

describe('GET /v1/list', function () {
    afterEach(() => {
        sinon.restore();
    });

    it('request all lists by user ID', async () => {
        let fakeGetLists = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    {"rows": [{"user_id": 43}]}
                );
            } else if (param1 === 'SELECT * from list WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    {"lists": ["touch grass"]}
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeGetLists);

        const response = await request(api).get('/v1/list').send({email: "test@gmail.com"});
        expect(response.status).toBe(200);
        expect(fakeGetLists.called).toBe(true);
    })
});

describe('DELETE /v1/list', function () {
    afterEach(() => {
        sinon.restore();
    });

    it('create new list', async () => {
        let fakeGetLists = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
                return (
                    {"rows": [{"user_id": 43}]}
                );
            } else if (param1 === 'SELECT * from list WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    {"lists": ["touch grass"]}
                );
            } else {
                console.log(param1, param2)
            }
        });
    })
})