const {faker} = require('@faker-js/faker');

class User {
    user_id;
    email;
    pw_hash;
}

function createRandomUser() {
    return {
        user_id: parseInt(faker.random.numeric(6)),
        email: faker.internet.email(),
        pw_hash: faker.random.alphaNumeric(20)
    };
}

module.exports = createRandomUser