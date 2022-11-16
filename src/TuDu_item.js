class TuDu {
    constructor(title, list, due_date, due_time, description) {
        this.title = title,
        this.list = list,
        this.due_date = due_date,
        this.due_time = due_time,
        this.description = description
    };

    debug() {
        console.log(JSON.stringify(this, null, 4));
    }
}

// TESTING: create new TuDu object and execute some functions

const tudu = new TuDu("1", 2, 3, 4, 5);

tudu.debug();