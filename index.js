require('dotenv').config();

// ============================
// WEB SERVER (UptimeRobot)
// ============================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('BotCrypt activo'));
app.get('/health', (_req, res) => res.status(200).send('ok'));

app.listen(PORT, () => console.log(`🌍 Servidor web escuchando en puerto ${PORT}`));


// ============================
// DISCORD CLIENT
// ============================
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  Collection,
  MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// ======================
// DATABASE: INVITES (Unificada)
// ======================
const INVITES_FILE = path.join(__dirname, 'invitesDB.json');

function loadInvitesDB() {
  try {
    if (fs.existsSync(INVITES_FILE)) {
      const raw = fs.readFileSync(INVITES_FILE, 'utf8');
      if (!raw.trim()) return {};
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error cargando invitesDB:', e);
  }
  return {};
}

function saveInvitesDB(db) {
  try {
    fs.writeFileSync(INVITES_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error guardando invitesDB:', e);
  }
}

function getGuildInvites(db, gid) {
  if (!db[gid]) {
    db[gid] = { users: {} };
  } else {
    db[gid].users ??= {};
  }
  return db[gid];
}

const invitesDB    = loadInvitesDB();   
const invitesCache = new Map();         


// ============================
// CLIENTE DISCORD
// ============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.User, Partials.GuildMember, Partials.Message]
});

client.commands = new Collection();

// ============================
// CARGAR COMANDOS (/commands)
// ============================
const commandsFolder = path.join(__dirname, 'commands');
if (fs.existsSync(commandsFolder)) {
  const files = fs.readdirSync(commandsFolder).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.data.name, cmd);
  }
}

// ======================
// LOGICA DE INVITES
// ======================

// 1. Cache inicial
client.once(Events.ClientReady, async (c) => {
  console.log(`🤖 Bot conectado como ${c.user.tag}`);
  console.log('🔁 Inicializando cache de invitaciones...');

  for (const [guildId, guild] of c.guilds.cache) {
    try {
      const invites = await guild.invites.fetch().catch(() => null);
      if (!invites) continue;
      invitesCache.set(guildId, new Map(invites.map(i => [i.code, i.uses ?? 0])));
    } catch (e) {
      console.error(`Error cargando invites de ${guildId}:`, e);
    }
  }
});

// 2. Detección de entrada (AQUI AGREGAMOS EL LOG)
client.on(Events.GuildMemberAdd, async member => {
  const guildId = member.guild.id;
  const previous = invitesCache.get(guildId) || new Map();
  let usedInvite = null;

  try {
    const newInvites = await member.guild.invites.fetch().catch(() => null);
    if (newInvites) {
      for (const inv of newInvites.values()) {
        const oldUses = previous.get(inv.code) ?? 0;
        const newUses = inv.uses ?? 0;
        if (newUses > oldUses) {
          usedInvite = inv;
          break;
        }
      }
      invitesCache.set(guildId, new Map(newInvites.map(i => [i.code, i.uses ?? 0])));
    }
  } catch (e) {
    console.error('Error chequeando invitaciones:', e);
  }

  const g = getGuildInvites(invitesDB, guildId);
  const inviter   = usedInvite?.inviter ?? null;
  const parentRec = inviter ? g.users[inviter.id] || null : null;
  const now = Date.now();

  const rootInviterId = parentRec
    ? (parentRec.rootInviterId || parentRec.inviterId || inviter?.id || null)
    : (inviter?.id || null);

  const rootCode = parentRec
    ? (parentRec.rootCode || parentRec.code || usedInvite?.code || null)
    : (usedInvite?.code || null);

  g.users[member.id] = {
    inviterId: inviter ? inviter.id : null, 
    code: usedInvite ? usedInvite.code : null,
    joinedAt: now,
    rootInviterId, 
    rootCode
  };

  saveInvitesDB(invitesDB);
  console.log(`✅ Registro guardado: ${member.user.tag} invitado por ${inviter?.tag || 'Desconocido'}`);

  // --- NUEVO: ENVIAR LOG DE ENTRADA CON CADENA ---
  const logChannel = member.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setTitle("📥 Usuario entró al servidor")
      .setColor("Green")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Usuario", value: `${member.user.tag} (<@${member.id}>)`, inline: false },
        { name: "Invitado por", value: inviter ? `<@${inviter.id}>` : "Desconocido/Orgánico", inline: true },
        { name: "Código usado", value: usedInvite ? `\`${usedInvite.code}\`` : "N/A", inline: true },
        // AQUI MOSTRAMOS LA CADENA
        { name: "🌳 Origen de la Cadena", value: rootInviterId ? `<@${rootInviterId}>` : "N/A (Inicio)", inline: false }
      )
      .setFooter({ text: `ID: ${member.id}` })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  }
});

