'use strict';

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

const config = require('../config');
const { createTicket, getTicket, closeTicket } = require('../dataManager');
const { sendRatingDM } = require('./ratingHandler');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a Modal from a category's modal definition.
 * Custom ID format: ticket_modal_<serverKey>_<categoryId>
 *
 * @param {string} serverKey
 * @param {object} category
 */
function buildModal(serverKey, category) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${serverKey}_${category.id}`)
    .setTitle(category.modal.title);

  const rows = category.modal.fields.map((field) => {
    const input = new TextInputBuilder()
      .setCustomId(field.customId)
      .setLabel(field.label)
      .setStyle(TextInputStyle[field.style])
      .setRequired(field.required ?? true);

    if (field.maxLength) input.setMaxLength(field.maxLength);

    return new ActionRowBuilder().addComponents(input);
  });

  modal.addComponents(rows);
  return modal;
}

/**
 * Sanitises a string for use as a Discord channel name.
 * Converts to lowercase, replaces invalid characters with hyphens, trims to 100 chars.
 */
function toChannelName(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

// ── Public handlers ───────────────────────────────────────────────────────────

/**
 * Shows the ticket-creation modal when a category button is clicked.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} serverKey
 * @param {string} categoryId
 */
async function handleTicketButtonClick(interaction, serverKey, categoryId) {
  const serverConfig = config.servers[serverKey];
  const category = serverConfig?.categories.find((c) => c.id === categoryId);

  if (!serverConfig || !category) {
    return interaction.reply({ content: '❌ Unknown ticket category.', ephemeral: true });
  }

  await interaction.showModal(buildModal(serverKey, category));
}

/**
 * Creates a ticket channel after the modal is submitted.
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {string} serverKey
 * @param {string} categoryId
 */
async function handleTicketModalSubmit(interaction, serverKey, categoryId) {
  const serverConfig = config.servers[serverKey];
  const category = serverConfig?.categories.find((c) => c.id === categoryId);

  if (!serverConfig || !category) {
    return interaction.reply({ content: '❌ Unknown ticket category.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const user = interaction.user;

  // ── Permission overwrites ─────────────────────────────────────────────────
  const overwrites = [
    // Hide channel from everyone by default
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    // Grant access to the ticket opener
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  // Server 1: general support role (all tickets)
  if (serverConfig.generalSupportRoleId) {
    overwrites.push({
      id: serverConfig.generalSupportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  // Server 1: per-category support role
  if (category.supportRoleId) {
    overwrites.push({
      id: category.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  // Server 2: single support role for all tickets
  if (serverConfig.supportRoleId) {
    overwrites.push({
      id: serverConfig.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  // ── Create ticket channel ─────────────────────────────────────────────────
  const channelName = toChannelName(`${category.channelPrefix}-${user.username}`);

  let ticketChannel;
  try {
    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: serverConfig.ticketCategoryId ?? undefined,
      permissionOverwrites: overwrites,
      topic: `Ticket opened by ${user.tag} · Category: ${category.label}`,
    });
  } catch (err) {
    console.error('[Ticket] Failed to create channel:', err);
    return interaction.editReply({ content: '❌ Failed to create your ticket channel. Please contact an administrator.' });
  }

  // ── Persist ticket record ─────────────────────────────────────────────────
  createTicket(ticketChannel.id, user.id, serverConfig.id, categoryId);

  // ── Build the in-channel embed with the user's answers ───────────────────
  const answerFields = category.modal.fields.map((field) => ({
    name: field.label,
    value: interaction.fields.getTextInputValue(field.customId) || '*Not provided*',
  }));

  const ticketEmbed = new EmbedBuilder()
    .setTitle(`${category.emoji}  ${category.label}`)
    .setDescription(`Ticket opened by ${user}`)
    .addFields(answerFields)
    .setColor(serverConfig.embed.color)
    .setTimestamp()
    .setFooter({ text: `Ticket ID: ${ticketChannel.id}` });

  // Close button
  const closeButton = new ButtonBuilder()
    .setCustomId(`close_ticket_${ticketChannel.id}`)
    .setLabel('Close Ticket')
    .setEmoji('🔒')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(closeButton);

  // ── Mention support roles + opener ────────────────────────────────────────
  const mentions = [];
  if (serverConfig.generalSupportRoleId) mentions.push(`<@&${serverConfig.generalSupportRoleId}>`);
  if (category.supportRoleId) mentions.push(`<@&${category.supportRoleId}>`);
  if (serverConfig.supportRoleId) mentions.push(`<@&${serverConfig.supportRoleId}>`);
  mentions.push(`${user}`);

  await ticketChannel.send({
    content: mentions.join(' '),
    embeds: [ticketEmbed],
    components: [row],
  });

  await interaction.editReply({ content: `✅ Your ticket has been created: ${ticketChannel}` });
}

/**
 * Closes a ticket channel, sends the rating DM, then deletes the channel.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} channelId  The ticket channel ID embedded in the button custom ID
 */
async function handleCloseTicket(interaction, channelId) {
  const ticket = getTicket(channelId);

  if (!ticket) {
    return interaction.reply({ content: '❌ This ticket was not found in the database.', ephemeral: true });
  }

  // Acknowledge immediately so we can delete the channel
  await interaction.reply({ content: '🔒 Closing ticket…' });

  // Mark as closed
  closeTicket(channelId);

  // Send satisfaction DM to the ticket opener
  const ticketUser = await interaction.client.users.fetch(ticket.userId).catch(() => null);
  if (ticketUser) {
    await sendRatingDM(ticketUser, channelId, interaction.channel.name);
  }

  // Delete the channel after a short delay so the reply is briefly visible
  setTimeout(async () => {
    await interaction.channel.delete('Ticket closed').catch(() => null);
  }, 3000);
}

module.exports = { handleTicketButtonClick, handleTicketModalSubmit, handleCloseTicket };
