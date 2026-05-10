'use strict';

require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ── Create client ──────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  // Required for DM interactions (button clicks in DMs)
  partials: [Partials.Channel, Partials.Message],
});

// ── Load events ────────────────────────────────────────────────────────────────
const eventsDir = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsDir, file));

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// ── Login ──────────────────────────────────────────────────────────────────────
if (!process.env.BOT_TOKEN) {
  console.error('[Bot] BOT_TOKEN is not set in the environment. Please check your .env file.');
  process.exit(1);
}

client.login(process.env.BOT_TOKEN);
