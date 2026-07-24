const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "listings",
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
                // CCT remaining and available to buy - decremented as it fills
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            pricealgo: {
                // ALGO per 1 CCT, set by the seller at listing time
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            status: {
                // active | filled | cancelled
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            date: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            escrowtxid: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "listings",
            timestamps: false,
            indexes: [
                {
                    name: "PK_listings",
                    unique: true,
                    fields: [{name: "PK"}],
                },
            ],
        }
    );
};
