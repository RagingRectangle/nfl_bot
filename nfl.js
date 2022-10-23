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
   ChannelType,
} = require('discord.js');
const client = new Client({
   intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.DirectMessages],
   partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const fs = require('fs');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const pm2 = require('pm2');
const config = require('./config/config.json');
const UpdateData = require('./functions/updateData.js');
const SlashRegistry = require('./functions/slashRegistry.js');
const Picks = require('./functions/picks.js');
const GameStats = require('./functions/gameStats.js');
const Bets = require('./functions/bets.js');

client.on('ready', async () => {
   console.log("NFL Bot Logged In");
   //Start update data cron
   UpdateData.update(client);
   let updateDataJob = new CronJob(`*/30 * * * *`, function () {
      UpdateData.update(client);
   }, null, true, null);
   updateDataJob.start();
   //Register Slash Commands
   if (config.slashGuildIDs.length > 0) {
      SlashRegistry.registerCommands(client);
   }
}); //End of ready()


//Slash commands
client.on('interactionCreate', async interaction => {
   if (interaction.type !== InteractionType.ApplicationCommand) {
      return;
   }
   let user = interaction.user;
   if (user.bot == true) {
      return;
   }
   const command = client.commands.get(interaction.commandName);
   if (!command) {
      return;
   }
   try {
      let slashReturn = await command.execute(client, interaction);
      try {
         if (slashReturn === 'delete') {
            interaction.deleteReply().catch(err);
         }
      } catch (err) {}
   } catch (error) {
      console.error(error);
      await interaction.reply({
         content: 'There was an error while executing this command!',
         ephemeral: true
      }).catch(console.error);
   }
}); //End of slash commands


//Buttons and Lists
client.on('interactionCreate', async interaction => {
   if (interaction.type !== InteractionType.MessageComponent) {
      return;
   }
   if (interaction.message.guildId === null) {
      return;
   }
   let user = interaction.member;
   var interactionID = interaction.customId;
   //Verify interaction
   if (!interactionID.startsWith('nfl~')) {
      return;
   }
   interactionID = interactionID.replace('nfl~', '');
   if (interactionID.startsWith('select~')) {
      interactionID = interactionID.replace('select~', '').split('~');
      Picks.pickSelected(client, interaction, interactionID[0], interactionID[1], interactionID[2]);
   } else if (interactionID.startsWith('stats~')) {
      GameStats.stats(client, interaction, interactionID.replace('stats~', ''), 'stats');
   } else if (interactionID.startsWith('bets~')) {
      let betSplit = interactionID.replace('bets~', '').split('~');
      let eventID = betSplit[0];
      if (betSplit[1] == 'gameStats') {
         GameStats.stats(client, interaction, eventID, 'bets');
      } else if (betSplit[1] == 'restartBet') {
         GameStats.stats(client, interaction, eventID, 'restart');
      } else if (betSplit[1] == 'addType') {
         if (betSplit[2] == 'moneyline') {
            Bets.addMoneylineBet(client, interaction, eventID);
         } else if (betSplit[2] == 'spread') {
            Bets.addSpreadBet(client, interaction, eventID);
         } else if (betSplit[2] == 'overunder') {
            Bets.addOverUnderBet(client, interaction, eventID);
         }
      } else if (betSplit[1] == 'addWager') {
         Bets.addWagerAmount(client, interaction, eventID, betSplit[2], betSplit[3], parseFloat(betSplit[4]).toFixed(4));
      } else if (betSplit[1] == 'verifyWager') {
         Bets.verifyWager(client, interaction, eventID, betSplit[2], betSplit[3], betSplit[4], betSplit[5]);
      } else if (betSplit[1] == 'placeBet') {
         Bets.placeBet(client, interaction, eventID, betSplit[2], betSplit[3], betSplit[4], betSplit[5]);
      }
   }
}); //End of buttons/lists


client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.login(config.token);