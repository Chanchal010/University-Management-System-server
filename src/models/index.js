const authModels = require('./auth');
const academicModels = require('./academic');
const adminModels = require('./admin');
const organizationModels = require('./organization');
const forumModels = require('./forum');

module.exports = {
  ...authModels,
  ...academicModels,
  ...adminModels,
  ...organizationModels,
  ...forumModels
}; 