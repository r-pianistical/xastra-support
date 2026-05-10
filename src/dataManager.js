'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// ── In-memory cache — loaded once at startup ──────────────────────────────────

let _cache = null;

function loadData() {
  if (_cache) return _cache;

  if (!fs.existsSync(DATA_FILE)) {
    _cache = { panelMessages: {}, tickets: {}, ratings: {} };
    // Write the initial file synchronously only on first-ever run
    fs.writeFileSync(DATA_FILE, JSON.stringify(_cache, null, 2));
    return _cache;
  }

  _cache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return _cache;
}

/**
 * Persists the in-memory cache to disk asynchronously.
 * Errors are logged but do not throw so bot operation continues.
 */
function saveData() {
  fs.promises
    .writeFile(DATA_FILE, JSON.stringify(_cache, null, 2))
    .catch((err) => console.error('[DataManager] Failed to write data.json:', err));
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

function setPanelMessage(guildId, messageId) {
  const data = loadData();
  data.panelMessages[guildId] = messageId;
  saveData();
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
  saveData();
}

function getTicket(channelId) {
  return loadData().tickets[channelId] ?? null;
}

function closeTicket(channelId) {
  const data = loadData();
  if (data.tickets[channelId]) {
    data.tickets[channelId].closedAt = new Date().toISOString();
    saveData();
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

function markTicketRated(channelId, stars) {
  const data = loadData();
  if (data.tickets[channelId]) {
    data.tickets[channelId].rated = true;
    data.ratings[channelId] = { stars, ratedAt: new Date().toISOString() };
    saveData();
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
