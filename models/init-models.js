var DataTypes = require("sequelize").DataTypes;
var _RegisteredMembers = require("./registeredmember");
var _CreditRequests = require("./creditrequests");
var _RetirementRecords = require("./retirementrecords");
var _Listings = require("./listings");

function initModels(sequelize) {
  var RegisteredMembers = _RegisteredMembers(sequelize, DataTypes);
  var CreditRequests = _CreditRequests(sequelize, DataTypes);
  var RetirementRecords = _RetirementRecords(sequelize, DataTypes);
  var Listings = _Listings(sequelize, DataTypes);
  RegisteredMembers.hasMany(CreditRequests);
  CreditRequests.belongsTo(RegisteredMembers, {
    foreignKey: "memberid",
    targetKey: "pk",
  });
  RegisteredMembers.hasMany(RetirementRecords);
  RetirementRecords.belongsTo(RegisteredMembers, {
    foreignKey: "memberid",
    targetKey: "pk",
  });
  RegisteredMembers.hasMany(Listings);
  Listings.belongsTo(RegisteredMembers, {
    foreignKey: "memberid",
    targetKey: "pk",
  });

  return {
    RegisteredMembers,
    CreditRequests,
    RetirementRecords,
    Listings,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
