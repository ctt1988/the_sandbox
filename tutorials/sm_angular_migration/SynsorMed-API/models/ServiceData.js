module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ServiceData', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        service_name: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        monitor_id: {
            type: DataTypes.INTEGER
        },
        service_data: {
            type: DataTypes.TEXT
        },
        deleted_at: {
            type: DataTypes.DATE
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    },
    {
        deletedAt: 'deleted_at',
        paranoid: true,
        tableName : 'service_data'
    });
};
