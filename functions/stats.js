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
   stats: async function stats(client, interaction) {
      let statUser = interaction.options.getUser('username');
      userStatQuery = (query) => {
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
      let statResults = await userStatQuery(`SELECT count(*) AS picks FROM picks WHERE user_id = "${statUser.id}" AND guild_id = "${interaction.guildId}";
      SELECT count(*) AS pending FROM picks a, games b WHERE a.user_id = "${statUser.id}" AND guild_id = "${interaction.guildId}" AND a.game_id = b.id AND b.winner = "";
      SELECT count(*) AS correct FROM picks a, games b WHERE a.user_id = "${statUser.id}" AND guild_id = "${interaction.guildId}" AND a.game_id = b.id AND a.pick = b.winner;
      SELECT count(*) as away FROM picks a, games b WHERE a.user_id = "${statUser.id}" AND guild_id = "${interaction.guildId}" AND a.game_id = b.id AND a.pick = b.away_team;
      SELECT count(*) as awayCorrect FROM picks a, games b WHERE a.user_id = "${statUser.id}" AND guild_id = "${interaction.guildId}" AND a.game_id = b.id AND a.pick = b.away_team AND a.pick = b.winner;
      SELECT count(*) as home FROM picks a, games b WHERE a.user_id = "${statUser.id}" AND guild_id = "${interaction.guildId}" AND a.game_id = b.id AND a.pick = b.home_team;
      SELECT count(*) as homeCorrect FROM picks a, games b WHERE a.user_id = "${statUser.id}" AND guild_id = "${interaction.guildId}" AND a.game_id = b.id AND a.pick = b.home_team AND a.pick = b.winner;`);
      if (statResults[0][0]['picks'] == 0){
         interaction.editReply(`${statUser.username} has not made any picks yet.`);
         return;
      }
      var statObj = {};
      for (var s in statResults){
         statObj[Object.keys(statResults[s][0])] = Object.values(statResults[s][0]);
      }
      interaction.editReply({
         embeds: [new EmbedBuilder().setTitle(`${statUser.username} Stats:`).setDescription(`**- Total Picks:** ${statObj.picks}\n**- Pending:** ${statObj.pending}\n**- Correct:** ${statObj.correct} (${(statObj.correct / (statObj.picks - statObj.pending) * 100).toFixed(2)}%)\n**- Incorrect:** ${statObj.picks - statObj.pending - statObj.correct} (${((statObj.picks - statObj.pending - statObj.correct) / (statObj.picks - statObj.pending) * 100).toFixed(2)}%)\n**- Away Picks:** ${statObj.away} (${(statObj.away / statObj.picks * 100).toFixed(2)}%)\n**- Correct Away:** ${statObj.awayCorrect}\n**- Home Picks:** ${statObj.home} (${(statObj.home / statObj.picks * 100).toFixed(2)}%)\n**- Correct Home:** ${statObj.homeCorrect}`)]
      });
   }, //End of stats()
}