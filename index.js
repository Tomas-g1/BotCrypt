require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('BotCrypt activo'));
// 🔹 Health-check para UptimeRobot y Render
app.get('/health', (_req, res) => res.status(200).send('ok'));
app.listen(PORT, () => console.log(`Servidor web escuchando en puerto ${PORT}`));

const {
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, PermissionsBitField, Events, Collection, MessageFlags
} = require('discord.js');

const fs   = require('fs');
const path = require('path');
/* ========= CLIENT ========= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});
// cache de usos de invites para detectar cuál subió
client.invitesCache = new Map(); // guildId -> Map(code -> uses)

const STAR = '★', EMPTY = '☆';

/* ========= CONFIG E INVITES: helpers en disco ========= */

const MIN_VALID           = 2;                          // mínimo para ser elegible
const ACCOUNT_MIN_AGE_MS  = 7  * 24 * 60 * 60 * 1000;   // >7 días
const STAY_MIN_MS         = 72 * 60 * 60 * 1000;        // >72 horas

const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'invites.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');
}
function loadDB() {
  ensureData();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveDB(db) {
  ensureData();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
function gref(db, gid) {
  db[gid] ??= { event:{ startedAt:0, active:false }, users:{}, pending:{}, invites:{} };
  return db[gid];
}
function getTop(g, limit = 10) {
  return Object.entries(g.users)
    .map(([uid, obj]) => ({ userId: uid, valid: obj.validInvites | 0 }))
    .sort((a, b) => b.valid - a.valid)
    .slice(0, limit);
}




/* ========= READY ========= */

client.once(Events.ClientReady, () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

// Al iniciar: cachear invites y guardar inviter por código
client.once(Events.ClientReady, async () => {
  for (const [gid, guild] of client.guilds.cache) {
    try {
      const invites = await guild.invites.fetch();
      const map = new Map();
      const db = loadDB(); const g = gref(db, gid);

      invites.forEach(inv => {
        map.set(inv.code, inv.uses ?? 0);
        g.invites[inv.code] = { uses: inv.uses ?? 0, inviterId: inv.inviter?.id ?? null };
      });

      client.invitesCache.set(gid, map);
      saveDB(db);
    } catch {
      // falta permiso para ver invites → ignorar
    }
  }
});

/* ========= EVENTOS DE INVITES ========= */

// Cuando crean una invite nueva
client.on(Events.InviteCreate, (inv) => {
  const gid = inv.guild.id;
  const cache = client.invitesCache.get(gid) ?? new Map();
  cache.set(inv.code, inv.uses ?? 0);
  client.invitesCache.set(gid, cache);

  const db = loadDB(); const g = gref(db, gid);
  g.invites[inv.code] = { uses: inv.uses ?? 0, inviterId: inv.inviter?.id ?? null };
  saveDB(db);
});

// Cuando entra alguien: detectar la invite usada y aplicar filtros
client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;

  const gid       = member.guild.id;
  const now       = Date.now();
  const oldEnough = (now - member.user.createdTimestamp) >= ACCOUNT_MIN_AGE_MS;

  let usedCode = null;
  let inviterId = null;

  try {
    const fetched = await member.guild.invites.fetch();
    const before  = client.invitesCache.get(gid) ?? new Map();
    const after   = new Map();

    fetched.forEach(i => after.set(i.code, i.uses ?? 0));

    for (const [code, usesAfter] of after) {
      const usesBefore = before.get(code) ?? 0;
      if (usesAfter > usesBefore) {
        usedCode = code;
        break;
      }
    }

    client.invitesCache.set(gid, after);

    if (usedCode) {
      const db = loadDB(); const g = gref(db, gid);
      inviterId = g.invites[usedCode]?.inviterId ?? null;
      saveDB(db);
    }
  } catch {
    // si falla el fetch, no contamos nada
  }

  if (!usedCode || !inviterId) return;
  if (!oldEnough) return; // cuenta muy nueva → no suma

  const db = loadDB(); const g = gref(db, gid);

  g.pending[member.id] = { inviterId, joinAt: now };   // para posible resta
  g.users[inviterId] ??= { validInvites: 0 };
  g.users[inviterId].validInvites += 1;                 // suma provisional

  saveDB(db);
});

// Si se va antes de 72h, restar
client.on(Events.GuildMemberRemove, (member) => {
  if (member.user.bot) return;

  const gid = member.guild.id;
  const now = Date.now();

  const db = loadDB(); const g = gref(db, gid);
  const pend = g.pending[member.id];
  if (!pend) return;

  if (now - pend.joinAt < STAY_MIN_MS) {
    const inviterId = pend.inviterId;
    if (inviterId && g.users[inviterId]) {
      g.users[inviterId].validInvites =
        Math.max(0, (g.users[inviterId].validInvites || 0) - 1);
    }
  }

  delete g.pending[member.id];
  saveDB(db);
});

/* ========= /review y /cping ========= */

client.on(Events.InteractionCreate, async (i) => {
  // /review
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
      `Queremos tu opinión. Tocá el botón para valorar 1–5 y dejar un comentario.\n` +
      `Soporte de: **${staff.username}**`;

    await i.reply({ content: texto, components: [row] });
    return;
  }

  // /cping
  if (i.isChatInputCommand() && i.commandName === 'cping') {
    const ws = Math.round(client.ws.ping);
    return i.reply({ content: `🏓 Pong ${ws} ms` });
  }

  // abrir modal de review
  if (i.isButton() && i.customId.startsWith('openreview:')) {
    const [, staffId, clienteId, titulo] = i.customId.split(':');
    if (clienteId !== 'any' && i.user.id !== clienteId)
      return i.reply({ content: 'Este panel no es para vos.', flags: MessageFlags.Ephemeral });

    const modal = new ModalBuilder()
      .setCustomId(`submitreview:${staffId}:${clienteId}:${titulo}`)
      .setTitle('📝 Comentario breve');

    const puntaje = new TextInputBuilder()
      .setCustomId('puntaje')
      .setLabel('Puntaje (1–5)')
      .setPlaceholder('1-5')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const comentario = new TextInputBuilder()
      .setCustomId('texto')
      .setLabel('¿Qué te pareció la atención?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(300)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(puntaje),
      new ActionRowBuilder().addComponents(comentario)
    );

    return i.showModal(modal);
  }

  // enviar reseña
  if (i.isModalSubmit() && i.customId.startsWith('submitreview:')) {
    const [, staffId, clienteId, titulo] = i.customId.split(':');
    if (clienteId !== 'any' && i.user.id !== clienteId)
      return i.reply({ content: 'No autorizado.', flags: MessageFlags.Ephemeral });

    const n = parseInt(i.fields.getTextInputValue('puntaje'), 10);
    if (!Number.isInteger(n) || n < 1 || n > 5)
      return i.reply({ content: 'Puntaje inválido. Usá 1–5.', flags: MessageFlags.Ephemeral });

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
      .setColor(0x00A3FF)
      .setTimestamp();

    const ch = i.guild.channels.cache.get(process.env.REVIEWS_CHANNEL_ID);
    if (!ch || !ch.permissionsFor(i.guild.members.me).has(PermissionsBitField.Flags.SendMessages))
      return i.reply({ content: 'Sin permisos en el canal de reseñas.', flags: MessageFlags.Ephemeral });

    await ch.send({ embeds: [embed] });
    return i.reply({ content: '✅ Reseña enviada.', flags: MessageFlags.Ephemeral });
  }
});

