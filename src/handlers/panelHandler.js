'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const { getPanelMessage, setPanelMessage } = require('../dataManager');

/**
 * Sends (or refreshes) the ticket panel for a server.
 * Deletes the previous panel message if one exists, then posts a new embed
 * with category buttons and saves the new message ID.
 *
 * @param {import('discord.js').Client} client
 * @param {string} serverKey  'server1' | 'server2'
 */
async function deployPanel(client, serverKey) {
  const serverConfig = config.servers[serverKey];
  if (!serverConfig) return;

  // Fetch guild
  const guild = await client.guilds.fetch(serverConfig.id).catch(() => null);
  if (!guild) {
    console.warn(`[Panel] Could not find guild for ${serverKey} (id: ${serverConfig.id})`);
    return;
  }

  // Fetch panel channel
  const channel = await guild.channels.fetch(serverConfig.panelChannelId).catch(() => null);
  if (!channel) {
    console.warn(`[Panel] Could not find panel channel for ${serverKey} (id: ${serverConfig.panelChannelId})`);
    return;
  }

  // Delete previous panel message
  const oldMessageId = getPanelMessage(serverConfig.id);
  if (oldMessageId) {
    const oldMessage = await channel.messages.fetch(oldMessageId).catch(() => null);
    if (oldMessage) {
      await oldMessage.delete().catch(() => null);
    }
  }

  // Build embed
  const embed = new EmbedBuilder()
    .setTitle(serverConfig.embed.title)
    .setDescription(serverConfig.embed.description)
    .setColor(serverConfig.embed.color)
    .setTimestamp();

  if (serverConfig.embed.fields) {
    embed.addFields(serverConfig.embed.fields);
  }

  // Build buttons (max 5 per ActionRow)
  const buttons = serverConfig.categories.map((cat) =>
    new ButtonBuilder()
      .setCustomId(`open_ticket_${serverKey}_${cat.id}`)
      .setLabel(cat.label)
      .setEmoji(cat.emoji)
      .setStyle(ButtonStyle[cat.style])
  );

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  // Send new panel
  const message = await channel.send({ embeds: [embed], components: rows });
  setPanelMessage(serverConfig.id, message.id);

  console.log(`[Panel] Deployed for ${serverKey} in #${channel.name} (guild: ${guild.name})`);
}

module.exports = { deployPanel };
