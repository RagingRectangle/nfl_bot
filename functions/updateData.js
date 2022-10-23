const {
   Client,
   GatewayIntentBits,
   Partials,
   Collection,
   Permissions,
   ActionRowBuilder,
   SelectMenuBuilder,
   MessageButton,
   EmbedBuilder,
   ButtonBuilder,
   ButtonStyle,
   InteractionType,
   ChannelType
} = require('discord.js');
const fs = require('fs');
const request = require('request');
const moment = require('moment');
const mysql = require('mysql2');
const config = require('../config/config.json');
const Teams = require('../data/teams.json');

module.exports = {
   update: async function update(client) {
      request('https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl', (error, response, html) => {
         if (!error && response.statusCode == 200) {
            let data = JSON.parse(html);
            let events = data['sports'][0]['leagues'][0]['events'];
            module.exports.trimData(client, events);
            module.exports.awardWinners(client);
         } else {
            console.log(`Error fetching new data: ${error}`);
         }
      });
   }, //End of update()

   trimData: async function trimData(client, events) {
      var allEvents = [];
      var eventIDs = [];
      for (var e in events) {
         let event = events[e];
         eventIDs.push(`"${event['id']}"`);
         let teams = events[e]['shortName'].split(' @ ');
         var eventData = {
            "id": event['id'],
            "winner": "",
            "season": event['season'],
            "week": event['weekText'],
            "name": event['name'],
            "shortName": event['shortName'],
            "away": teams[0],
            "home": teams[1],
            "date": event['date'],
            "location": event['location'],
            "broadcast": event['broadcast'],
            "status": event['fullStatus']['type']['state'],
            "odds": {
               "detail": event['odds']['details'].replace('EVEN', 'Even'),
               "overUnder": event['odds']['overUnder'],
               "overUnderOdds": event['odds']['overOdds'],
               "spread": event['odds']['spread'],
               "away": event['odds']['awayTeamOdds'],
               "home": event['odds']['homeTeamOdds'],
            }
         }
         let awayTeam = event['competitors'][0]['homeAway'] === 'home' ? event['competitors'][1] : event['competitors'][0];
         eventData.awayScore = parseInt(awayTeam.score);
         eventData.awayTeamRecord = awayTeam.record;
         let homeTeam = event['competitors'][0]['homeAway'] === 'home' ? event['competitors'][0] : event['competitors'][1];
         eventData.homeScore = parseInt(homeTeam.score);
         eventData.homeTeamRecord = homeTeam.record;
         let emojiAway = await client.emojis.cache.find(emoji => emoji.name === `NFL_${eventData.away}`);
         eventData.emojiAway = emojiAway ? `<:${emojiAway['name']}:${emojiAway['id']}>` : '';
         let emojiHome = await client.emojis.cache.find(emoji => emoji.name === `NFL_${eventData.home}`);
         eventData.emojiHome = emojiHome ? `<:${emojiHome['name']}:${emojiHome['id']}>` : '';

         //Add winner
         if (eventData.status == 'post') {
            eventData.winner = parseInt(awayTeam.score) == parseInt(homeTeam.score) ? 'tie' : parseInt(awayTeam.score) > parseInt(homeTeam.score) ? eventData.away : eventData.home;
         }
         allEvents.push(eventData);
      } //End of e loop
      module.exports.databaseCheck(eventIDs, allEvents);
      fs.writeFileSync('./data/current_week.json', JSON.stringify(allEvents));
   }, //End of trimData()

   databaseCheck: async function databaseCheck(eventIDs, events) {
      runCheckQuery = (query) => {
         var dbConfig = config.database;
         dbConfig.multipleStatements = true;
         let connection = mysql.createConnection(config.database);
         return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
               if (error) {
                  connection.end();
                  return reject(error);
               }
               connection.end();
               return resolve(results);
            });
         });
      };
      let checkResults = await runCheckQuery(`SELECT id, winner FROM games WHERE id IN (${eventIDs.join(',')});`);
      let addedGames = [];
      let unknownWinners = [];
      for (var a in checkResults) {
         addedGames.push(checkResults[a]['id']);
         if (!checkResults[a]['winner']) {
            unknownWinners.push(checkResults[a]['id']);
         }
      }
      //And new games
      if (events.length != addedGames.length) {
         module.exports.addNewGames(events, addedGames);
      }
      //Add new winners
      if (unknownWinners.length > 0) {
         module.exports.addNewWinners(events, unknownWinners);
      }
   }, //End of databaseCheck()

   addNewGames: async function addNewGames(events, addedGames) {
      runAddGamesQuery = (query) => {
         try {
            var dbConfig = config.database;
            dbConfig.multipleStatements = true;
            let connection = mysql.createConnection(config.database);
            return new Promise((resolve, reject) => {
               connection.query(query, (error, results) => {
                  if (error) {
                     connection.end();
                     return reject(error);
                  }
                  connection.end();
                  return resolve(results);
               });
            });
         } catch (err) {
            console.log(`Error adding new game data: ${err}`);
         }
      };
      var queryArray = [];
      for (var e in events) {
         if (addedGames.includes(events[e]['id'])) {
            continue;
         }
         queryArray.push(`INSERT INTO games (id, winner, season, week, gametime, location, broadcast, name, away_team, away_score, away_record, home_team, home_score, home_record, odds, over_under, over_under_odds, away_favorite, away_underdog, away_money_line, away_spread_odds, home_favorite, home_underdog, home_money_line, home_spread_odds) VALUES ("${events[e]['id']}", "${events[e]['winner']}", "${events[e]['season']}", "${events[e]['week']}", "${events[e]['date']}", "${events[e]['location']}", "${events[e]['broadcast']}","${events[e]['name']}", "${events[e]['away']}", "${events[e]['awayScore']}", "${events[e]['awayTeamRecord']}", "${events[e]['home']}", "${events[e]['homeScore']}", "${events[e]['homeTeamRecord']}", "${events[e]['odds']['detail']}", "${events[e]['odds']['overUnder']}", "${events[e]['odds']['overUnderOdds']}", "${events[e]['odds']['away']['favorite']}", "${events[e]['odds']['away']['underdog']}", "${events[e]['odds']['away']['moneyLine']}", "${events[e]['odds']['away']['spreadOdds']}", "${events[e]['odds']['home']['favorite']}", "${events[e]['odds']['home']['underdog']}", "${events[e]['odds']['home']['moneyLine']}", "${events[e]['odds']['home']['spreadOdds']}")`);
         console.log(`Game ${events[e]['id']} added: ${events[e]['name']}`);
      } //End of e loop
      if (queryArray.length > 0) {
         runAddGamesQuery(queryArray.join('; '));
      }
   }, //End of addNewGames()

   addNewWinners: async function addNewWinners(events, unknownWinners) {
      runAddWinnersQuery = (query) => {
         try {
            var dbConfig = config.database;
            dbConfig.multipleStatements = true;
            let connection = mysql.createConnection(config.database);
            return new Promise((resolve, reject) => {
               connection.query(query, (error, results) => {
                  if (error) {
                     connection.end();
                     return reject(error);
                  }
                  connection.end();
                  return resolve(results);
               });
            });
         } catch (err) {
            console.log(`Error adding new winner data: ${err}`);
         }
      };
      var queryArray = [];
      var newWinners = [];
      for (var e in events) {
         if (unknownWinners.includes(events[e]['id']) && events[e]['status'] == 'post') {
            newWinners.push(`"${events[e]['id']}"`);
            queryArray.push(`UPDATE games SET winner = "${events[e]['winner']}", away_score = "${events[e]['awayScore']}", away_record = "${events[e]['awayTeamRecord']}", home_score = "${events[e]['homeScore']}", home_record = "${events[e]['homeTeamRecord']}", odds = "${events[e]['odds']['detail']}", over_under = "${events[e]['odds']['overUnder']}", over_under_odds = "${events[e]['odds']['overUnderOdds']}", away_money_line = "${events[e]['odds']['away']['moneyLine']}", away_spread_odds = "${events[e]['odds']['away']['spreadOdds']}", home_money_line = "${events[e]['odds']['home']['moneyLine']}", home_spread_odds = "${events[e]['odds']['home']['spreadOdds']}" WHERE id = "${events[e]['id']}"`);
            console.log(`Winner added: ${events[e]['winner']}`);
         }
      } //End of e loop
      if (newWinners.length > 0) {
         let addWinners = await runAddWinnersQuery(queryArray.join('; '));
      }
   }, //End of addNewWinners()


   awardWinners: async function awardWinners(client) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      await new Promise(done => setTimeout(done, 10000));
      runAwardWinnersQuery = (query) => {
         try {
            var dbConfig = config.database;
            dbConfig.multipleStatements = true;
            let connection = mysql.createConnection(config.database);
            return new Promise((resolve, reject) => {
               connection.query(query, (error, results) => {
                  if (error) {
                     connection.end();
                     return reject(error);
                  }
                  connection.end();
                  return resolve(results);
               });
            });
         } catch (err) {
            console.log(`Error adding new winner data: ${err}`);
         }
      };
      let pendingResults = await runAwardWinnersQuery(`SELECT * FROM bets WHERE result = "pending";`);
      for (var p in pendingResults) {
         var queryList = [];
         for (var e in events) {
            if (pendingResults[p]['game_id'] == events[e]['id'] && events[e]['winner'] != '') {
               let payout = (pendingResults[p]['wager'] * 1) + (pendingResults[p]['profit'] * 1);
               let gameTotal = events[e]['awayScore'] + events[e]['homeScore'];
               let betResult = '';
               //Moneyline
               if (pendingResults[p]['type'] == 'moneyline') {
                  //Push
                  if (events[e]['winner'] == 'tie') {
                     betResult = 'push';
                     queryList.push(`UPDATE bets SET result = "push" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET cash = cash + ${pendingResults[p]['wager'] * 1}, wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
                  //Winner
                  else if (pendingResults[p]['value'] == events[e]['winner']) {
                     betResult = 'win';
                     queryList.push(`UPDATE bets SET result = "win" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET cash = cash + ${payout}, wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
                  //Loser
                  else {
                     betResult = 'lose';
                     queryList.push(`UPDATE bets SET result = "lose" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
               }
               //Over/Under
               else if (pendingResults[p]['type'] == 'over' || pendingResults[p]['type'] == 'under') {
                  //Push
                  if (gameTotal == pendingResults[p]['value']) {
                     betResult = 'push';
                     queryList.push(`UPDATE bets SET result = "push" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET cash = cash + ${pendingResults[p]['wager'] * 1}, wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
                  //Over winner
                  else if (pendingResults[p]['type'] == 'over' && gameTotal > pendingResults[p]['value']) {
                     betResult = 'win';
                     queryList.push(`UPDATE bets SET result = "win" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET cash = cash + ${payout}, wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
                  //Under winner
                  else if (pendingResults[p]['type'] == 'under' && gameTotal < pendingResults[p]['value']) {
                     betResult = 'win';
                     queryList.push(`UPDATE bets SET result = "win" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET cash = cash + ${payout}, wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
                  //Loser
                  else {
                     betResult = 'lose';
                     queryList.push(`UPDATE bets SET result = "lose" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
               }
               //Spread
               else if (pendingResults[p]['type'] == 'spread') {
                  let optionSplit = pendingResults[p]['value'].split('_')
                  let userPick = optionSplit[0];
                  let spreadSplit = optionSplit[1].split(' ');
                  let spreadFavorite = spreadSplit[0];
                  let spreadValue = spreadSplit[1] * 1;
                  var results = {};
                  if (spreadFavorite == events[e]['away']) {
                     //Push
                     if (events[e]['homeScore'] - events[e]['awayScore'] == spreadValue) {
                        results[events[e]['away']] = 'push';
                     }
                     //Away winner
                     if (events[e]['homeScore'] - events[e]['awayScore'] < spreadValue) {
                        results[events[e]['away']] = 'win';
                     } else {
                        results[events[e]['away']] = 'lose';
                     }
                  } else if (spreadFavorite == events[e]['home']) {
                     //Push
                     if (events[e]['awayScore'] - events[e]['homeScore'] == spreadValue) {
                        results[events[e]['home']] = 'push';
                     }
                     //Home winner
                     if (events[e]['awayScore'] - events[e]['homeScore'] < spreadValue) {
                        results[events[e]['home']] = 'win';
                     } else {
                        results[events[e]['home']] = 'lose';
                     }
                  }
                  //Push
                  if (results[userPick] == 'push') {
                     betResult = 'push';
                     queryList.push(`UPDATE bets SET result = "push" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET cash = cash + ${pendingResults[p]['wager'] * 1}, wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
                  //Winner
                  else if (results[userPick] == 'win') {
                     betResult = 'win';
                     queryList.push(`UPDATE bets SET result = "win" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET cash = cash + ${payout}, wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
                  //Loser
                  else if (results[userPick] == 'lose') {
                     betResult = 'lose';
                     queryList.push(`UPDATE bets SET result = "lose" WHERE bet_id = "${pendingResults[p]['bet_id']}";`);
                     queryList.push(`UPDATE users SET wagers = wagers - ${pendingResults[p]['wager'] * 1} WHERE user_id = ${pendingResults[p]['user_id']} AND guild_id = ${pendingResults[p]['guild_id']};`);
                  }
               }
               if (queryList.length < 1) {
                  continue;
               }
               let awardResults = await runAwardWinnersQuery(queryList.join(' '));
               for (var e in events) {
                  if (events[e]['id'] != pendingResults[p]['game_id']) {
                     continue;
                  }
                  let userData = await module.exports.getUserData(pendingResults[p]['user_id'], pendingResults[p]['guild_id']);
                  if (userData.length < 1) {
                     continue;
                  }
                  if (betResult == '') {
                     continue;
                  }
                  let guild = await client.guilds.fetch(pendingResults[p]['guild_id']).catch(console.error);
                  let user = await guild.members.fetch(pendingResults[p]['user_id']).catch(console.error);
                  var betEmbed = new EmbedBuilder();
                  var description = `**- Game:** ${events[e]['name']}\n**- ${Teams[events[e]['away']]['name']}:** ${events[e]['awayScore']}\n**- ${Teams[events[e]['home']]['name']}:** ${events[e]['homeScore']}\n**- Bet Type:** ${pendingResults[p]['type']}\n**- Bet Wager:** ${pendingResults[p]['wager']}`;
                  if (betResult == 'push') {
                     betEmbed.setTitle(`Your $${pendingResults[p]['wager']} bet was a push!`).setColor('White');
                  } else if (betResult == 'win') {
                     betEmbed.setTitle(`Your $${pendingResults[p]['wager']} bet won!`).setColor('Green');
                     description = description.concat(`\n**- Profit:** $${pendingResults[p]['profit']}\n**- Payout:** $${(pendingResults[p]['wager'] * 1) + (pendingResults[p]['profit'] * 1)}`);
                     console.log(`${user.user.username} won $${pendingResults[p]['profit']}`);
                  } else if (betResult == 'lose') {
                     betEmbed.setTitle(`Your $${pendingResults[p]['wager']} bet lost!`).setColor('Red');
                     console.log(`${user.user.username} lost $${pendingResults[p]['profit']}`);
                  }
                  description = description.concat(`\n**- Available Cash:** $${userData[0]['cash']}\n**- Pending Wagers:** $${userData[0]['wagers']}`);
                  betEmbed.setDescription(description);
                  user.send({
                     embeds: [betEmbed],
                  }).catch(console.error);
               } //End of e loop
            }
         } //End of e loop
      } //End of p loop
   }, //End of awardWinners()


   getUserData: async function getUserData(userID, guildID) {
      try {
         var dbConfig = config.database;
         dbConfig.multipleStatements = true;
         let connection = mysql.createConnection(config.database);
         let userQuery = `SELECT * FROM users WHERE user_id = "${userID}" AND guild_id = "${guildID}"`;
         return new Promise((resolve, reject) => {
            connection.query(userQuery, (error, results) => {
               if (error) {
                  connection.end();
                  return reject(error);
               }
               connection.end();
               return resolve(results);
            });
         });
      } catch (err) {
         console.log(`Error getting bet user data: ${err}`);
      }
   }, //End of getUserData()
}