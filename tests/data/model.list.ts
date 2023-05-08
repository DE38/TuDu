import { faker } from '@faker-js/faker';
import { Item, createRandomItem } from './model.item';

export class List {
    _id: number;
    name: string;
    items: [Item];
}

function createRandomList(): List {
    const _id = parseInt(faker.random.numeric(6))
    const items = [];
    let num_of_items = parseInt(faker.random.numeric(2));
    while (num_of_items > 0) {
        items.push(createRandomItem(_id))
        num_of_items --;
    }

    return {
        _id,
        name: faker.word.noun(),
        items
    };
}
