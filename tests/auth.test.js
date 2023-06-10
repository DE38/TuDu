const request = require("supertest");
const sinon = require('sinon');
const authApi = require("../src/auth");
const pool = require("../src/db");
const createRandomUser = require("./generateMockData/user.model");

const userEmail = "test@gmail.com";

// describe('POST /v1/register', function () {
//     let user;
    
//     beforeEach(() => {
//         user = createRandomUser;
//     });

//     afterEach(() => {
//         sinon.restore();
//     });

//     it('register new user', async () => {
//         let fakePostRegisterUser = sinon.fake((param1) => {
//             if (param1 === 'INSERT INTO users (email, pw_hash) VALUES ($1, $2)') {
//                 return (
//                     { text: `You have been registered!` }
//                 );
//             } else {
//                 console.log(param1)
//             }
//         });

//         sinon.replace(pool, 'query', fakePostRegisterUser);

//         const response = await request(authApi).post('/v1/register').send({email: user.email, passwd: user.pw_hash});
//         expect(response.status).toBe(201);
//         expect(fakePostRegisterUser.called).toBe(true);
//     });
// });
