const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');

const ROLE_ID = '1413720897654886441';
const VIDEO_URL = 'https://www.youtube.com/watch?v=JiCMi4Pmx8g';
const DOWNLOAD_URL = 'https://gofile.io/d/8vU96G';
const AVATAR_URL = 'https://media.discordapp.net/attachments/1414002544711307264/1414091477751038074/SCRYT_IMAGE.png?ex=69038590&is=69023410&hm=453e39a8585f178f4e4a330b7d13de9c0fc48d30c578adf7bc18806597a9eb25&=&format=webp&quality=lossless&width=856&height=856';
const WEBHOOK_NAME = 'Crypt External (auto)';

// -------- util --------
function getYouTubeThumb(url) {
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.searchParams.has('v')) id = u.searchParams.get('v');
    else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  } catch { return null; }
}

// Defer seguro: evita crash si el token ya expiró (10062)
async function safeDefer(i) {
  try {
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    return true;
  } catch (e) {
    if (e?.code === 10062) return false; // interacción vencida por cold start/restart
    throw e;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('Guía visual y descarga de Crypt External'),

  async execute(i) {
    try {
      // Ignora interacciones muy viejas (cuando el bot despierta)
      if (Date.now() - i.createdTimestamp > 14000) return;

      // Defer inmediato
      const ok = await safeDefer(i);
      if (!ok) return; // no intentes responder

      // Validaciones después del defer. Responder SIEMPRE con editReply.
      if (!i.inGuild())
        return await i.editReply('❌ Solo en servidores.');

      if (!i.member.roles?.cache?.has(ROLE_ID))
        return await i.editReply('⛔ No tenés permisos.');

      const me = i.guild.members.me;
      const perms = i.channel.permissionsFor(me);
      if (!perms?.has(PermissionFlagsBits.ManageWebhooks))
        return await i.editReply('❌ Falta **Manage Webhooks** en este canal.');

      // Contenido principal
      const description =
`🔧 **Guía visual – Instalación de Crypt External**
Mirá el video paso a paso 👉 [Ver video en YouTube](${VIDEO_URL})

**Descargá Crypt External 💥👇**
[Haz clic aquí para descargar](${DOWNLOAD_URL})`;

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('🎬 Ver video').setURL(VIDEO_URL),
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('⬇️ Descargar Crypt External').setURL(DOWNLOAD_URL),
      );

      const embed = new EmbedBuilder()
        .setTitle('Crypt External – Instalación')
        .setURL(VIDEO_URL)
        .setDescription(description)
        .setColor(0x00B084)
        .setImage(getYouTubeThumb(VIDEO_URL) ?? null)
        .setTimestamp();

      // Webhook
      const hooks = await i.channel.fetchWebhooks();
      let webhook = hooks.find(h => h.name === WEBHOOK_NAME) ?? null;
      if (!webhook) {
        webhook = await i.channel.createWebhook({
          name: WEBHOOK_NAME,
          avatar: AVATAR_URL,
          reason: 'Publicación de guía Crypt External',
        });
      }

      await webhook.send({
        embeds: [embed],
        components: [buttons],
        username: 'Crypt External',
        avatarURL: AVATAR_URL,
      });

      await i.editReply('✅ Instalación publicada correctamente.');
    } catch (err) {
      console.error('Error cryptinstall:', err);
      if (i.deferred && !i.replied) {
        await i.editReply('❌ Ocurrió un error al publicar.').catch(() => {});
      }
    }
  },
};
