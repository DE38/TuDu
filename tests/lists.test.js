const request = require("supertest");
const sinon = require('sinon');
const api = require("../src/api");
const JWTmiddleware = require("../src/jwt_auth_middleware")
const pool = require("../src/db")
const createRandomList = require("./generateMockData/list.model")

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


describe('GET /v1/list', function () {
    let lists;
    beforeEach(() => {
        lists = [createRandomList(), createRandomList(), createRandomList()]
    })
    afterEach(() => {
        sinon.restore();
    });

    it('request all lists by user ID', async () => {
        let fakeGetLists = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": 43 }] }
                );
            } else if (param1 === 'SELECT * from list WHERE user_id = $1' && JSON.stringify(param2) === JSON.stringify([43])) {
                return (
                    { rows: lists }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeGetLists);

        const response = await request(api)
            .get('/v1/list')
            .send({ email: userEmail });
        expect(response.status).toBe(200);
        expect(fakeGetLists.called).toBe(true);
        expect(JSON.parse(response.text).lists).toStrictEqual(lists);
    });

    it('request single list by ID', async () => {
        let fakeGetLists = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": lists[0].user_id }] }
                );
            } else if (param1 === 'SELECT * from list WHERE user_id = $1 AND list_id = $2' && JSON.stringify(param2) === JSON.stringify([lists[0].user_id, lists[0].list_id.toString()])) {
                return (
                    { rows: [lists[0]], rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeGetLists);

        const response = await request(api)
            .get(`/v1/list/${lists[0].list_id}`)
            .send({ email: userEmail });
        expect(response.status).toBe(200);
        expect(fakeGetLists.called).toBe(true);
        expect(JSON.parse(response.text).list).toStrictEqual(lists[0]);
    })
});

describe('POST /v1/list', function () {
    let fakeList;
    beforeEach(() => {
        fakeList = createRandomList();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('create new list', async () => {
        let fakePostList = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": fakeList.user_id }] }
                );
            } else if (param1 === 'INSERT INTO list (user_id, list_name, description) VALUES ($1, $2, $3)' && JSON.stringify(param2) === JSON.stringify([fakeList.user_id, fakeList.list_name, fakeList.description])) {
                return (
                    { lists: ["touch grass"], rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePostList);

        const response = await request(api)
            .post('/v1/list')
            .send({ list_name: fakeList.list_name, description: fakeList.description, email: userEmail });
        expect(response.status).toBe(201);
        expect(fakePostList.called).toBe(true);
    });
});

describe('PATCH /v1/list/:list_id', function () {
    let fakeList;
    beforeEach(() => {
        fakeList = createRandomList();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('update list by list ID', async () => {
        let fakePatchList = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": fakeList.user_id }] }
                );
            } else if (param1 === 'UPDATE list SET list_name = $1, description = $4 WHERE user_id = $2 AND list_id = $3' && JSON.stringify(param2) === JSON.stringify([fakeList.list_name, fakeList.user_id, fakeList.list_id.toString(), fakeList.description])) { // i dont know why the list_id must be a string, but here we are
                return (
                    { lists: ["touch grass"], rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakePatchList);

        const response = await request(api)
            .patch(`/v1/list/${fakeList.list_id}`)
            .send({ list_name: fakeList.list_name, description: fakeList.description, email: userEmail });
        expect(response.status).toBe(200);
        expect(fakePatchList.called).toBe(true);
    });
});

describe('DELETE /v1/list/:list_id', function () {
    let fakeList;
    beforeEach(() => {
        fakeList = createRandomList();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('delete list by list ID', async () => {
        let fakeDeleteList = sinon.fake((param1, param2) => {
            if (param1 === 'SELECT user_id from users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify([userEmail])) {
                return (
                    { rows: [{ "user_id": fakeList.user_id }] }
                );
            } else if (param1 === 'DELETE FROM list WHERE user_id = $1 AND list_id = $2' && JSON.stringify(param2) === JSON.stringify([fakeList.user_id, fakeList.list_id.toString()])) {
                return (
                    { rowCount: 1 }
                );
            } else {
                console.log(param1, param2)
            }
        });
        sinon.replace(pool, 'query', fakeDeleteList);

        const response = await request(api)
            .delete(`/v1/list/${fakeList.list_id}`)
            .send({ email: userEmail });
        expect(response.status).toBe(200);
        expect(fakeDeleteList.called).toBe(true);
    });
});