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
const mysql = require('mysql2');
const config = require('../config/config.json');

module.exports = {
   showoff: async function showoff(client, interaction) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
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
         if (!userPicks[events[e]['id']]) {
            continue;
         }
         if (events[e]['status'] === 'in') {
            let button1 = new ButtonBuilder().setCustomId(`nfl~ignoreShowoff~${events[e]['away']}`).setLabel(`${events[e]['away']} (${events[e]['awayScore']})`).setStyle(events[e]['away'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']).setDisabled(true);
            let button2 = new ButtonBuilder().setCustomId(`nfl~ignoreShowoff~${events[e]['home']}`).setLabel(`${events[e]['home']} (${events[e]['homeScore']})`).setStyle(events[e]['home'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']).setDisabled(true);
            let button3 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~gameStats`).setLabel('Bet').setStyle(ButtonStyle.Secondary).setDisabled(true);
            let button4 = new ButtonBuilder().setCustomId(`nfl~stats~${events[e]['id']}`).setLabel('Stats').setStyle(ButtonStyle.Secondary);
            let buttonRow = new ActionRowBuilder().addComponents(button1).addComponents(button2).addComponents(button3).addComponents(button4);
            rows.push(buttonRow);
         } else if (events[e]['status'] === 'post') {
            var button1 = new ButtonBuilder().setCustomId(`nfl~ignoreShowoff~${events[e]['away']}`).setLabel(`${events[e]['away']} (${events[e]['awayScore']})`).setDisabled(true).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']);
            var button2 = new ButtonBuilder().setCustomId(`nfl~ignoreShowoff~${events[e]['home']}`).setLabel(`${events[e]['home']} (${events[e]['homeScore']})`).setDisabled(true).setStyle(ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']);
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
         } else if (events[e]['status'] === 'pre') {
            let button1 = new ButtonBuilder().setCustomId(`nfl~ignorePreShowoff~${events[e]['id']}~${events[e]['away']}~${events[e]['date']}`).setLabel(`${events[e]['away']}`).setStyle(events[e]['away'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiAway']).setDisabled(true);
            let button2 = new ButtonBuilder().setCustomId(`nfl~ignorePreShowoff~${events[e]['id']}~${events[e]['home']}~${events[e]['date']}`).setLabel(`${events[e]['home']}`).setStyle(events[e]['home'] == userPicks[events[e]['id']] ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(events[e]['emojiHome']).setDisabled(true);
            let button3 = new ButtonBuilder().setCustomId(`nfl~bets~${events[e]['id']}~gameStats`).setLabel('Bet').setStyle(ButtonStyle.Secondary);
            let button4 = new ButtonBuilder().setCustomId(`nfl~stats~${events[e]['id']}`).setLabel('Stats').setStyle(ButtonStyle.Secondary);
            let buttonRow = new ActionRowBuilder().addComponents(button1).addComponents(button2).addComponents(button3).addComponents(button4);
            rows.push(buttonRow);
         }
      } //End of e loop
      if (rows.length == 0) {
         await interaction.followUp(`But ${interaction.user.username} hasn't actually made any picks yet...`);
         return;
      }
      let messageNeeded = Math.ceil(rows.length / 4);
      var rowCount = 0;
      for (var m = 0; m < messageNeeded; m++) {
         var messageRows = [];
         for (var r = rowCount, s = 0; s < 4 && rowCount < rows.length; r++, rowCount++, s++) {
            messageRows.push(rows[r]);
         } //End of s loop
         await interaction.followUp({
            components: messageRows,
         }).catch(console.error);
      } //End of m loop
   }, //End of showoff()
}