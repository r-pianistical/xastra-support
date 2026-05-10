'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// ── Internal helpers ──────────────────────────────────────────────────────────

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { panelMessages: {}, tickets: {}, ratings: {} };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── Panel message tracking ────────────────────────────────────────────────────

/**
 * Returns the previously stored panel message ID for a guild, or null.
 * @param {string} guildId
 * @returns {string|null}
 */
function getPanelMessage(guildId) {
  return loadData().panelMessages[guildId] ?? null;
}

/**
 * Persists the panel message ID for a guild.
 * @param {string} guildId
 * @param {string} messageId
 */
function setPanelMessage(guildId, messageId) {
  const data = loadData();
  data.panelMessages[guildId] = messageId;
  saveData(data);
}

// ── Ticket tracking ───────────────────────────────────────────────────────────

/**
 * Records a newly created ticket channel.
 * @param {string} channelId   The ticket channel's ID
 * @param {string} userId      The user who opened the ticket
 * @param {string} guildId
 * @param {string} categoryId  e.g. 'bug_report'
 */
function createTicket(channelId, userId, guildId, categoryId) {
  const data = loadData();
  data.tickets[channelId] = {
    userId,
    guildId,
    categoryId,
    rated: false,
    openedAt: new Date().toISOString(),
  };
  saveData(data);
}

/**
 * Returns the ticket record for a channel, or null.
 * @param {string} channelId
 */
function getTicket(channelId) {
  return loadData().tickets[channelId] ?? null;
}

/**
 * Marks a ticket as closed (records timestamp, does not delete the record).
 * @param {string} channelId
 */
function closeTicket(channelId) {
  const data = loadData();
  if (data.tickets[channelId]) {
    data.tickets[channelId].closedAt = new Date().toISOString();
    saveData(data);
  }
}

// ── Satisfaction ratings ──────────────────────────────────────────────────────

/**
 * Returns true if the ticket has already been rated.
 * @param {string} channelId
 */
function isTicketRated(channelId) {
  return loadData().tickets[channelId]?.rated === true;
}

/**
 * Records the star rating for a ticket and marks it as rated.
 * @param {string} channelId
 * @param {number} stars  1–5
 */
function markTicketRated(channelId, stars) {
  const data = loadData();
  if (data.tickets[channelId]) {
    data.tickets[channelId].rated = true;
    data.ratings[channelId] = { stars, ratedAt: new Date().toISOString() };
    saveData(data);
  }
}

module.exports = {
  getPanelMessage,
  setPanelMessage,
  createTicket,
  getTicket,
  closeTicket,
  isTicketRated,
  markTicketRated,
};
