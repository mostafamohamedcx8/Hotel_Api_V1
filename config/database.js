const mongoose = require("mongoose");

// It defines a function dbConnection which establishes a connection to the MongoDB
const dbConnection = () => {
  mongoose.connect(process.env.DB_URI).then((conn) => {
    console.log(`Database Connected:${conn.connection.host}`);
  });
  // .catch((err) => {
  //   console.log(`Database Error: ${err}`);
  //   process.exit(1);
  // });
};
// it exports the dbConnection function so that it can be imported and used in other parts of the application.
module.exports = dbConnection;
