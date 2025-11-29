require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('BotCrypt activo'));
app.get('/health', (_req, res) => res.status(200).send('ok'));
app.listen(PORT, () => console.log(`🌍 Servidor web escuchando en puerto ${PORT}`));

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

client.invitesCache = new Map(); // guildId -> Map(code -> uses)

const STAR = '★', EMPTY = '☆';

/* ========= BASE DE DATOS E INVITES ========= */

const MIN_VALID           = 2;                          
const ACCOUNT_MIN_AGE_MS  = 7  * 24 * 60 * 60 * 1000;   // 7 días
const STAY_MIN_MS         = 72 * 60 * 60 * 1000;        // 72 horas

const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'invites.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');
}
function loadDB() {
  ensureData();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}
function saveDB(db) {
  ensureData();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Estructura DB: history es el registro permanente
function gref(db, gid) {
  db[gid] ??= { 
    event: { startedAt:0, active:false }, 
    users: {}, 
    pending: {}, 
    invites: {},
    history: {} 
  };
  return db[gid];
}

function getTop(g, limit = 10) {
  return Object.entries(g.users)
    .map(([uid, obj]) => ({ userId: uid, valid: obj.validInvites | 0 }))
    .sort((a, b) => b.valid - a.valid)
    .slice(0, limit);
}

/* ========= READY ========= */

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
  
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
    } catch (e) {
      console.log(`⚠️  Sin permisos de invite en: ${guild.name}`);
    }
  }
});

/* ========= EVENTOS DE INVITES (Core) ========= */

// 1. Crear Invite
client.on(Events.InviteCreate, (inv) => {
  const gid = inv.guild.id;require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Rutas HTTP básicas (para health-check)
app.get('/', (_req, res) => res.send('BotCrypt activo'));
app.get('/health', (_req, res) => res.status(200).send('ok'));
app.listen(PORT, () => console.log(`🌍 Servidor web escuchando en puerto ${PORT}`));

const {
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, PermissionsBitField, Events, Collection
} = require('discord.js');

const fs   = require('fs');
const path = require('path');

/* ========= CLIENT ========= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.invitesCache = new Map(); // guildId -> Map(code -> uses)

/* ========= CONFIG INVITES / DB ========= */

const MIN_VALID           = 2;                           // mínimo para sorteo auto
const ACCOUNT_MIN_AGE_MS  = 7  * 24 * 60 * 60 * 1000;   // 7 días
const STAY_MIN_MS         = 72 * 60 * 60 * 1000;        // 72 horas

const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'invites.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');
}

function loadDB() {
  ensureData();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveDB(db) {
  ensureData();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Estructura por servidor:
// {
//   [guildId]: {
//     event:   { startedAt, active },
//     users:   { [inviterId]: { validInvites } },
//     pending: { [memberId]: { inviterId, joinAt } },
//     invites: { [code]: { uses, inviterId } },
//     history: { [memberId]: { inviterId, joinDate, code } }
//   }
// }
function gref(db, gid) {
  if (!db[gid]) {
    db[gid] = {
      event:   { startedAt: 0, active: false },
      users:   {},
      pending: {},
      invites: {},
      history: {}
    };
  } else {
    db[gid].event   ??= { startedAt: 0, active: false };
    db[gid].users   ??= {};
    db[gid].pending ??= {};
    db[gid].invites ??= {};
    db[gid].history ??= {};
  }
  return db[gid];
}

function getTop(g, limit = 10) {
  return Object.entries(g.users)
    .map(([uid, obj]) => ({ userId: uid, valid: obj.validInvites || 0 }))
    .sort((a, b) => b.valid - a.valid)
    .slice(0, limit);
}

/* ========= READY ========= */

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);

  const db = loadDB();

  for (const [gid, guild] of client.guilds.cache) {
    try {
      const invites = await guild.invites.fetch();
      const map = new Map();
      const g = gref(db, gid);

      invites.forEach(inv => {
        map.set(inv.code, inv.uses ?? 0);
        g.invites[inv.code] = {
          uses: inv.uses ?? 0,
          inviterId: inv.inviter?.id ?? null
        };
      });

      client.invitesCache.set(gid, map);
    } catch (e) {
      console.log(`⚠️  Sin permisos de invites en: ${guild.name}`);
    }
  }

  saveDB(db);
});

/* ========= EVENTOS DE INVITES ========= */

// Cuando se crea una invite nueva
client.on(Events.InviteCreate, (inv) => {
  const gid = inv.guild.id;
  const cache = client.invitesCache.get(gid) ?? new Map();
  cache.set(inv.code, inv.uses ?? 0);
  client.invitesCache.set(gid, cache);

  const db = loadDB();
  const g = gref(db, gid);
  g.invites[inv.code] = {
    uses: inv.uses ?? 0,
    inviterId: inv.inviter?.id ?? null
  };
  saveDB(db);
});

