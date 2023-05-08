import { faker } from '@faker-js/faker';

export class Item {
    _id: number;
    group: number;
    name: string;
    isEditable: boolean;
    dueDate: Date;
    isCompleted: boolean;
    contents?: string | null;
    creationDate: Date;
}

export function createRandomItem(groupId: number): Item {
    return {
        _id: parseInt(faker.random.numeric(6)),
        group: groupId,
        name: faker.word.noun(),
        isEditable: true,
        dueDate: faker.date.soon(),
        isCompleted: false,
        contents: "Jockel",
        creationDate: new Date()
    };
}
