require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  // --- NUEVO COMANDO ---
  new SlashCommandBuilder()
    .setName('who-invited')
    .setDescription('Muestra quién invitó a un usuario (Registro histórico permanente)')
    .addUserOption(o => 
        o.setName('usuario')
         .setDescription('Usuario a consultar (déjalo vacío para ver el tuyo)')
         .setRequired(false)
    ),
  
  // --- EVENTOS ---
  new SlashCommandBuilder()
    .setName('start-invite-event')
    .setDescription('Inicia el evento de invitaciones (Reinicia puntajes, mantiene historial)'),

  new SlashCommandBuilder()
    .setName('invite-leaderboard')
    .setDescription('Muestra el TOP de invitaciones válidas del evento actual'),

  new SlashCommandBuilder()
    .setName('end-invite-event')
    .setDescription('Finaliza el evento')
    .addBooleanOption(o =>
      o.setName('auto')
       .setDescription('Elegir ganador automático (por defecto sí)')
       .setRequired(false)
    ),

  // --- REVIEW ---
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('Solicitar reseña en este ticket')
    .addUserOption(o => o.setName('staff').setDescription('Quién atendió').setRequired(true))
    .addUserOption(o => o.setName('cliente').setDescription('Cliente').setRequired(false))
    .addStringOption(o => o.setName('titulo').setDescription('Título').setRequired(false)),

  // --- UTILS ---
  new SlashCommandBuilder().setName('cping').setDescription('Ping del bot'),

  // --- OTROS COMANDOS (Si tienes handlers en /commands) ---
  new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('Publica guía de Crypt External'),
    
  new SlashCommandBuilder()
    .setName('proof')
    .setDescription('Publica un comprobante')
    .addStringOption(o => o.setName('producto').setDescription('Nombre').setRequired(true))
    .addStringOption(o => o.setName('duracion').setDescription('Duración').addChoices({name:'L',value:'Lifetime'},{name:'M',value:'Monthly'}).setRequired(true))
    .addAttachmentOption(o => o.setName('imagen').setDescription('Foto').setRequired(true))
    .addStringOption(o => o.setName('comprador_texto').setDescription('Texto opcional'))
    .addUserOption(o => o.setName('comprador').setDescription('Tag opcional')),

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Comandos registrados con éxito.');
  } catch (e) {
    console.error('Error registrando comandos:', e);
  }
})();
  // /review
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

  // /cping
  new SlashCommandBuilder()
    .setName('cping')
    .setDescription('Ping del bot'),

  // /cryptinstall
  new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('Publica la guía visual y descarga de Crypt External en ESTE canal'),

  // /proof
  new SlashCommandBuilder()
    .setName('proof')
    .setDescription('Publica un comprobante en el canal de vouches')
    // requeridos
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
    // opcionales
    .addStringOption(o =>
      o.setName('comprador_texto')
       .setDescription('Texto del comprador. Escribí "Anon" si no quiere mostrarse')
    )
    .addUserOption(o =>
      o.setName('comprador')
       .setDescription('Usuario comprador (opcional)')
    ),

  // /start-invite-event
  new SlashCommandBuilder()
    .setName('start-invite-event')
    .setDescription('Inicia el evento de invitaciones válidas'),

  // /invite-leaderboard
  new SlashCommandBuilder()
    .setName('invite-leaderboard')
    .setDescription('Muestra el TOP de invitaciones válidas'),

  // /end-invite-event
  new SlashCommandBuilder()
    .setName('end-invite-event')
    .setDescription('Finaliza el evento de invitaciones')
    .addBooleanOption(o =>
      o.setName('auto')
       .setDescription('Elegir ganador automático (por defecto sí)')
       .setRequired(false)
    ),

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




