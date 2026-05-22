const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const dbPath = path.join(__dirname, '.db-uri');
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch (e) {
    // ignore
  }
};
