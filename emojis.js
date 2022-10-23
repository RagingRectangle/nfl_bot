const {
   Client,
   GatewayIntentBits,
   Partials,
   Collection,
   Permissions,
   ActionRowBuilder,
   SelectMenuBuilder,
   MessageButton,
   AttachmentBuilder,
   EmbedBuilder,
   ButtonBuilder,
   ButtonStyle,
   InteractionType,
   ChannelType,
} = require('discord.js');
const client = new Client({
   intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.DirectMessages],
   partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const fs = require('fs');
const request = require('request');
const config = require('./config/config.json');

client.on('ready', async () => {
   console.log("Creating emojis for NFL bot...");
   if (config.emojiGuildID) {
      let guild = await client.guilds.fetch(config.emojiGuildID).catch(console.error);
      if (guild) {
         request('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams', (error, response, html) => {
            if (!error && response.statusCode == 200) {
               let data = JSON.parse(html);
               let teams = data['sports'][0]['leagues'][0]['teams'];
               createTeamData(guild, teams);
            } else {
               console.log(`Error updating data: ${error}`);
            }
         });
      }
   } else {
      console.log("No emojiGuildID set in config");
   }

   async function createTeamData(guild, teams) {
      var allTeams = {};
      for (var t in teams) {
         let team = teams[t]['team'];
         let teamData = {
            id: team['id'],
            name: team['name'],
            fullName: team['displayName'],
            color: team['color'],
            logo: team['logos'][0]['href'],
            clubhouse: '',
            roster: '',
            stats: '',
            schedule: ''
         }
         for (var i in team['links']) {
            if (team['links'][i]['text'] === 'Clubhouse') {
               teamData['clubhouse'] = team['links'][i]['href'];
            } else if (team['links'][i]['text'] === 'Roster') {
               teamData['roster'] = team['links'][i]['href'];
            } else if (team['links'][i]['text'] === 'Statistics') {
               teamData['stats'] = team['links'][i]['href'];
            } else if (team['links'][i]['text'] === 'Schedule') {
               teamData['schedule'] = team['links'][i]['href'];
            }
         } //End of i loop
         let teamEmoji = await createTeamEmoji(guild, teamData['logo'], team['abbreviation']);
         teamData['emoji'] = teamEmoji;
         allTeams[team['abbreviation']] = teamData;
         await new Promise(done => setTimeout(done, 500));
      } //End of t loop
      fs.writeFileSync('./data/teams.json', JSON.stringify(allTeams));
      process.exit();
   } //End of createTeamEmojis()

   async function createTeamEmoji(guild, logoLink, name) {
      var newEmoji = '';
      let emojiCheck = await guild.emojis.cache.find(emoji => emoji.name === `NFL_${name}`);
      if (emojiCheck) {
         await emojiCheck.delete()
            .then(emoji => console.log(`Deleted emoji ${emoji}`))
            .catch(console.error);
      }
      await guild.emojis.create({
            attachment: logoLink,
            name: `NFL_${name}`
         })
         .then(emoji => {
            console.log(`Created new emoji ${emoji}`);
            newEmoji = emoji;
            return newEmoji;
         })
         .catch(console.error);
   } //End of createTeamEmoji()
}); //End of ready()

client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.login(config.token);