// Cuando entra alguien
client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;

  const gid = member.guild.id;
  const now = Date.now();
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
        usedCode  = code;
        inviterId = fetched.get(code)?.inviter?.id;
        break;
      }
    }

    client.invitesCache.set(gid, after);
  } catch {
    // nada
  }

  const db = loadDB();
  const g  = gref(db, gid);

  if (usedCode && !inviterId) {
    inviterId = g.invites[usedCode]?.inviterId ?? null;
  }

  // Registro histórico permanente: se guarda solo una vez
  if (inviterId) {
    if (!g.history[member.id]) {
      g.history[member.id] = {
        inviterId,
        joinDate: now,
        code: usedCode
      };
    }
  }

  saveDB(db);

  // Lógica del evento (torneo)
  if (!inviterId) return;
  if (!oldEnough) return;

  g.pending[member.id] = { inviterId, joinAt: now };
  g.users[inviterId] ??= { validInvites: 0 };
  g.users[inviterId].validInvites += 1;

  saveDB(db);
});

// Cuando se va alguien
client.on(Events.GuildMemberRemove, (member) => {
  if (member.user.bot) return;

  const gid = member.guild.id;
  const now = Date.now();
  const db  = loadDB();
  const g   = gref(db, gid);

  const pend = g.pending[member.id];

  if (pend) {
    // Si se fue antes de las 72h, se le resta
    if (now - pend.joinAt < STAY_MIN_MS) {
      const inviterId = pend.inviterId;
      if (inviterId && g.users[inviterId]) {
        g.users[inviterId].validInvites =
          Math.max(0, (g.users[inviterId].validInvites || 0) - 1);
      }
    }
    delete g.pending[member.id];
  }

  // NO borramos g.history[member.id]; queda registro por si vuelve
  saveDB(db);
});

/* ========= COMMAND HANDLER ========= */

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
    }
  }
}

/* ========= INTERACTIONS ========= */

