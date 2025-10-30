const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags
} = require('discord.js');

const ROLE_ID = '1413720897654886441';
const VIDEO_URL = 'https://www.youtube.com/watch?v=JiCMi4Pmx8g';
const DOWNLOAD_URL = 'https://gofile.io/d/8vU96G';
const AVATAR_URL = 'https://media.discordapp.net/attachments/1414002544711307264/1414091477751038074/SCRYT_IMAGE.png?ex=69038590&is=69023410&hm=453e39a8585f178f4e4a330b7d13de9c0fc48d30c578adf7bc18806597a9eb25&=&format=webp&quality=lossless&width=856&height=856';
const WEBHOOK_NAME = 'Crypt External (auto)';

function getYouTubeThumb(url) {
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.searchParams.has('v')) id = u.searchParams.get('v');
    else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  } catch {
    return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('Guía visual y descarga de Crypt External'),

  async execute(i) {
    try {
      // --- Validaciones iniciales ---
      if (!i.inGuild())
        return await i.reply({ content: '❌ Solo en servidores.', flags: MessageFlags.Ephemeral });

      const member = i.member;
      if (!member.roles?.cache?.has(ROLE_ID))
        return await i.reply({ content: '⛔ No tenés permisos.', flags: MessageFlags.Ephemeral });

      const channel = i.channel;
      const me = i.guild.members.me;
      const perms = channel.permissionsFor(me);
      if (!perms?.has(PermissionFlagsBits.ManageWebhooks))
        return await i.reply({ content: '❌ Falta **Manage Webhooks** en este canal.', flags: MessageFlags.Ephemeral });

      // --- defer inmediato para evitar Unknown interaction ---
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      // --- contenido principal ---
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

      // --- envío del webhook ---
      const hooks = await channel.fetchWebhooks();
      let webhook = hooks.find(h => h.name === WEBHOOK_NAME) ?? null;

      if (!webhook) {
        webhook = await channel.createWebhook({
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

      // --- única respuesta permitida ---
      await i.editReply('✅ Instalación publicada correctamente.');
    } catch (err) {
      console.error('Error cryptinstall:', err);
      if (i.deferred && !i.replied)
        await i.editReply('❌ Ocurrió un error al publicar.');
      else if (!i.replied)
        await i.reply({ content: '❌ Error inesperado.', flags: MessageFlags.Ephemeral });
    }
  },
};
