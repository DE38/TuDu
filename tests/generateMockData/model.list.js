import createRandomItem from "./model.item";

const {faker} = require('@faker-js/faker');

export class List {
    _id;
    name;
    items;
}

function createRandomList() {
    const _id = parseInt(faker.random.numeric(6))
    const items = [];
    let num_of_items = parseInt(faker.random.numeric(2));
    while (num_of_items > 0) {
        items.push(createRandomItem(_id))
        num_of_items--;
    }

    return {
        _id,
        name: faker.word.noun(),
        items
    };
}

module.exports = createRandomList