const health = require("./health");
const auth = require("./auth");
const forms = require("./forms");
const mentors = require("./mentors");
const journal = require("./journal");
const dashboard = require("./dashboard");
const admin = require("./admin");

module.exports = Object.assign(
  {},
  health,
  auth,
  forms,
  mentors,
  journal,
  dashboard,
  admin
);
