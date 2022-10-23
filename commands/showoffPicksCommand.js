const {
	EmbedBuilder,
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');
const Showoff = require('../functions/showoff.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.showoffPicksCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Showoff your picks for everyone to judge`),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		await interaction.reply(`**${interaction.user.username} is showing off their picks for this week:**`);
		Showoff.showoff(client, interaction);
	}, //End of execute()
};