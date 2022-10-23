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
const mysql = require('mysql2');
const moment = require('moment');
const config = require('../config/config.json');
const Teams = JSON.parse(fs.readFileSync('./data/teams.json'));

module.exports = {
   stats: async function stats(client, interaction, gameID, type) {
      let events = JSON.parse(fs.readFileSync('./data/current_week.json'));
      for (var e in events) {
         if (events[e]['id'] !== gameID) {
            continue;
         }
         var statEmbed = new EmbedBuilder().setTitle(events[e]['name']).setColor('FFFFFF');
         var awayTeam = `${events[e]['emojiAway']} ${Teams[events[e]['away']]['fullName']}`;
         var homeTeam = `${events[e]['emojiHome']} ${Teams[events[e]['home']]['fullName']}`;
         var oddsResult = '';
         var overUnderResult = '';
         if (events[e]['status'] == 'post') {
            oddsResult = '❌';
            let winnerScore = events[e]['winner'] == events[e]['away'] ? events[e]['awayScore'] : events[e]['homeScore'];
            let loserScore = events[e]['winner'] == events[e]['home'] ? events[e]['homeScore'] : events[e]['awayScore'];
            if (events[e]['winner'] == 'tie') {
               oddsResult = '(Push)';
            } else {
               statEmbed.setThumbnail(Teams[events[e]['winner']]['logo']);
               statEmbed.setColor(Teams[events[e]['winner']]['color']);

               if (parseInt(winnerScore) + parseInt(loserScore) == events[e]['odds']['overUnder']) {
                  overUnderResult = '(Push)';
               }
               if (parseInt(winnerScore) + parseInt(loserScore) > events[e]['odds']['overUnder']) {
                  overUnderResult = '⬆️';
               } else {
                  overUnderResult = '⬇️';
               }
            }
            awayTeam = awayTeam.concat(` (${events[e]['awayScore']})`);
            homeTeam = homeTeam.concat(` (${events[e]['homeScore']})`);
            let oddsSplit = events[e]['odds']['detail'].split(' ');
            if (oddsSplit[0] == events[e]['winner']) {
               if ((oddsSplit[1] * 1) + winnerScore >= loserScore) {
                  oddsResult = '✅';
               }
            }
         } //End of post
         let spreadOdds = events[e]['odds']['detail'].split(' ');
         var awaySpread = spreadOdds[0] == events[e]['away'] ? (spreadOdds[1] * 1).toFixed(1) : (spreadOdds[1] * -1).toFixed(1);
         awaySpread = awaySpread > 0 ? `+${awaySpread}` : awaySpread;
         awaySpread = awaySpread == 'NaN' ? 'Even' : awaySpread;
         var homeSpread = spreadOdds[0] == events[e]['home'] ? (spreadOdds[1] * 1).toFixed(1) : (spreadOdds[1] * -1).toFixed(1);
         homeSpread = homeSpread > 0 ? `+${homeSpread}` : homeSpread;
         homeSpread = homeSpread == 'NaN' ? 'Even' : homeSpread;
         let gameStats = `- **Start**: ${moment(events[e]['date']).format("ddd MMM Do @ h:mm a")} (<t:${moment(events[e]['date']).format("X")}:R>)\n- **Location:** ${events[e]['location']}\n- **Broadcast:** ${events[e]['broadcast']}\n- **Spread:** ${events[e]['odds']['detail']} ${oddsResult}\n- **Over/Under:** ${events[e]['odds']['overUnder']} (${events[e]['odds']['overUnderOdds']}) ${overUnderResult}`;
         statEmbed.addFields({
               name: `Game Stats`,
               value: gameStats
            })
            .addFields({
               name: awayTeam,
               value: `- **Record:** ${events[e]['awayTeamRecord']}\n-${events[e]['odds']['away']['favorite'] == 'true' ? " **Favorite:** True\n-" : ""}${events[e]['odds']['away']['underdog'] == 'true' ? " **Underdog:** True\n-" : ""} **Moneyline:** ${events[e]['odds']['away']['moneyLine']}\n- **Spread:** ${awaySpread} (${events[e]['odds']['away']['spreadOdds']})\n- [Roster](${Teams[events[e]['away']]['roster']}) | [Schedule](${Teams[events[e]['away']]['schedule']}) | [Stats](${Teams[events[e]['away']]['stats']})`
            })
            .addFields({
               name: homeTeam,
               value: `- **Record:** ${events[e]['homeTeamRecord']}\n-${events[e]['odds']['home']['favorite'] == 'true' ? "** Favorite:** True\n-" : ""}${events[e]['odds']['home']['underdog'] == 'true' ? " **Underdog:** True\n-" : ""} **Moneyline:** ${events[e]['odds']['home']['moneyLine']}\n- **Spread:** ${homeSpread} (${events[e]['odds']['home']['spreadOdds']})\n- [Roster](${Teams[events[e]['home']]['roster']}) | [Schedule](${Teams[events[e]['home']]['schedule']}) | [Stats](${Teams[events[e]['home']]['stats']})`
            });
         if (type == 'stats') {
            await interaction.reply({
               embeds: [statEmbed],
               ephemeral: true
            }).catch(console.error);
         } else if (type == 'bets' || type == 'restart') {
            let moneylineButton = new ButtonBuilder().setCustomId(`nfl~bets~${gameID}~addType~moneyline`).setLabel(`Moneyline`).setStyle(ButtonStyle.Secondary);
            let spreadButton = new ButtonBuilder().setCustomId(`nfl~bets~${gameID}~addType~spread`).setLabel(`Spread`).setStyle(ButtonStyle.Secondary);
            let overUnderButton = new ButtonBuilder().setCustomId(`nfl~bets~${gameID}~addType~overunder`).setLabel(`Over/Under`).setStyle(ButtonStyle.Secondary);
            if (type == 'bets') {
               await interaction.reply({
                  embeds: [statEmbed],
                  components: [new ActionRowBuilder().addComponents(moneylineButton, spreadButton, overUnderButton)],
                  ephemeral: true
               }).catch(console.error);
            } else if (type == 'restart') {
               await interaction.update({
                  embeds: [statEmbed],
                  components: [new ActionRowBuilder().addComponents(moneylineButton, spreadButton, overUnderButton)],
                  ephemeral: true
               }).catch(console.error);
            }
         }
      } //End of e loop
   }, //End of stats()
}