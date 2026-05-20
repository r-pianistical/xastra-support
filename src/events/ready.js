'use strict';

const config = require('../config');
const { deployPanel } = require('../handlers/panelHandler');

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    console.log('[Bot] Deploying ticket panels…');

    for (const serverKey of Object.keys(config.servers)) {
      await deployPanel(client, serverKey);
    }

    console.log('[Bot] All panels deployed successfully.');
  },
};
