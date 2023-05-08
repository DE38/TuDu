import { faker } from '@faker-js/faker';

class User {
    _id: number;
    email: string;
    pw_hash: string;
}

function createRandomUser(): User {
    return {
        _id: parseInt(faker.random.numeric(6)),
        email: faker.internet.email(),
        pw_hash: faker.random.alphaNumeric(20)
    };
}