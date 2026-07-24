const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "retirementrecords",
        {
            pk: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            memberid: {
                type: DataTypes.INTEGER,
                foreignKey: true,
                allowNull: false,
            },
            amount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            date: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            txid: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "retirementrecords",
            timestamps: false,
            indexes: [
                {
                    name: "PK_retirementrecords",
                    unique: true,
                    fields: [{name: "PK"}],
                },
            ],
        }
    );
};
