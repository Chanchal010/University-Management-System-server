const authController = require('./auth');
const userController = require('./user');
const academicController = require('./academic');
const adminController = require('./admin');
const analyticsController = require('./analytics');
const forumController = require('./forum');

module.exports = {
  auth: authController,
  user: userController,
  academic: academicController,
  admin: adminController,
  analytics: analyticsController,
  forum: forumController
}; 