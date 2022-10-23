const {
	EmbedBuilder,
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');
const Stats = require('../functions/stats.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.userStatsCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Show pick stats for user`)
		.addUserOption(option =>
			option
			.setName('username')
			.setDescription('Enter username to see their stats')
			.setRequired(true)),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		await interaction.deferReply();
		Stats.stats(client,interaction);
	}, //End of execute()
};