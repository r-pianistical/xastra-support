'use strict';

const { handleTicketButtonClick, handleTicketModalSubmit, handleCloseTicket } = require('../handlers/ticketHandler');
const { handleRatingSubmit } = require('../handlers/ratingHandler');

/**
 * Custom-ID format reference
 * ──────────────────────────
 *  Buttons:
 *    open_ticket_<serverKey>_<categoryId>     e.g. open_ticket_server1_bug_report
 *    close_ticket_<channelId>                 e.g. close_ticket_1234567890123456789
 *    rating_<channelId>_<stars>               e.g. rating_1234567890123456789_4
 *    rating_disabled_<n>                      (disabled post-vote — ignored)
 *
 *  Modals:
 *    ticket_modal_<serverKey>_<categoryId>    e.g. ticket_modal_server2_player_report
 *
 * Parsing strategy:
 *   Split on '_', take the first two tokens as the action prefix, then parse
 *   the remainder.  Because serverKey is always 'server1' or 'server2' (no
 *   underscores after the digit) and categoryId / channelId may contain
 *   underscores, we use fixed positional slices.
 */
module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    // ── Button interactions ────────────────────────────────────────────────
    if (interaction.isButton()) {
      const { customId } = interaction;

      // open_ticket_<serverKey>_<categoryId>
      if (customId.startsWith('open_ticket_')) {
        const rest = customId.slice('open_ticket_'.length); // e.g. "server1_bug_report"
        const sepIdx = rest.indexOf('_');                   // index of first '_' after serverKey
        const serverKey = rest.slice(0, sepIdx);            // "server1"
        const categoryId = rest.slice(sepIdx + 1);          // "bug_report"
        return handleTicketButtonClick(interaction, serverKey, categoryId);
      }

      // close_ticket_<channelId>
      if (customId.startsWith('close_ticket_')) {
        const channelId = customId.slice('close_ticket_'.length);
        return handleCloseTicket(interaction, channelId);
      }

      // rating_<channelId>_<stars>  (ignore post-vote disabled buttons)
      if (customId.startsWith('rating_') && !customId.startsWith('rating_disabled_')) {
        const rest = customId.slice('rating_'.length);       // "<channelId>_<stars>"
        const lastSep = rest.lastIndexOf('_');
        const ticketChannelId = rest.slice(0, lastSep);      // channelId (snowflake, digits only)
        const stars = parseInt(rest.slice(lastSep + 1), 10); // 1–5

        if (!ticketChannelId || isNaN(stars) || stars < 1 || stars > 5) {
          return interaction.reply({ content: '❌ Invalid rating.', ephemeral: true });
        }

        return handleRatingSubmit(interaction, ticketChannelId, stars);
      }
    }

    // ── Modal submissions ──────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      // ticket_modal_<serverKey>_<categoryId>
      if (customId.startsWith('ticket_modal_')) {
        const rest = customId.slice('ticket_modal_'.length); // e.g. "server1_bug_report"
        const sepIdx = rest.indexOf('_');
        const serverKey = rest.slice(0, sepIdx);
        const categoryId = rest.slice(sepIdx + 1);
        return handleTicketModalSubmit(interaction, serverKey, categoryId);
      }
    }
  },
};
