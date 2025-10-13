class Company {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

module.exports = { Company }; 