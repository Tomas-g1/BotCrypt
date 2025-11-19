require('dotenv').config();
const { 
  REST, Routes, SlashCommandBuilder, PermissionFlagsBits 
} = require('discord.js');

const commands = [
  /* ========= /review ========= */
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('Solicitar reseña en este ticket')
    .addUserOption(o =>
      o.setName('staff')
        .setDescription('Quién atendió')
        .setRequired(true)
    )
    .addUserOption(o =>
      o.setName('cliente')
        .setDescription('Cliente que debe responder')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('titulo')
        .setDescription('Título del panel')
        .setRequired(false)
    ),

  /* ========= /cping ========= */
  new SlashCommandBuilder()
    .setName('cping')
    .setDescription('Ping del bot'),

  /* ========= /cryptinstall ========= */
  new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('Publica guía visual y descarga de Crypt External'),

  /* ========= /proof ========= */
  new SlashCommandBuilder()
    .setName('proof')
    .setDescription('Publica un comprobante en el canal de vouches')
    .addStringOption(o =>
      o.setName('producto')
        .setDescription('Nombre del producto')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('duracion')
        .setDescription('Duración')
        .addChoices(
          { name: 'Lifetime', value: 'Lifetime' },
          { name: 'Monthly',  value: 'Monthly'  },
          { name: 'Weekly',   value: 'Weekly'   },
          { name: 'Daily',    value: 'Daily'    },
        )
        .setRequired(true)
    )
    .addAttachmentOption(o =>
      o.setName('imagen')
        .setDescription('Foto del comprobante')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('comprador_texto')
        .setDescription('Texto del comprador — poner "Anon" si no quiere mostrarse')
    )
    .addUserOption(o =>
      o.setName('comprador')
        .setDescription('Usuario comprador (opcional)')
    ),

  /* ========= /start-invite-event ========= */
  new SlashCommandBuilder()
    .setName('start-invite-event')
    .setDescription('Inicia o reinicia el evento de invitaciones')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /* ========= /invite-leaderboard ========= */
  new SlashCommandBuilder()
    .setName('invite-leaderboard')
    .setDescription('Muestra el top 10 de invitaciones válidas'),

  /* ========= /end-invite-event ========= */
  new SlashCommandBuilder()
    .setName('end-invite-event')
    .setDescription('Finaliza el evento de invitaciones')
    .addBooleanOption(o =>
      o.setName('auto')
        .setDescription('Elegir ganador automático (true por defecto)')
        .setRequired(false)
    ),

].map(cmd => cmd.toJSON());

/* ========= Registrar comandos ========= */

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos slash...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados correctamente.');
  } catch (e) {
    console.error('Error registrando comandos:', e);
  }
})();






