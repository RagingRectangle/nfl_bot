const {
	EmbedBuilder,
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');
const Picks = require('../functions/picks.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.selectPicksCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Select your picks for this week`),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		await interaction.reply(`${interaction.user.username} is selecting their picks!`);
		Picks.selectPicks(client, interaction);
	}, //End of execute()
};