const {faker} = require('@faker-js/faker');

class List {
    user_id; 
    list_id; 
    list_name;
    description;
}

function createRandomList() {
    const user_id = parseInt(faker.random.numeric(6));
    const list_id = parseInt(faker.random.numeric(6));
    const list_name = faker.word.noun();
    const description = "Jockel";

    return {
        user_id,
        list_id,
        list_name,
        description
    };
}

module.exports = createRandomList