// const sqlite3 = require('sqlite3');
import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

var db = new sqlite3.Database(process.env.DB_PATH);

db.serialize(function () {
    db.run("ALTER TABLE servers ADD COLUMN roleID TEXT DEFAULT ''");
});
