const request = require("supertest");
const sinon = require('sinon');
const authApi = require("../src/auth");
const pool = require("../src/db");
const createRandomUser = require("./generateMockData/user.model");
const bcrypt = require("bcrypt");
const JWTmiddleware = require("../src/jwt_auth_middleware");

const userEmail = "test@gmail.com";

 describe('POST /v1/register', function () {
     let user;
    
     beforeEach(() => {
         user = createRandomUser();
     });

     afterEach(() => {
         sinon.restore();
     });

     it('register new user', async () => {
         let fakePostRegisterUser = sinon.fake((param1) => {
             if (param1 === 'INSERT INTO users (email, pw_hash) VALUES ($1, $2)') {
                 return (
                     { text: `You have been registered!` }
                 );
             } else if (param1 === 'SELECT user_id from users WHERE email = $1') {
                 return ({rows: [{user_id: 42}]});
             } else if (param1 === 'INSERT INTO list (user_id, list_name, description) VALUES ($1, $2, $3)') {
                 return ({rows: [{user_id: 42}]});
             } else {
                 console.log(param1)
             }
         });

         sinon.replace(pool, 'query', fakePostRegisterUser);

         const response = await request(authApi)
            .post('/v1/register')
         .send({email: user.email, passwd: user.pw_hash});
         expect(response.status).toBe(201);
         expect(fakePostRegisterUser.called).toBe(true);
     });

     // login test not working; probably not possible
     it('login user', async () => {
         let fakePostRegisterUser = sinon.fake((param1) => {
             console.log(user, param1);
             if (param1 === 'SELECT pw_hash FROM users WHERE email = $1') {
                 return ({ rows: [{ user_id: 42, pw_hash: 'secret :3' }] });
             } else if (param1 === 'UPDATE users SET private_key = $1 WHERE email = $2') {
                 return ({ rows: [{ user_id: 42 }] });
             } else {
                 console.log(param1)
             }
         });

         let fakeCompare = sinon.fake((passwd, hash) => {
             return true;
         });

         sinon.replace(pool, 'query', fakePostRegisterUser);
         sinon.replace(bcrypt, 'compare', fakeCompare);

         const response = await request(authApi)
             .post('/v1/login')
             .send({ email: user.email, passwd: user.pw_hash });
         expect(response.status).toBe(200);
         expect(fakePostRegisterUser.called).toBe(true);
     });

     // ISSUES WITH MIDDLEWARE
     /*it('logout user', async () => {
         // mock middleware to circumvent authentication
         const originalMiddleware = authApi._router.stack.find(layer => layer.handle === JWTmiddleware).handle;

         const middlewareMock = jest.fn((req, res, next) => {
             next();
         });

         authApi._router.stack.forEach(layer => {
             if (layer.handle === originalMiddleware) {
                 layer.handle = middlewareMock;
             }
         });
         let fakeGetLogout = sinon.fake((param1) => {
             if (param1 === 'UPDATE users SET private_key = null WHERE email = $1') {
                 return ({rows: [{user_id: 42, pw_hash: 'secret :3'}]});
             } else if (param1 === 'UPDATE users SET private_key = $1 WHERE email = $2') {
                 return ({rows: [{user_id: 42}]});
             } else {
                 console.log(param1)
             }
         });

         sinon.replace(pool, 'query', fakeGetLogout);

         const response = await request(authApi)
            .get('/v1/logout')
            .send({email: user.email, passwd: user.pw_hash});
         expect(response.status).toBe(200);
         expect(fakeGetLogout.called).toBe(true);
     });*/
 });
