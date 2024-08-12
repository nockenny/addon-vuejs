function Mapping(name, colDes, colData) {
    this.name = name;
    this.colDes = colDes - 1;
    this.colData = colData - 1;
}

function Feature (ticket, title, featureName, category) {
    this.ticket = ticket;
    this.title = title;
    this.featureName = featureName;
    this.category = category;
}