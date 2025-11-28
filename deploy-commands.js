require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  // --- NUEVO: Historial permanente ---
  new SlashCommandBuilder()
    .setName('who-invited')
    .setDescription('Muestra quién invitó a un usuario (Registro histórico permanente)')
    .addUserOption(o => 
        o.setName('usuario')
         .setDescription('Usuario a consultar (déjalo vacío para ver el tuyo)')
         .setRequired(false)
    ),
  
  // --- EVENTOS DE INVITACIÓN ---
  new SlashCommandBuilder()
    .setName('start-invite-event')
    .setDescription('Inicia el evento (Reinicia puntajes del torneo, pero mantiene el historial histórico)'),

  new SlashCommandBuilder()
    .setName('invite-leaderboard')
    .setDescription('Muestra el TOP de invitaciones válidas del evento actual'),

  new SlashCommandBuilder()
    .setName('end-invite-event')
    .setDescription('Finaliza el evento de invitaciones')
    .addBooleanOption(o =>
      o.setName('auto')
       .setDescription('Elegir ganador automático (por defecto sí)')
       .setRequired(false)
    ),

  // --- REVIEW SYSTEM ---
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('Solicitar reseña en este ticket')
    .addUserOption(o => o.setName('staff').setDescription('Quién atendió').setRequired(true))
    .addUserOption(o => o.setName('cliente').setDescription('Cliente').setRequired(false))
    .addStringOption(o => o.setName('titulo').setDescription('Título del panel').setRequired(false)),

  // --- UTILS ---
  new SlashCommandBuilder()
    .setName('cping')
    .setDescription('Ping del bot'),

  // --- CRYPT INSTALL ---
  new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('Publica la guía visual y descarga de Crypt External en ESTE canal'),
    
  // --- PROOF (VOUCHES) ---
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
         { name: '3 Months', value: '3 Months' }, // <--- AGREGADO
         { name: 'Monthly',  value: 'Monthly'  },
         { name: 'Weekly',   value: 'Weekly'   },
         { name: '3 Days',   value: '3 Days'   },   // <--- AGREGADO
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
       .setDescription('Texto del comprador. Escribí "Anon" si no quiere mostrarse')
    )
    .addUserOption(o =>
      o.setName('comprador')
       .setDescription('Usuario comprador (opcional)')
    ),

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Iniciando actualización de comandos (/) ...');
    
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados exitosamente (Opciones de Proof actualizadas).');
  } catch (e) {
    console.error('❌ Error registrando comandos:', e);
  }
})();