client.on(Events.InteractionCreate, async (i) => {

  /* --- COMANDOS SLASH --- */
  if (i.isChatInputCommand()) {

    // /who-invited  (histórico permanente, respuesta privada)
    if (i.commandName === 'who-invited') {
      try {
        const target = i.options.getUser('usuario') || i.user;

        const db = loadDB();
        const g  = gref(db, i.guildId);
        const record = g.history[target.id];

        if (!record) {
          return i.reply({
            content: `🔍 No tengo registro histórico de quién invitó a **${target.tag}**.`,
            ephemeral: true
          });
        }

        const dateStr = new Date(record.joinDate).toLocaleDateString('es-AR');

        return i.reply({
          content:
            `📂 **Registro Histórico de Invitación**\n` +
            `👤 Usuario: <@${target.id}>\n` +
            `📩 Invitado originalmente por: <@${record.inviterId}>\n` +
            `📅 Fecha primer ingreso: ${dateStr}\n` +
            `🎫 Código usado: \`${record.code || '?'}\``,
          ephemeral: true
        });
      } catch (err) {
        console.error('Error en /who-invited:', err);
        return i.reply({
          content: '❌ Ocurrió un error al consultar el historial.',
          ephemeral: true
        }).catch(() => {});
      }
    }

    // /start-invite-event
    if (i.commandName === 'start-invite-event') {
      if (!i.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
        return i.reply({ content: 'Solo administradores.', ephemeral: true });
      }

      const db = loadDB();
      const g  = gref(db, i.guildId);

      g.event = { startedAt: Date.now(), active: true };
      g.users   = {};
      g.pending = {};

      try {
        const invs = await i.guild.invites.fetch();
        const map = new Map();
        invs.forEach(inv => {
          map.set(inv.code, inv.uses ?? 0);
          g.invites[inv.code] = {
            uses: inv.uses ?? 0,
            inviterId: inv.inviter?.id ?? null
          };
        });
        client.invitesCache.set(i.guildId, map);
      } catch {}

      saveDB(db);
      return i.reply({
        content: '🚀 **Evento de invitaciones iniciado.** Puntajes reiniciados, historial permanente intacto.',
        ephemeral: true
      });
    }

    // /invite-leaderboard
    if (i.commandName === 'invite-leaderboard') {
      const db = loadDB();
      const g  = gref(db, i.guildId);
      const top = getTop(g, 10);

      if (top.length === 0) {
        return i.reply({
          content: '📉 No hay puntos válidos en el evento actual.',
          ephemeral: true
        });
      }

      const desc = top
        .map((r, idx) => `**#${idx + 1}** <@${r.userId}> — \`${r.valid}\` invitaciones válidas`)
        .join('\n') +
        `\n\n⚠ *Requisito: cuenta >7 días y permanencia >72hs.*`;

      const embed = new EmbedBuilder()
        .setTitle('🏆 Tabla de Clasificación — Evento de Invitaciones')
        .setDescription(desc)
        .setColor(0xFFD700);

      return i.reply({ embeds: [embed] });
    }

    // /end-invite-event
    if (i.commandName === 'end-invite-event') {
      if (!i.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
        return i.reply({ content: 'Solo administradores.', ephemeral: true });
      }

      const auto = i.options.getBoolean('auto') ?? true;
      const db   = loadDB();
      const g    = gref(db, i.guildId);
      const top  = getTop(g, 15);

      if (top.length === 0) {
        g.event.active = false;
        saveDB(db);
        return i.reply('Evento finalizado. Nadie sumó puntos válidos.');
      }

      const elegibles = top.filter(x => x.valid >= MIN_VALID);
      let msg = `🛑 **EVENTO FINALIZADO**\n\n**Ranking:**\n` +
        top.map((r, idx) => `#${idx + 1} <@${r.userId}>: ${r.valid} válidas`).join('\n');

      if (elegibles.length > 0 && auto) {
        const tickets = [];
        elegibles.forEach(r => {
          for (let k = 0; k < r.valid; k++) tickets.push(r.userId);
        });
        const winnerId = tickets[Math.floor(Math.random() * tickets.length)];
        msg += `\n\n🎉 **GANADOR DEL SORTEO:** <@${winnerId}>`;
      }

      g.event.active = false;
      saveDB(db);
      return i.reply(msg);
    }

    // /review (sistema de reseñas)
    if (i.commandName === 'review') {
      const staff   = i.options.getUser('staff', true);
      const cliente = i.options.getUser('cliente', false);
      const titulo  = i.options.getString('titulo') ?? 'Calificá tu experiencia';

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`openreview:${staff.id}:${cliente?.id ?? 'any'}:${titulo}`)
          .setLabel('⭐ Dejar reseña')
          .setStyle(ButtonStyle.Primary)
      );

      return i.reply({
        content: `**${titulo}**\nValora tu experiencia con <@${staff.id}>.`,
        components: [row]
      });
    }

    // Comandos externos (cping, cryptinstall, proof, etc.)
    const cmd = client.commands.get(i.commandName);
    if (cmd) {
      try {
        await cmd.execute(i);
      } catch (e) {
        console.error(`Error ejecutando comando ${i.commandName}:`, e);
        if (!i.replied && !i.deferred) {
          await i.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true }).catch(() => {});
        }
      }
    }
  }

  /* --- INTERACCIONES DE REVIEW (Botones y Modales) --- */

  // Botón para abrir modal de reseña
  if (i.isButton() && i.customId.startsWith('openreview:')) {
    const [, staffId, clienteId, titulo] = i.customId.split(':');

    if (clienteId !== 'any' && i.user.id !== clienteId) {
      return i.reply({
        content: 'Este botón no es para vos.',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`submitreview:${staffId}:${clienteId}:${titulo}`)
      .setTitle('Reseña');

    const p1 = new TextInputBuilder()
      .setCustomId('puntaje')
      .setLabel('Puntaje (1-5)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p2 = new TextInputBuilder()
      .setCustomId('texto')
      .setLabel('Comentario')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(p1),
      new ActionRowBuilder().addComponents(p2)
    );

    return i.showModal(modal);
  }

  // Envío de la reseña
  if (i.isModalSubmit() && i.customId.startsWith('submitreview:')) {
    const [, staffId, , titulo] = i.customId.split(':');

    const ptsStr = i.fields.getTextInputValue('puntaje');
    const txt    = i.fields.getTextInputValue('texto') || 'Sin comentario';

    const pts = parseInt(ptsStr, 10);
    if (isNaN(pts) || pts < 1 || pts > 5) {
      return i.reply({
        content: 'Puntaje inválido. Debe ser un número entre 1 y 5.',
        ephemeral: true
      });
    }

    const stars = '⭐'.repeat(pts);
    const embed = new EmbedBuilder()
      .setTitle('Nueva Reseña: ' + titulo)
      .addFields(
        { name: 'Cliente',   value: `<@${i.user.id}>`,  inline: true },
        { name: 'Staff',     value: `<@${staffId}>`,    inline: true },
        { name: 'Puntaje',   value: `${stars} (${pts}/5)`, inline: false },
        { name: 'Comentario', value: txt,               inline: false },
      )
      .setColor(0x00FF00)
      .setTimestamp();

    const ch = i.guild.channels.cache.get(process.env.REVIEWS_CHANNEL_ID);
    if (ch) {
      await ch.send({ embeds: [embed] });
    }

    return i.reply({
      content: '✅ Reseña enviada.',
      ephemeral: true
    });
  }
});

/* ========= LOGIN ========= */

const BOT_TOKEN = process.env.DISCORD_TOKEN?.trim();
if (!BOT_TOKEN) {
  console.error('❌ Falta DISCORD_TOKEN en variables de entorno.');
  process.exit(1);
}

client.login(BOT_TOKEN).catch(err => {
  console.error('Error de login:', err);
});

