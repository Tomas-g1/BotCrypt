require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('BotCrypt activo'));
app.listen(PORT, () => console.log(`Servidor web escuchando en puerto ${PORT}`));

const {
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, PermissionsBitField, Events, Collection
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const STAR='★', EMPTY='☆';

client.once(Events.ClientReady, () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});


client.on(Events.InteractionCreate, async (i) => {
  if (i.isChatInputCommand() && i.commandName === 'review') {
    const staff   = i.options.getUser('staff', true);
    const cliente = i.options.getUser('cliente', false);
    const titulo  = i.options.getString('titulo') ?? 'Calificá tu experiencia';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`openreview:${staff.id}:${cliente?.id ?? 'any'}:${titulo}`)
        .setLabel('⭐ Dejar reseña')
        .setStyle(ButtonStyle.Primary)
    );

    const texto =
      `**${titulo}**\n` +
      `✨ **¡Queremos tu opinión!** Tocá el botón para valorar **1–5** y dejar un comentario.\n` +
      `🧑‍💼 Soporte de: **${staff.username}**`;

    await i.reply({ content: texto, components: [row] });
    return;
  }

  // /cping
  if (i.isChatInputCommand() && i.commandName === 'cping') {
    const ws = Math.round(client.ws.ping);
    return i.reply({ content: `🏓 Pong ${ws} ms` });
  }

  // Abrir modal
  if (i.isButton() && i.customId.startsWith('openreview:')) {
    const [ , staffId, clienteId, titulo ] = i.customId.split(':');
    if (clienteId !== 'any' && i.user.id !== clienteId)
      return i.reply({ content: 'Este panel no es para vos.', flags: 64 });

    const modal = new ModalBuilder()
      .setCustomId(`submitreview:${staffId}:${clienteId}:${titulo}`)
      .setTitle('📝 Comentario breve');

    const puntaje = new TextInputBuilder()
      .setCustomId('puntaje').setLabel('Puntaje (1–5)')
      .setPlaceholder('1-5').setStyle(TextInputStyle.Short).setRequired(true);

    const comentario = new TextInputBuilder()
      .setCustomId('texto').setLabel('¿Qué te pareció la atención?')
      .setStyle(TextInputStyle.Paragraph).setMaxLength(300).setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(puntaje),
      new ActionRowBuilder().addComponents(comentario)
    );
    return i.showModal(modal);
  }

  // Enviar reseña
  if (i.isModalSubmit() && i.customId.startsWith('submitreview:')) {
    const [ , staffId, clienteId, titulo ] = i.customId.split(':');
    if (clienteId !== 'any' && i.user.id !== clienteId)
      return i.reply({ content: 'No autorizado.', flags: 64 });

    let n = parseInt(i.fields.getTextInputValue('puntaje'), 10);
    if (!Number.isInteger(n) || n < 1 || n > 5)
      return i.reply({ content: 'Puntaje inválido. Usá 1–5.', flags: 64 });

    const texto = i.fields.getTextInputValue('texto')?.trim();
    const estrellas = STAR.repeat(n) + EMPTY.repeat(5 - n);

    const embed = new EmbedBuilder()
      .setTitle('Nueva reseña')
      .setDescription(`**${titulo}**`)
      .addFields(
        { name: 'Puntaje', value: `${estrellas} (${n}/5)`, inline: false },
        { name: 'Cliente', value: `<@${i.user.id}>`, inline: true },
        { name: 'Atendido por', value: `<@${staffId}>`, inline: true },
        ...(texto ? [{ name: 'Comentario', value: texto, inline: false }] : [])
      )
      .setFooter({ text: 'Gracias por tu feedback. Nos ayuda a mejorar.' })
      .setColor(0x00A3FF)
      .setTimestamp();

    const ch = i.guild.channels.cache.get(process.env.REVIEWS_CHANNEL_ID);
    if (!ch || !ch.permissionsFor(i.guild.members.me).has(PermissionsBitField.Flags.SendMessages))
      return i.reply({ content: 'Sin permisos en el canal de reseñas.', flags: 64 });

    await ch.send({ embeds: [embed] });
    return i.reply({ content: '✅ Reseña enviada.', flags: 64 });
  }
});

/**
 * Loader de comandos en ./commands (incluye /cryptinstall, /proof, etc.)
 */
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

client.on(Events.InteractionCreate, async (i) => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(i);
  } catch (e) {
    console.error(e);
    if (!i.deferred && !i.replied) {
      await i.reply({ content: 'Error.', flags: 64 }).catch(() => {});
    } else {
      await i.editReply('Error.').catch(() => {});
    }
  }
});

try {
  if (fs.existsSync(path.join(__dirname, 'deploy-commands.js'))) {
    require('./deploy-commands');
  } else if (fs.existsSync(path.join(__dirname, 'deploy.js'))) {
    require('./deploy.js');
  }
} catch (e) {
  console.warn('No pude auto-registrar comandos:', e.message);
}

const BOT_TOKEN = (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN.trim()) ||
                  (process.env.TOKEN && process.env.TOKEN.trim());
if (!BOT_TOKEN) {
  console.error('❌ Falta DISCORD_TOKEN en variables de entorno.');
  process.exit(1);
}
console.log(`🔎 Token cargado: len=${BOT_TOKEN.length}, prefix=${BOT_TOKEN.slice(0,7)}...`);
client.login(BOT_TOKEN).catch(err => {
  console.error('❌ Error de login:', err);
  process.exit(1);
});
