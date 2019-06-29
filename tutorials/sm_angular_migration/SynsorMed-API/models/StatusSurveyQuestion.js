'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('StatusSurveyQuestion', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        org_id: {
            type: DataTypes.INTEGER
        },
        status_survey_id : {
            type: DataTypes.INTEGER
        },
        text: {
            type: DataTypes.STRING
        },
        choices: {
            type: DataTypes.TEXT
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'status_survey_question',
        instanceMethods: {
            getOptions : function(){
                var options = [];
                var tempOptions = this.choices ? JSON.parse(this.choices) : null;
                if(tempOptions){
                    if(tempOptions.bounds && tempOptions.bounds.min && tempOptions.bounds.max){
                        for(var l = tempOptions.bounds.min; l <= tempOptions.bounds.max; l++){
                            options.push(parseInt(l));
                        }
                    }
                    else if(tempOptions.options){
                        options = tempOptions.options;
                    }
                    else if(tempOptions.boolean){
                      tempOptions.boolean.forEach(function(data){
                        options.push(parseInt(data.value));
                      })
                    }
                }
                return options;
            }
        }
    });
};
