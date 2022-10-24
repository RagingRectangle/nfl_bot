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
const moment = require('moment');
const mysql = require('mysql2');
const config = require('../config/config.json');
const Teams = require('../data/teams.json');
module.exports = {
   addMoneylineBet: async function addMoneylineBet(client, interaction, gameID) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      let oldEmbed = interaction.message.embeds[0];
      for (var e in events) {
         if (events[e]['id'] !== gameID) {
            continue;
         }
         var betEmbed = new EmbedBuilder().setTitle(`${Teams[events[e]['away']]['name']} vs ${Teams[events[e]['home']]['name']} Moneyline Bet`).setColor('006E13').addFields(oldEmbed.fields[0])
            .addFields({
               name: `${events[e]['emojiAway']} ${Teams[events[e]['away']]['fullName']} (${events[e]['odds']['away']['moneyLine'] > 0 ? `+${events[e]['odds']['away']['moneyLine']}` : events[e]['odds']['away']['moneyLine']})`,
               value: `- ${events[e]['odds']['away']['moneyLine'] > 0 ? `Bet $100 to win **$${events[e]['odds']['away']['moneyLine'].toFixed(2)}**` : `Bet $100 to win **$${(100 / (events[e]['odds']['away']['moneyLine'] * -1) * 100).toFixed(2)}**`}`
            })
            .addFields({
               name: `${events[e]['emojiHome']} ${Teams[events[e]['home']]['fullName']} (${events[e]['odds']['home']['moneyLine'] > 0 ? `+${events[e]['odds']['home']['moneyLine']}` : events[e]['odds']['home']['moneyLine']})`,
               value: `- ${events[e]['odds']['home']['moneyLine'] > 0 ? `Bet $100 to win **$${events[e]['odds']['home']['moneyLine'].toFixed(2)}**` : `Bet $100 to win **$${(100 / (events[e]['odds']['home']['moneyLine'] * -1) * 100).toFixed(2)}**`}`
            });
         let awayMultiplier = events[e]['odds']['away']['moneyLine'] > 0 ? events[e]['odds']['away']['moneyLine'] / 100 : (100 / (events[e]['odds']['away']['moneyLine'] * -1));
         let homeMultiplier = events[e]['odds']['home']['moneyLine'] > 0 ? events[e]['odds']['home']['moneyLine'] / 100 : (100 / (events[e]['odds']['home']['moneyLine'] * -1));
         let button1 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~addWager~moneyline~${events[e]['away']}~${awayMultiplier}`).setLabel(`${Teams[events[e]['away']]['name']}`).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']);
         let button2 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~addWager~moneyline~${events[e]['home']}~${homeMultiplier}`).setLabel(`${Teams[events[e]['home']]['name']}`).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']);
         await interaction.update({
            embeds: [betEmbed],
            components: [new ActionRowBuilder().addComponents(button1, button2)],
            ephemeral: true
         }).catch(console.error);
      } //End of e loop
   }, //End of addMoneylineBet()


   addSpreadBet: async function addSpreadBet(client, interaction, gameID) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      let oldEmbed = interaction.message.embeds[0];
      for (var e in events) {
         if (events[e]['id'] !== gameID) {
            continue;
         }
         var betEmbed = new EmbedBuilder().setTitle(`${Teams[events[e]['away']]['name']} vs ${Teams[events[e]['home']]['name']} Spread Bet`).setColor('006E13').addFields(oldEmbed.fields[0])
            .addFields({
               name: `${events[e]['emojiAway']} ${Teams[events[e]['away']]['fullName']} (${events[e]['odds']['away']['spreadOdds']})`,
               value: `- ${events[e]['odds']['away']['spreadOdds'] > 0 ? `Bet $100 to win **$${events[e]['odds']['away']['spreadOdds'].toFixed(2)}**` : `Bet $100 to win **$${(100 / (events[e]['odds']['away']['spreadOdds'] * -1) * 100).toFixed(2)}**`}`
            })
            .addFields({
               name: `${events[e]['emojiHome']} ${Teams[events[e]['home']]['fullName']} (${events[e]['odds']['home']['spreadOdds']})`,
               value: `- ${events[e]['odds']['home']['spreadOdds'] > 0 ? `Bet $100 to win **$${events[e]['odds']['home']['spreadOdds'].toFixed(2)}**` : `Bet $100 to win **$${(100 / (events[e]['odds']['home']['spreadOdds'] * -1) * 100).toFixed(2)}**`}`
            });
         let awayMultiplier = events[e]['odds']['away']['spreadOdds'] > 0 ? events[e]['odds']['away']['spreadOdds'] / 100 : (100 / (events[e]['odds']['away']['spreadOdds'] * -1));
         let homeMultiplier = events[e]['odds']['home']['spreadOdds'] > 0 ? events[e]['odds']['home']['spreadOdds'] / 100 : (100 / (events[e]['odds']['home']['spreadOdds'] * -1));
         let button1 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~addWager~spread~${events[e]['away']}_${events[e]['odds']['detail']}~${awayMultiplier}`).setLabel(`${Teams[events[e]['away']]['name']}`).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']);
         let button2 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~addWager~spread~${events[e]['home']}_${events[e]['odds']['detail']}~${homeMultiplier}`).setLabel(`${Teams[events[e]['home']]['name']}`).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']);
         await interaction.update({
            embeds: [betEmbed],
            components: [new ActionRowBuilder().addComponents(button1, button2)],
            ephemeral: true
         }).catch(console.error);
      } //End of e loop
   }, //End of addSpreadBet


   addOverUnderBet: async function addOverUnderBet(client, interaction, gameID) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      let oldEmbed = interaction.message.embeds[0];
      for (var e in events) {
         if (events[e]['id'] !== gameID) {
            continue;
         }
         let multiplier = events[e]['odds']['overUnderOdds'] > 0 ? events[e]['odds']['overUnderOdds'] / 100 : (100 / (events[e]['odds']['overUnderOdds'] * -1));
         var betEmbed = new EmbedBuilder().setTitle(`${Teams[events[e]['away']]['name']} vs ${Teams[events[e]['home']]['name']} Over/Under Bet`).setColor('006E13').addFields(oldEmbed.fields[0])
            .addFields({
               name: `⬆️ Over ${events[e]['odds']['overUnder']} Points (${events[e]['odds']['overUnderOdds']})`,
               value: `- Bet $100 to win $${(100 * multiplier).toFixed(2)}`
            })
            .addFields({
               name: `⬇️ Under ${events[e]['odds']['overUnder']} Points (${events[e]['odds']['overUnderOdds']})`,
               value: `- Bet $100 to win $${(100 * multiplier).toFixed(2)}`
            })
         betEmbed['data']['fields'][0]['value'] = betEmbed['data']['fields'][0]['value'].replace(` (${events[e]['odds']['overUnderOdds']})`, '');
         let overButton = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~addWager~over~${events[e]['odds']['overUnder']}~${multiplier}`).setLabel(`Over ${events[e]['odds']['overUnder']}`).setStyle(ButtonStyle.Secondary).setEmoji('⬆️');
         let underButton = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~addWager~under~${events[e]['odds']['overUnder']}~${multiplier}`).setLabel(`Under ${events[e]['odds']['overUnder']}`).setStyle(ButtonStyle.Secondary).setEmoji('⬇️');
         await interaction.update({
            embeds: [betEmbed],
            components: [new ActionRowBuilder().addComponents(overButton, underButton)],
            ephemeral: true
         }).catch(console.error);
      } //End of e loop
   }, //End of addOverUnderBet


   addWagerAmount: async function addWagerAmount(client, interaction, gameID, betType, betOption, multiplier) {
      let oldEmbed = interaction.message.embeds[0];
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      for (var e in events) {
         if (events[e]['id'] !== gameID) {
            continue;
         }
         let userQueryData = await module.exports.getUserData(interaction.user.id, interaction.message.guild.id);
         let userData = userQueryData[1][0];
         var betEmbed = new EmbedBuilder().setTitle(oldEmbed.title).setColor(oldEmbed.color)
            .addFields(oldEmbed.fields[0]);
         if (betType == 'moneyline') {
            betEmbed.addFields(events[e]['away'] == betOption ? oldEmbed.fields[1] : oldEmbed.fields[2]);
         } else if (betType == 'over') {
            betEmbed.addFields(oldEmbed.fields[1]);
            betOption = events[e]['odds']['overUnder'];
         } else if (betType == 'under') {
            betEmbed.addFields(oldEmbed.fields[2]);
            betOption = events[e]['odds']['overUnder'];
         } else if (betType == 'spread') {
            if (events[e]['away'] == betOption) {
               betEmbed.addFields(oldEmbed.fields[1]);
            } else if (events[e]['home'] == betOption) {
               betEmbed.addFields(oldEmbed.fields[2]);
            }
         }
         betEmbed.addFields({
            name: `${interaction.user.username}'s Bank`,
            value: `- Available: **$${userData['cash']}**\n- Pending: **$${userData['wagers']}**`
         });
         let betRow1 = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~1`).setLabel(`$1 (+${(1*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 1 ? false : true)))
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~5`).setLabel(`$5 (+${(5*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 5 ? false : true)))
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~10`).setLabel(`$10 (+${(10*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 10 ? false : true)))
         let betRow2 = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~25`).setLabel(`$25 (+${(25*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 25 ? false : true)))
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~50`).setLabel(`$50 (+${(50*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 50 ? false : true)))
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~100`).setLabel(`$100 (+${(100*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 100 ? false : true)))
         let betRow3 = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~250`).setLabel(`$250 (+${(250*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 250 ? false : true)))
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~500`).setLabel(`$500 (+${(500*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 500 ? false : true)))
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~verifyWager~${betType}~${betOption}~${multiplier}~1000`).setLabel(`$1000 (+${(1000*multiplier).toFixed(2)})`).setStyle(ButtonStyle.Secondary).setDisabled((userData['cash'] >= 1000 ? false : true)));
         await interaction.update({
            embeds: [betEmbed],
            components: [betRow1, betRow2, betRow3],
            ephemeral: true
         }).catch(console.error);
      } //End of e loop
   }, //End of addWagerAmount()


   verifyWager: async function verifyWager(client, interaction, gameID, type, betOption, multiplier, betAmount) {
      let oldEmbed = interaction.message.embeds[0];
      var verifyEmbed = new EmbedBuilder().setTitle(oldEmbed.title).setColor(oldEmbed.color).addFields(oldEmbed.fields[0]).addFields(oldEmbed.fields[1]);
      if (type == 'moneyline') {
         verifyEmbed.addFields({
            name: `Current Wager`,
            value: `- Bet: **$${betAmount}** on the ${Teams[betOption]['name']} to win\n- Profit: **$${(betAmount * multiplier).toFixed(2)}**\n- Payout: **$${((betAmount * 1) + (betAmount * multiplier)).toFixed(2)}**`
         });
      } else if (type == 'over' || type == 'under') {
         verifyEmbed.addFields({
            name: `Current Wager`,
            value: `- Bet: **$${betAmount}** on score to be ${type} ${betOption}\n- Profit: **$${(betAmount * multiplier).toFixed(2)}**\n- Payout: **$${((betAmount * 1) + (betAmount * multiplier)).toFixed(2)}**`
         });
      } else if (type == 'spread') {
         let optionSplit = betOption.split('_');
         verifyEmbed.addFields({
            name: `Current Wager`,
            value: `- Bet: **$${betAmount}** on the ${Teams[optionSplit[0]]['name']} to beat the spread\n- Profit: **$${(betAmount * multiplier).toFixed(2)}**\n- Payout: **$${((betAmount * 1) + (betAmount * multiplier)).toFixed(2)}**`
         });
      }
      await interaction.update({
         embeds: [verifyEmbed],
         components: [new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${gameID}~placeBet~${type}~${betOption}~${multiplier}~${betAmount}`).setLabel(`Place Bet`).setStyle(ButtonStyle.Success))
            .addComponents(new ButtonBuilder().setCustomId(`nfl~bets~${gameID}~restartBet`).setLabel(`Cancel`).setStyle(ButtonStyle.Danger))
         ],
         ephemeral: true
      }).catch(console.error);
   }, //End of verifyWager()


   getUserData: async function getUserData(userID, guildID) {
      try {
         var dbConfig = config.database;
         dbConfig.multipleStatements = true;
         let connection = mysql.createConnection(config.database);
         let userQuery = `INSERT IGNORE INTO users (user_id, guild_id, cash, wagers) VALUES ("${userID}", "${guildID}", "${config.cashDefault}", "0");
         SELECT * FROM users WHERE user_id = "${userID}" AND guild_id = "${guildID}"`;
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


   placeBet: async function placeBet(client, interaction, gameID, betType, betOption, multiplier, betAmount) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      runBetQuery = (query) => {
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
            console.log(`Error adding user bet: ${err}`);
         }
      };
      let userData = await runBetQuery(`SELECT * FROM users WHERE user_id = "${interaction.user.id}" AND guild_id = "${interaction.guildId}";`);
      if (userData[0]['cash'] * 1 < betAmount * 1) {
         interaction.update({
            embeds: [new EmbedBuilder().setTitle(`$${betAmount} Bet Not Placed!`).setColor('Red').setDescription(`- Your available cash is only **$${userData[0]['cash']}**`)],
            components: [],
            ephemeral: true
         }).catch(console.error);
         return;
      }
      for (var e in events) {
         if (events[e]['id'] != gameID) {
            continue;
         }
         if (moment(events[e]['date']) < moment()) {
            await interaction.reply({
               content: `Betting disabled, this game started <t:${moment(gametime).format("X")}:R>`,
               ephemeral: true
            }).catch(console.error);
            return;
         }
         let placeBetQuery = await runBetQuery(`INSERT INTO bets (user_id, guild_id, game_id, type, value, multiplier, wager, profit) VALUES ("${interaction.user.id}","${interaction.guildId}","${gameID}","${betType}","${betOption}","${multiplier}","${betAmount}","${(betAmount * multiplier).toFixed(2)}");
         UPDATE users SET cash = cash - ${betAmount * 1}, wagers = wagers + ${betAmount * 1} WHERE user_id = "${interaction.user.id}" AND guild_id = "${interaction.guildId}"`);
         if (placeBetQuery[0]['warningStatus'] == 0 && placeBetQuery[1]['warningStatus'] == 0) {
            interaction.update({
               embeds: [new EmbedBuilder().setTitle(`Your $${betAmount} bet has been placed!`).setColor('006E13').setDescription(`- Available cash is now **$${(userData[0]['cash'] * 1) - (betAmount * 1)}**\n- Currently wagering **$${(userData[0]['wagers'] * 1) + (betAmount * 1)}**`)],
               components: [],
               ephemeral: true
            }).catch(console.error);
         } else {
            interaction.update({
               embeds: [new EmbedBuilder().setTitle(`$${betAmount} Bet Not Placed!`).setColor('Red').setDescription(`- An error occurred while trying to place your bet, contact an admin.`)],
               components: [],
               ephemeral: true
            }).catch(console.error);
         }
      } //End of e loop
   }, //End of placeBet()


   showCurrentBets: async function showCurrentBets(client, interaction, type) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
      let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
      runPendingQuery = (query) => {
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
            console.log(`Error adding user bet: ${err}`);
         }
      };
      let pendingResults = await runPendingQuery(`SELECT * FROM bets WHERE user_id = "${interaction.user.id}" AND guild_id = "${interaction.guildId}" AND result = "pending";`);
      var betCount = 0;
      var pendingEmbed = new EmbedBuilder();
      for (var p in pendingResults) {
         for (var e in events) {
            if (events[e]['id'] != pendingResults[p]['game_id']) {
               continue;
            }
            var betValue = '';
            if (pendingResults[p]['type'] == 'moneyline') {
               betValue = `**- Type:** Moneyline\n**- Bet:** ${Teams[pendingResults[p]['value']]['name']} to win\n**- Wager:** $${pendingResults[p]['wager']}\n**- Profit:** $${pendingResults[p]['profit']}`;
            } else if (pendingResults[p]['type'] == 'over' || pendingResults[p]['type'] == 'under') {
               betValue = `**- Type:** Over/Under\n**- Bet:** ${pendingResults[p]['type'].replace('over','Over').replace('under','Under')} ${pendingResults[p]['value']} points\n**- Wager:** $${pendingResults[p]['wager']}\n**- Profit:** $${pendingResults[p]['profit']}`;
            } else if (pendingResults[p]['type'] == 'spread') {
               let valueSplit = pendingResults[p]['value'].split('_');
               let userPick = valueSplit[0];
               betValue = `**- Type:** Spread (${valueSplit[1]})\n**- Bet:** ${Teams[userPick]['name']} to beat spread\n**- Wager:** $${pendingResults[p]['wager']}\n**- Profit:** $${pendingResults[p]['profit']}`;
            } else {
               continue;
            }
            betCount++;
            pendingEmbed.addFields({
               name: `${events[e]['emojiAway']} ${Teams[events[e]['away']]['name']} @ ${events[e]['emojiHome']} ${Teams[events[e]['home']]['name']}`,
               value: betValue
            });
         } //End of e loop
      } //End of p loop
      if (betCount == 0) {
         interaction.reply({
            embeds: [new EmbedBuilder().setTitle(`${interaction.user.username}'s Pending Bets:`).setColor('Red').setDescription('No pending bets for this week.')]
         }).catch(console.error);
      } else {
         pendingEmbed.setTitle(`${interaction.user.username}'s ${betCount} Pending Bets:`).setColor('006E13');
         interaction.reply({
            embeds: [pendingEmbed]
         }).catch(console.error);
      }
   }, //End of showCurrentBets
}