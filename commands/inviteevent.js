const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start-invite-event')
    .setDescription('Inicia un evento de invitaciones (admin).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(o =>
      o.setName('minimo')
        .setDescription('Invitaciones mínimas requeridas (ej: 2)')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('descripcion')
        .setDescription('Descripción del evento')
        .setRequired(false)
    ),

  async execute(interaction) {
    const minimo = interaction.options.getInteger('minimo');
    const descripcion = interaction.options.getString('descripcion') ?? 'Evento de invitaciones iniciado.';

    global.inviteEvent = {
      active: true,
      startedAt: Date.now(),
      minimo,
      descripcion,
      counts: {}
    };

    return interaction.reply({
      content: `✅ **Evento iniciado**\nMínimo requerido: **${minimo} invitaciones válidas**`,
      ephemeral: true
    });
  }
};
