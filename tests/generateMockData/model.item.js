const {faker} = require('@faker-js/faker');

class Item {
    _id;
    group;
    name;
    isEditable;
    dueDate;
    isCompleted;
    contents;
    creationDate;
}

function createRandomItem(groupId) {
    return {
        _id: parseInt(faker.random.numeric(6)),
        group: groupId,
        name: faker.word.noun(),
        isEditable: true,
        dueDate: faker.date.soon().toDateString(),
        isCompleted: false,
        contents: "Jockel",
        creationDate: new Date().toDateString()
    };
}

module.exports = createRandomItem
