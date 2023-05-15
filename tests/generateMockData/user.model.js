const {faker} = require('@faker-js/faker');

class User {
    _id;
    email;
    pw_hash;
}

function createRandomUser() {
    return {
        _id: parseInt(faker.random.numeric(6)),
        email: faker.internet.email(),
        pw_hash: faker.random.alphaNumeric(20)
    };
}

module.exports = createRandomUser