/* ========= Loader de ./commands (proof, cryptinstall, etc.) ========= */

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
    if (i.deferred && !i.replied)
      await i.editReply({ content: 'Error.' }).catch(() => {});
    else if (!i.replied)
      await i.reply({ content: 'Error.', flags: MessageFlags.Ephemeral }).catch(() => {});
  }
});

/* ========= Slash del evento de invitaciones ========= */

client.on(Events.InteractionCreate, async (i) => {
  if (!i.isChatInputCommand()) return;

  // /start-invite-event
  if (i.commandName === 'start-invite-event') {
    if (!i.memberPermissions.has(PermissionsBitField.Flags.Administrator))
      return i.reply({ content: 'Solo administradores.', flags: MessageFlags.Ephemeral });

    const db = loadDB(); const g = gref(db, i.guildId);
    g.event   = { startedAt: Date.now(), active: true };
    g.users   = {};
    g.pending = {};

    // refrescar invites existentes
    try {
      const invs = await i.guild.invites.fetch();
      const map = new Map();
      invs.forEach(inv => {
        map.set(inv.code, inv.uses ?? 0);
        g.invites[inv.code] = { uses: inv.uses ?? 0, inviterId: inv.inviter?.id ?? null };
      });
      client.invitesCache.set(i.guildId, map);
    } catch {}

    saveDB(db);
    return i.reply({ content: 'Evento iniciado y contadores en 0.', flags: MessageFlags.Ephemeral });
  }

  // /invite-leaderboard
  if (i.commandName === 'invite-leaderboard') {
    const db = loadDB(); const g = gref(db, i.guildId);
    const top = getTop(g, 10);

    if (top.length === 0)
      return i.reply({ content: 'No hay invitaciones válidas aún.', flags: MessageFlags.Ephemeral });

    const txt = top
      .map((r, idx) => `#${idx + 1} <@${r.userId}> — **${r.valid}**`)
      .join('\n')
      + `\n\nRequisito para ganar: **${MIN_VALID}** invitaciones válidas.`;

    return i.reply({ content: txt });
  }

  // /end-invite-event
  if (i.commandName === 'end-invite-event') {
    const auto = i.options.getBoolean('auto') ?? true;

    const db = loadDB(); const g = gref(db, i.guildId);
    const top = getTop(g, 10);

    if (top.length === 0) {
      g.event.active = false; saveDB(db);
      return i.reply('Evento finalizado. No hubo invitaciones.');
    }

    const elegibles = top.filter(x => x.valid >= MIN_VALID);

    let msg = `**Ranking final (TOP 10)**\n` +
      top.map((r, idx) => `#${idx + 1} <@${r.userId}> — **${r.valid}**`).join('\n');

    if (elegibles.length === 0) {
      msg += `\n\nNadie alcanzó **${MIN_VALID}** invitaciones válidas.`;
      g.event.active = false; saveDB(db);
      return i.reply(msg);
    }

    if (auto) {
      const ganador = elegibles[0];
      msg += `\n\n🏆 **Ganador automático:** <@${ganador.userId}>`;
    } else {
      msg += `\n\nModo manual: elegí ganador entre los elegibles (>= ${MIN_VALID}).`;
    }

    g.event.active = false; saveDB(db);
    return i.reply(msg);
  }
});

/* ========= Login ========= */

const BOT_TOKEN = process.env.DISCORD_TOKEN?.trim();
if (!BOT_TOKEN) {
  console.error('Falta DISCORD_TOKEN en variables de entorno.');
  process.exit(1);
}

client.login(BOT_TOKEN).catch(err => {
  console.error('Error de login:', err);
  process.exit(1);
});






