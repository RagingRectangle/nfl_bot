const fs = require('fs');
const mysql = require('mysql2');
const config = require('./config/config.json');

createDatabase();
async function createDatabase() {
   var dbConfig = config.database;
   dbConfig.multipleStatements = true;
   let connection = mysql.createConnection(config.database);
   let betsTableQuery = `CREATE TABLE if not exists bets (bet_id INT(11) NOT NULL AUTO_INCREMENT, user_id VARCHAR(45) NOT NULL, guild_id VARCHAR(45) NOT NULL, game_id VARCHAR(45) NOT NULL, type VARCHAR(45) NOT NULL, value VARCHAR(45) NOT NULL, multiplier DECIMAL(10,4) NOT NULL, wager DECIMAL(10,2) NOT NULL, profit DECIMAL(10,2) NOT NULL, result VARCHAR(10) DEFAULT "pending", PRIMARY KEY (bet_id));`;
   let gamesTableQuery = `CREATE TABLE if not exists games (id VARCHAR(20) NOT NULL, winner VARCHAR(10) NOT NULL, season VARCHAR(4) NOT NULL, week VARCHAR(45) NOT NULL, gametime VARCHAR(45) NOT NULL, location VARCHAR(100) NOT NULL, broadcast VARCHAR(20) NOT NULL, name VARCHAR(100) NOT NULL, away_team VARCHAR(10) NOT NULL, away_score INT(11) NOT NULL, away_record VARCHAR(10) NOT NULL, home_team VARCHAR(10) NOT NULL, home_score INT(11) NOT NULL, home_record VARCHAR(10) NOT NULL, odds VARCHAR(20) NOT NULL, over_under INT(11) NOT NULL, over_under_odds INT(11) NOT NULL, away_favorite VARCHAR(5) NOT NULL, away_underdog VARCHAR(5) NOT NULL, away_money_line INT(11) NOT NULL, away_spread_odds INT(11) NOT NULL, home_favorite VARCHAR(5) NOT NULL, home_underdog VARCHAR(5) NOT NULL, home_money_line INT(11) NOT NULL, home_spread_odds INT(11) NOT NULL, PRIMARY KEY (id));`;
   let picksTableQuery = `CREATE TABLE if not exists picks (user_id VARCHAR(20) NOT NULL, guild_id VARCHAR(20) NOT NULL, game_id VARCHAR(20) NOT NULL, pick VARCHAR(5) NOT NULL, PRIMARY KEY (user_id, guild_id, game_id));`;
   let usersTableQuery = `CREATE TABLE if not exists users (user_id VARCHAR(20) NOT NULL, guild_id VARCHAR(20) NOT NULL, cash DECIMAL(10,2) NOT NULL, wagers DECIMAL(10,2) NOT NULL, PRIMARY KEY (user_id, guild_id));`;
   try {
      connection.query(`${betsTableQuery} ${gamesTableQuery} ${picksTableQuery} ${usersTableQuery}`, (error, results) => {
         if (error) {
            console.log("Database creation error:", error);
            connection.end();
         } else {
            connection.end();
            console.log("Database tables created.");
         }
      }); //End of connection
   } catch (err) {
      console.log("Database creation error:", err);
   }
} //End of createDatabase()