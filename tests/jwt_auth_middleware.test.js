const request = require("supertest");
const sinon = require('sinon');
const JWTmiddleware = require("../src/jwt_auth_middleware");
const express = require ('express');
const pool = require("../src/db");
const bodyParser = require("body-parser");

describe('Test Middleware', function (){
    let app;
    const db_private_key = "-----BEGIN PRIVATE KEY-----\n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\n5XL/PnITmnPqQLds4D7DbLgcoJCw6Q==\n-----END PRIVATE KEY-----\n"
    
    beforeEach(() => {
        app = express();
        app.use(bodyParser.json())
        app.use(JWTmiddleware)
        app.post('/', (req, res) => {
            res.sendStatus(200);
        });
    })

    afterEach(() => {
        sinon.restore();
    });
    
    let fakeMethod = sinon.fake((param1, param2) => {
        if (param1 === 'SELECT private_key FROM users WHERE email = $1' && JSON.stringify(param2) === JSON.stringify(['test@gmail.com'])) {
            return (
                {"rows": [{"private_key": db_private_key}]}
                );
        } 
    })
    sinon.replace(pool, 'query', fakeMethod)
    
    it('with valid JWT in body', async() => {
        const response = await request(app)
            .post("/")
            .send({ email: "test@gmail.com", token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoIjp7ImVtYWlsIjp7ImVtYWlsIjoidGVzdEBnbWFpbC5jb20ifX0sImlhdCI6MTY4NjE1NjIzMn0.p1BStP0AeT10zzuQX-Zz_kBQjfb4QK8AZMl6dvHgGqo" })
            
        expect(response.status).toBe(200);
        expect(fakeMethod.called).toBe(true);
    })
    
    it('with valid JWT in header', async() => {
        const response = await request(app)
            .post("/")
            .set({token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoIjp7ImVtYWlsIjp7ImVtYWlsIjoidGVzdEBnbWFpbC5jb20ifX0sImlhdCI6MTY4NjE1NjIzMn0.p1BStP0AeT10zzuQX-Zz_kBQjfb4QK8AZ"})
            .send({ email: "test@gmail.com" })
            
        expect(response.status).toBe(401);
        expect(fakeMethod.called).toBe(true);
    })
    
    it('without valid JWT', async () => {
        const response = await request(app)
            .post("/")
            .send({ email: "test@gmail.com" })
            
        expect(response.status).toBe(401);
        expect(fakeMethod.called).toBe(true);
    })
})