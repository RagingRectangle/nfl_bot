const {
	EmbedBuilder,
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');
const Bets = require('../functions/bets.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.betsCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Place or see your bets`)
		.addSubcommand(subcommand =>
			subcommand
			.setName('pending')
			.setDescription('See current bets')),

	async execute(client, interaction) {
		if (interaction.options.getSubcommand() === 'pending') {
			Bets.showCurrentBets(client, interaction);
		}
	}, //End of execute()
};