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
const calendar = JSON.parse(fs.readFileSync('./data/calendar.json'));

module.exports = {
   selectPicks: async function selectPicks(client, interaction) {
      previousPickQuery = (query) => {
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
      let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
      //Get week
      var week = null;
      for (var c in calendar) {
         if (moment(calendar[c]['startDate']) < moment() && moment() < moment(calendar[c]['endDate'])) {
            week = calendar[c];
            break;
         }
      } //End of c loop
      if (week === null) {
         await interaction.followUp({
            content: `Nothing to pick this week.`,
            ephemeral: true
         }).catch(console.error);
         return;
      }
      getEvents()
      async function getEvents() {
         let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
         var idList = [];
         for (var i in events) {
            idList.push(`"${events[i]['id']}"`);
         } //End of i loop
         let userPickResults = await previousPickQuery(`SELECT game_id, pick FROM picks WHERE user_id = "${interaction.user.id}" AND guild_id = "${interaction.guildId}" AND game_id in (${idList.join(",")})`);
         var userPicks = {};
         for (var u in userPickResults) {
            userPicks[userPickResults[u]['game_id']] = userPickResults[u]['pick'];
         } //End of u loop
         var rows = [];
         for (var e in events) {
            //Current games
            if (events[e]['status'] === 'in') {
               let button1 = new ButtonBuilder().setCustomId(`nfl~ignoreCurrent~${events[e]['away']}`).setLabel(`${events[e]['away']} (${events[e]['awayScore']})`).setStyle(events[e]['away'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']).setDisabled(true);
               let button2 = new ButtonBuilder().setCustomId(`nfl~ignoreCurrent~${events[e]['home']}`).setLabel(`${events[e]['home']} (${events[e]['homeScore']})`).setStyle(events[e]['home'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']).setDisabled(true);
               let button3 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~gameStats`).setLabel('Bet').setStyle(ButtonStyle.Secondary).setDisabled(true);
               let button4 = new ButtonBuilder().setCustomId(`nfl~stats~${events[e]['id']}`).setLabel('Stats').setStyle(ButtonStyle.Secondary);
               let buttonRow = new ActionRowBuilder().addComponents(button1).addComponents(button2).addComponents(button3).addComponents(button4);
               rows.push(buttonRow);
            }
            //Finished games
            else if (events[e]['status'] === 'post') {
               var button1 = new ButtonBuilder().setCustomId(`nfl~ignorePost~${events[e]['away']}`).setLabel(`${events[e]['away']} (${events[e]['awayScore']})`).setDisabled(true).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']);
               var button2 = new ButtonBuilder().setCustomId(`nfl~ignorePost~${events[e]['home']}`).setLabel(`${events[e]['home']} (${events[e]['homeScore']})`).setDisabled(true).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']);
               if (userPicks[events[e]['id']]) {
                  //Winners
                  if (events[e]['away'] == events[e]['winner']) {
                     if (events[e]['away'] == userPicks[events[e]['id']]) {
                        button1.setStyle(ButtonStyle.Success);
                     }
                  }
                  if (events[e]['home'] == events[e]['winner']) {
                     if (events[e]['home'] == userPicks[events[e]['id']]) {
                        button2.setStyle(ButtonStyle.Success);
                     }
                  }
                  //Losers
                  if (userPicks[events[e]['id']] != events[e]['winner']) {
                     if (userPicks[events[e]['id']] == events[e]['away']) {
                        button1.setStyle(ButtonStyle.Danger);
                     }
                     if (userPicks[events[e]['id']] == events[e]['home']) {
                        button2.setStyle(ButtonStyle.Danger);
                     }
                  }
               }
               let button3 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~gameStats`).setLabel('Bet').setStyle(ButtonStyle.Secondary).setDisabled(true);
               let button4 = new ButtonBuilder().setCustomId(`nfl~stats~${events[e]['id']}`).setLabel('Stats').setStyle(ButtonStyle.Secondary);
               rows.push(new ActionRowBuilder().addComponents(button1).addComponents(button2).addComponents(button3).addComponents(button4));
            }
            //Upcoming games
            else if (events[e]['status'] === 'pre') {
               let button1 = new ButtonBuilder().setCustomId(`nfl~select~${events[e]['id']}~${events[e]['away']}~${events[e]['date']}`).setLabel(`${events[e]['away']}`).setStyle(events[e]['away'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']);
               let button2 = new ButtonBuilder().setCustomId(`nfl~select~${events[e]['id']}~${events[e]['home']}~${events[e]['date']}`).setLabel(`${events[e]['home']}`).setStyle(events[e]['home'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']);
               let button3 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~gameStats`).setLabel('Bet').setStyle(ButtonStyle.Secondary);
               let button4 = new ButtonBuilder().setCustomId(`nfl~stats~${events[e]['id']}`).setLabel('Stats').setStyle(ButtonStyle.Secondary);
               let buttonRow = new ActionRowBuilder().addComponents(button1).addComponents(button2).addComponents(button3).addComponents(button4);
               rows.push(buttonRow);
            }
         } //End of e loop
         if (rows.length > 0) {
            sendSelectMessages(rows);
         } else {
            await interaction.followUp({
               content: `Nothing to pick this week.`,
               ephemeral: true
            }).catch(console.error);
            return;
         }
      } //End of getEvents()

      async function sendSelectMessages(rows) {
         let messageNeeded = Math.ceil(rows.length / 4);
         var rowCount = 0;
         for (var m = 0; m < messageNeeded; m++) {
            var messageRows = [];
            for (var r = rowCount, s = 0; s < 4 && rowCount < rows.length; r++, rowCount++, s++) {
               messageRows.push(rows[r]);
            } //End of s loop
            await interaction.followUp({
               components: messageRows,
               ephemeral: true
            }).catch(console.error);
         } //End of m loop
      } //End of sendSelectMessage()
   }, //End of selectPicks()


   pickSelected: async function pickSelected(client, interaction, gameID, teamName, gametime) {
      runPickQuery = (query) => {
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
      //Check time
      if (moment(gametime) < moment()) {
         await interaction.reply({
            content: `Voting disabled, this game started <t:${moment(gametime).format("X")}:R>`,
            ephemeral: true
         }).catch(console.error);
         return;
      }
      let pickResults = await runPickQuery(`INSERT INTO picks (user_id, guild_id, game_id, pick) VALUES ("${interaction.user.id}", "${interaction.guildId}", "${gameID}", "${teamName}") ON DUPLICATE KEY UPDATE pick = "${teamName}"`);
      var newComponents = interaction.message.components;
      for (var r in newComponents) {
         if (newComponents[r]['components'][0]['data']['custom_id'].includes(`~${teamName}~`)) {
            newComponents[r]['components'][0]['data']['style'] = 1;
            newComponents[r]['components'][1]['data']['style'] = 2;
         } else if (newComponents[r]['components'][1]['data']['custom_id'].includes(`~${teamName}`)) {
            newComponents[r]['components'][1]['data']['style'] = 1;
            newComponents[r]['components'][0]['data']['style'] = 2;
         }
      } //End of r loop
      await interaction.update({
         components: newComponents
      }).catch(console.error);
   }, //End of pickSelected()
}