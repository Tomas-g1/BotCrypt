require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('Solicitar reseña en este ticket')
    .addUserOption(o=>o.setName('staff').setDescription('Quién atendió').setRequired(true))
    .addUserOption(o=>o.setName('cliente').setDescription('Cliente que debe responder').setRequired(false))
    .addStringOption(o=>o.setName('titulo').setDescription('Título del panel').setRequired(false)),
  new SlashCommandBuilder()
    .setName('cping')
    .setDescription('Ping del bot')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados.');
  } catch (e) {
    console.error('Error registrando comandos:', e);
  }
})();
