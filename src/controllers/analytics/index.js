const analyticsController = require('./analytics.controller');
const dashboardController = require('./dashboard.controller');

// Prioritize dashboardController exports over analyticsController exports
module.exports = {
  ...analyticsController,
  ...dashboardController
}; 