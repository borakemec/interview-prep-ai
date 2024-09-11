const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'questions.db');

fs.unlink(dbPath, (err) => {
    if (err && err.code === 'ENOENT') {
        console.log("Database file doesn't exist, no need to delete.");
    } else if (err) {
        console.error("Error deleting database file:", err.message);
    } else {
        console.log("Existing database deleted.");
    }
});
