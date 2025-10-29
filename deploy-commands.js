require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  // /review
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('Solicitar reseña en este ticket')
    .addUserOption(o=>o.setName('staff').setDescription('Quién atendió').setRequired(true))
    .addUserOption(o=>o.setName('cliente').setDescription('Cliente que debe responder').setRequired(false))
    .addStringOption(o=>o.setName('titulo').setDescription('Título del panel').setRequired(false)),

  // /cping
  new SlashCommandBuilder()
    .setName('cping')
    .setDescription('Ping del bot'),

  // /proof
  new SlashCommandBuilder()
    .setName('proof')
    .setDescription('Publica un comprobante en el canal de vouches')
    .addStringOption(o =>
      o.setName('producto').setDescription('Nombre del producto').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('duracion').setDescription('Duración')
        .addChoices(
          { name: 'Lifetime', value: 'Lifetime' },
          { name: 'Monthly',  value: 'Monthly'  },
          { name: 'Weekly',   value: 'Weekly'   },
          { name: 'Daily',    value: 'Daily'    },
        )
        .setRequired(true)
    )
    .addUserOption(o =>
      o.setName('comprador').setDescription('Usuario comprador (opcional)')
    )
    .addAttachmentOption(o =>
      o.setName('imagen').setDescription('Foto del comprobante').setRequired(true)
    )
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


