const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "registeredmembers",
        {
            pk: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            companyname: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            walletaddress: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            membertype: {
                type: DataTypes.STRING(255),
                allowNull: true,
            }, projectid: {
                type: DataTypes.STRING(255),
                allowNull: true,
            }, taxid: {
                type: DataTypes.STRING(255),
                allowNull: true,
            }, email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "registeredmembers",
            timestamps: false,
            indexes: [
                {
                    name: "PK_registeredmembers",
                    unique: true,
                    fields: [{name: "PK"}],
                },
            ],
        }
    );
};
