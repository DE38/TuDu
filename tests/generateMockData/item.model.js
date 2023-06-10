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

const reoccuringRuleSet = ["Daily", "Weekly", "Bi-Weekly", "Monthly", "Yearly"];

function createRandomItem() {
    return {
        user_id: parseInt(faker.random.numeric(6)),
        list_id: parseInt(faker.random.numeric(6)),
        task_id: parseInt(faker.random.numeric(6)),
        title: faker.word.noun(),
        reoccuring_rule: reoccuringRuleSet[Math.floor(Math.random() * reoccuringRuleSet.length)],
        isEditable: true,
        isCompleted: false,
        dueDate: faker.date.soon().toDateString(),
        creationDate: new Date().toDateString(),
        contents: "Jockel"
    };
}

module.exports = createRandomItem