// 3. Salida (Log)
client.on(Events.GuildMemberRemove, async member => {
  const logChannel = member.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
  if (!logChannel) return;

  const g = invitesDB[member.guild.id]?.users ?? {};
  const rec = g[member.id];

  const embed = new EmbedBuilder()
    .setTitle("📤 Usuario salió del servidor")
    .setColor("Red")
    .addFields(
      { name: "Usuario", value: `${member.user.tag} (<@${member.id}>)` },
      { name: "Cuenta creada", value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:R>` }
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  // Si tenemos info de quién lo invitó, lo agregamos al log de salida también
  if (rec && rec.inviterId) {
      embed.addFields({ name: "Había sido invitado por", value: `<@${rec.inviterId}>` });
  }

  logChannel.send({ embeds: [embed] }).catch(() => {});
});

// ======================
// HANDLER DE SLASH COMMANDS
// ======================
client.on(Events.InteractionCreate, async i => {
  if (!i.isChatInputCommand()) return;

  const { commandName } = i;

  // 1) Comando interno who-invited
  if (commandName === 'who-invited') {
    const target = i.options.getUser('usuario') ?? i.user;
    const g   = invitesDB[i.guild.id]?.users ?? null;
    const rec = g ? g[target.id] : null;

    if (!rec || !rec.inviterId) {
      return i.reply({
        content: '🔍 No tengo datos de quién invitó a ese usuario.',
        flags: MessageFlags.Ephemeral
      });
    }

    const direct = rec.inviterId     ? `<@${rec.inviterId}>`       : '`desconocido`';
    const root   = rec.rootInviterId ? `<@${rec.rootInviterId}>`   : '`sin cadena previa`';
    const code   = rec.code          ? `\`${rec.code}\``           : '`?`';
    const rootC  = rec.rootCode      ? `\`${rec.rootCode}\``       : '`?`';

    let desc =
      `👤 **Usuario:** <@${target.id}>\n` +
      `📨 **Invitado por:** ${direct}\n` +
      `🎫 **Código usado:** ${code}\n\n` +
      `🌳 **Origen de la cadena:** ${root}\n` +
      `🔖 **Código origen:** ${rootC}`;

    if (rec.joinedAt) {
      const ts = Math.floor(rec.joinedAt / 1000);
      desc += `\n\n⏱️ **Entró el:** <t:${ts}:F>`;
    }

    return i.reply({
      embeds: [{
        title: '📂 Historial de Invitación',
        description: desc,
        color: 0x00a8ff
      }],
      flags: MessageFlags.Ephemeral
    });
  }

  // 2) Comandos externos (/commands)
  const cmd = client.commands.get(commandName);
  if (!cmd) return;

  try {
    await cmd.execute(i, client);
  } catch (err) {
    console.error('Error ejecutando comando:', err);
    if (!i.replied && !i.deferred) {
      await i.reply({ content: '❌ Error al ejecutar.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

// ============================
// LOGIN
// ============================
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error("❌ Falta DISCORD_TOKEN en .env");
  process.exit(1);
}

client.login(TOKEN).catch(err => {
  console.error("❌ Error de login:", err);
});
