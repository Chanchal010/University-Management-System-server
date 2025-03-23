const app = require('./app');
const connectDB = require('./src/db/connectDb');
const colors = require('colors');
require('dotenv').config();

// Constants
const PORT = process.env.PORT || 5000;


// Start server
const startTime = new Date();
connectDB().then(() => {
  app.listen(PORT, () => {
    const bootTime = (new Date() - startTime) / 1000;
    console.log(`⚡️ Server started in ${bootTime}s`.green.bold);
    console.log(`🚀 Server running on port ${PORT}`.yellow.bold);
    console.log(`🔗 API available at http://localhost:${PORT}/api`.cyan);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`.magenta);
  });
}).catch((err) => {
  console.log(`Error connecting to MongoDB: ${err.message}`.red.bold);
});
