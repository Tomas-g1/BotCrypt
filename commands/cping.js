const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('cping').setDescription('Ping del bot'),
  async execute(interaction) {
    const ws = Math.round(interaction.client.ws.ping);
    await interaction.reply({ content: `🏓 Pong ${ws} ms`, ephemeral: true });
  }
};
