const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('proof')
    .setDescription('Publica un comprobante en el canal de vouches')
    .addStringOption(o => o.setName('producto').setDescription('Nombre del producto').setRequired(true))
    .addStringOption(o => o.setName('duracion').setDescription('Duración')
      .addChoices(
        { name: 'Lifetime', value: 'Lifetime' },
        { name: 'Monthly', value: 'Monthly' },
        { name: 'Weekly', value: 'Weekly' },
        { name: 'Daily', value: 'Daily' },
      ).setRequired(true))
    .addAttachmentOption(o => o.setName('imagen').setDescription('Captura del comprobante').setRequired(true))
    .addStringOption(o => o.setName('comprador_texto').setDescription('Texto del comprador. Escribí "Anon" si no quiere mostrarse'))
    .addUserOption(o => o.setName('comprador').setDescription('Usuario comprador (opcional)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const producto   = interaction.options.getString('producto', true);
    const duracion   = interaction.options.getString('duracion', true);
    const imagen     = interaction.options.getAttachment('imagen', true);
    const buyerText  = interaction.options.getString('comprador_texto');   // prioridad
    const buyerUser  = interaction.options.getUser('comprador');

    const canal = interaction.client.channels.cache.get(process.env.VOUCHES_CHANNEL_ID);
    if (!canal) return interaction.reply({ content: 'No encuentro el canal de vouches.', ephemeral: true });

    const buyer = buyerText?.trim()
      || (buyerUser ? `<@${buyerUser.id}>` : 'Anon');

    const embed = new EmbedBuilder()
      .setTitle('🧾 Nuevo comprobante recibido')
      .addFields(
        { name: '💼 Producto', value: producto, inline: true },
        { name: '⏳ Duración', value: duracion, inline: true },
        { name: '👤 Comprador', value: buyer, inline: true },
      )
      .setImage(imagen.url)
      .setColor(0x00B084)
      .setFooter({ text: `Enviado por ${interaction.user.tag}` })
      .setTimestamp();

    await canal.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Comprobante enviado.', ephemeral: true });
  }
};

