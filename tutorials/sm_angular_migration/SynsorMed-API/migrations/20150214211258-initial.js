'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {

    migration.createTable('user', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: DataTypes.STRING
      },
      middle_name: {
        type: DataTypes.STRING
      },
      last_name: {
        type: DataTypes.STRING
      },
      gender: {
        type: DataTypes.ENUM('male', 'female')
      },
      registration_date: {
        type: DataTypes.DATE
      },
      phone_mobile: {
        type: DataTypes.STRING
      },
      phone_work: {
        type: DataTypes.STRING
      },
      title: {
        type: DataTypes.STRING
      },
      password: {
        type: DataTypes.STRING(1000)
      },
      email: {
        type: DataTypes.STRING
      },
      role_id: {
        type: DataTypes.INTEGER
      },
      org_id: {
        type: DataTypes.INTEGER
      },
      specialty: {
        type: DataTypes.INTEGER
      },
      created_at: {
        type: DataTypes.DATE
      },
      updated_at: {
        type: DataTypes.DATE
      }
    })
    .then(function(){
        return migration.createTable('organization', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          name: {
            type: DataTypes.STRING
          },
          specialty: {
            type: DataTypes.INTEGER
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.createTable('organization_preference', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          org_id: {
            type: DataTypes.INTEGER
          },
          key: {
            type: DataTypes.STRING
          },
          value: {
            type: DataTypes.STRING
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.createTable('facility', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          address1: {
            type: DataTypes.STRING
          },
          address2: {
            type: DataTypes.STRING
          },
          city: {
            type: DataTypes.STRING
          },
          state: {
            type: DataTypes.STRING
          },
          postal: {
            type: DataTypes.STRING
          },
          phone: {
            type: DataTypes.STRING
          },
          org_id: {
            type: DataTypes.INTEGER
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.createTable('role', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          name: {
            type: DataTypes.STRING
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.createTable('rtc_user', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          domain: {
            type: DataTypes.STRING
          },
          in_use: {
            type: DataTypes.BOOLEAN
          },
          last_activity: {
            type: DataTypes.DATE
          },
          name: {
            type: DataTypes.STRING
          },
          profile: {
            type: DataTypes.STRING
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.createTable('encounter', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          patient_code: {
            type: DataTypes.STRING
          },
          last_activity: {
            type: DataTypes.DATE
          },
          scheduled_start: {
            type: DataTypes.DATE
          },
          call_ready: {
            type: DataTypes.DATE
          },
          call_started: {
            type: DataTypes.DATE
          },
          reason_for_visit: {
            type: DataTypes.STRING(1000)
          },
          fee: {
            type: DataTypes.DECIMAL(6, 2)
          },
          fee_paid: {
            type: DataTypes.BOOLEAN
          },
          terms_accepted: {
            type: DataTypes.BOOLEAN
          },
          note: {
            type: DataTypes.STRING(1000)
          },
          provider_id: {
            type: DataTypes.INTEGER
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.createTable('survey_question', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          org_id: {
            type: DataTypes.INTEGER
          },
          text: {
            type: DataTypes.STRING(1000)
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.createTable('encounter_survey_answer', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          encounter_id: {
            type: DataTypes.INTEGER
          },
          choice: {
            type: DataTypes.BOOLEAN
          },
          created_at: {
            type: DataTypes.DATE
          },
          updated_at: {
            type: DataTypes.DATE
          }
        });
    })
    .then(function(){
        return migration.addIndex('encounter', ['patient_code']); //Quicken patient code lookups
    })
    .then(function(){
        return migration.addIndex('encounter', ['provider_id']); //Quicken lookups of patients for a provider
    })
    .then(function(){
        return migration.addIndex('user', ['org_id']); //Quicken lookups of providers for an org
    })
    .then(function(){
        return migration.addIndex('rtc_user', ['in_use']); //Quicken non-in-use RTC code searches
    })
    .then(function(){
        return migration.addIndex('user', ['email']); //Quicken provider login lookups
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
      done(); // add reverting commands here, calling 'done' when finished
  }
};
