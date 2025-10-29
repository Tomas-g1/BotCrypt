const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const ROLE_ID = '1413720897654886441';
const VIDEO_URL = 'https://www.youtube.com/watch?v=JiCMi4Pmx8g';
const DOWNLOAD_URL = 'https://gofile.io/d/J2JTHc';
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
  } catch { return null; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('guía visual y descarga de Crypt External'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: '❌ Solo en servidores.', flags: 64 });
      return;
    }

    const member = interaction.member;
    if (!member.roles?.cache?.has(ROLE_ID)) {
      await interaction.reply({ content: '⛔ No tenés permisos.', flags: 64 });
      return;
    }

    const channel = interaction.channel;
    const me = interaction.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionFlagsBits.ManageWebhooks)) {
      await interaction.reply({
        content: '❌ Falta **Manage Webhooks** en este canal.',
        flags: 64,
      });
      return;
    }

    await interaction.deferReply({ flags: 64 });

    const description =
`🔧 **Guía visual – Instalación de Crypt External**
Mira el video paso a paso 👉 ${VIDEO_URL}
**Descarga Crypt External💥**👇
${DOWNLOAD_URL}`;

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

    try {
      let webhook = null;
      const hooks = await channel.fetchWebhooks();
      webhook = hooks.find(h => h.name === WEBHOOK_NAME) ?? null;

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

      await interaction.editReply('✅');
      return;
    } catch (err) {
      console.error('Error cryptinstall:', err);
      await interaction.editReply('❌ Ocurrió un error al publicar.');
      return;
    }
  },
};
