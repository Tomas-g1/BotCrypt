const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

const ROLE_ID = '1413720897654886441';

const VIDEO_URL = 'https://www.youtube.com/watch?v=JiCMi4Pmx8g';
const DOWNLOAD_URL = 'https://gofile.io/d/J2JTHc';
const AVATAR_URL = 'https://media.discordapp.net/attachments/1414002544711307264/1414091477751038074/SCRYT_IMAGE.png?ex=69038590&is=69023410&hm=453e39a8585f178f4e4a330b7d13de9c0fc48d30c578adf7bc18806597a9eb25&=&format=webp&quality=lossless&width=856&height=856';

const WEBHOOK_NAME = 'Crypt External (auto)';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cryptinstall')
    .setDescription('guía visual y descarga de Crypt External'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: '❌ Este comando solo puede usarse en un servidor.', ephemeral: true });
    }

    const member = interaction.member;
    const hasRole = member.roles?.cache?.has(ROLE_ID);
    if (!hasRole) {
      return interaction.reply({ content: '⛔ No tenés permisos para usar este comando.', ephemeral: true });
    }

    const channel = interaction.channel;

    // Chequeo de permiso para manejar webhooks
    const me = interaction.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionFlagsBits.ManageWebhooks)) {
      return interaction.reply({
        content: '❌ Falta permiso **Manage Webhooks**.',
        ephemeral: true,
      });
    }

    const content =
`🔧 Guía visual – Instalación de Crypt External:
Mira el video paso a paso 👉 ${VIDEO_URL}

${DOWNLOAD_URL}`;

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('🎬 Ver video').setURL(VIDEO_URL),
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('⬇️ Descargar').setURL(DOWNLOAD_URL),
    );

    try {
      await interaction.deferReply({ ephemeral: true });

      let webhook = null;
      const hooks = await channel.fetchWebhooks();
      webhook = hooks.find(h => h.name === WEBHOOK_NAME) ?? null;

      if (!webhook) {
        webhook = await channel.createWebhook({
          name: WEBHOOK_NAME,
          avatar: AVATAR_URL, 
          reason: 'guía y descarga Crypt External',
        });
      }

      await webhook.send({
        content,
        components: [buttons],
        username: 'Crypt External', 
        avatarURL: AVATAR_URL,    
      });

      await interaction.editReply('✅.');
    } catch (err) {
      console.error('Error cryptinstall:', err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('❌ Ocurrió un error al publicar.');
      } else {
        await interaction.reply({ content: '❌ Ocurrió un error al publicar.', ephemeral: true });
      }
    }
  },
};
