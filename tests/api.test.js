const request = require("supertest");
const sinon = require('sinon');
const api = require("../src/api");
const JWTmiddleware = require("../src/jwt_auth_middleware")
const pool = require("../src/db")
const createRandomItem = require("./generateMockData/model.item");

// mock middle ware to circumvent authentication
const originalMiddleware = api._router.stack.find(layer => layer.handle === JWTmiddleware).handle;
const middlewareMock = jest.fn((req, res, next) => {
    next();
});
api._router.stack.forEach(layer => {
    if (layer.handle === originalMiddleware) {
        layer.handle = middlewareMock;
    }
});

let items = [createRandomItem(0), createRandomItem(0)]

describe('GET /v1/tasks', function () {
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

describe('GET /v1/list', function () {
    it('request all lists', async () => {
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