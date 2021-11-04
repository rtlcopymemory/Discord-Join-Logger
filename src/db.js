const sqlite3 = require('sqlite3');

var db = new sqlite3.Database(process.env.DB_PATH);

db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS servers (serverID TEXT PRIMARY KEY, webhook TEXT NOT NULL, roleID TEXT)");
});

module.exports = {
    db
}