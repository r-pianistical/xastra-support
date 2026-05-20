'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isTicketRated, markTicketRated } = require('../dataManager');

// ── Star emoji helpers ────────────────────────────────────────────────────────

function starsLabel(n) {
  return '⭐'.repeat(n);
}

/**
 * DMs the user a satisfaction survey for the closed ticket.
 * The rating can only be submitted once.
 *
 * @param {import('discord.js').User} user
 * @param {string} ticketChannelId
 * @param {string} channelName  Human-readable name shown in the DM
 */
async function sendRatingDM(user, ticketChannelId, channelName) {
  const embed = new EmbedBuilder()
    .setTitle('🌟  How was your support experience?')
    .setDescription(
      `Your ticket **${channelName}** has been closed.\n\n` +
        "We'd love to hear your feedback! Please rate your experience by clicking one of the stars below.\n" +
        '*You may only submit one rating per ticket.*'
    )
    .setColor(0xfee75c)
    .setTimestamp();

  // Five star buttons in one ActionRow (max 5 components per row)
  const row = new ActionRowBuilder().addComponents(
    ...Array.from({ length: 5 }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`rating_${ticketChannelId}_${i + 1}`)
        .setLabel(starsLabel(i + 1))
        .setStyle(ButtonStyle.Secondary)
    )
  );

  await user.send({ embeds: [embed], components: [row] }).catch(() => {
    console.warn(`[Rating] Could not DM user ${user.tag} — DMs may be disabled.`);
  });
}

/**
 * Handles a rating button click from a DM.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} ticketChannelId
 * @param {number} stars  1–5
 */
async function handleRatingSubmit(interaction, ticketChannelId, stars) {
  if (isTicketRated(ticketChannelId)) {
    return interaction.reply({
      content: '❌ You have already submitted a rating for this ticket.',
      flags: ['Ephemeral'],
    });
  }

  markTicketRated(ticketChannelId, stars);

  const embed = new EmbedBuilder()
    .setTitle('✅  Rating Submitted!')
    .setDescription(
      `Thank you for your feedback!\n\n` +
        `You rated your experience **${starsLabel(stars)}** (${stars}/5).\n\n` +
        'We appreciate your input and will use it to continue improving our support.'
    )
    .setColor(0x57f287)
    .setTimestamp();

  // Rebuild buttons — highlight chosen star, disable all
  const disabledRow = new ActionRowBuilder().addComponents(
    ...Array.from({ length: 5 }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`rating_disabled_${i + 1}`)
        .setLabel(starsLabel(i + 1))
        .setStyle(i + 1 === stars ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(true)
    )
  );

  await interaction.update({ embeds: [embed], components: [disabledRow] });
}

module.exports = { sendRatingDM, handleRatingSubmit };
