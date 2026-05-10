'use strict';

require('dotenv').config();

/**
 * Central configuration for both Discord servers.
 *
 * Each category carries:
 *   id            — unique snake_case identifier (used in custom IDs)
 *   label         — button label shown to users
 *   emoji         — button emoji
 *   style         — discord.js ButtonStyle key ('Primary' | 'Secondary' | 'Success' | 'Danger')
 *   channelPrefix — prefix for the created ticket channel name
 *   supportRoleId — role pinged / granted access for this specific category (Server 1 only)
 *   modal         — modal title + array of TextInput field definitions
 */
module.exports = {
  servers: {
    // ── Server 1 · Xastra Studios Support ─────────────────────────────────────
    server1: {
      id: process.env.SERVER1_ID,
      panelChannelId: process.env.SERVER1_PANEL_CHANNEL_ID,
      ticketCategoryId: process.env.SERVER1_TICKET_CATEGORY_ID || null,
      // General role pinged on every ticket in this server
      generalSupportRoleId: process.env.SERVER1_GENERAL_SUPPORT_ROLE_ID || null,

      embed: {
        title: '🎮  Xastra Studios Support',
        description:
          'This is the place to get assistance with our games, report issues, or ask general questions. ' +
          'Please open a ticket using the appropriate option, provide clear details, and a member of the ' +
          'Xastra Studios team will assist you as soon as possible.',
        color: 0x5865f2,
        fields: [
          {
            name: '🎮  Game Support',
            value:
              'Use this section to report in-game issues, bugs, or technical problems related to our projects. ' +
              "Whether you've encountered a gameplay bug, performance issue, or something that isn't working as " +
              'intended, opening a ticket allows our team to review the problem directly and respond with the ' +
              'appropriate support.\n\n' +
              'When submitting a ticket, please include as much detail as possible, such as what happened, where ' +
              'it occurred, and any relevant screenshots or clips. This helps us investigate issues more ' +
              'efficiently and improve the overall experience.',
          },
          {
            name: '💬  Discord Support',
            value:
              "Need help, have a question, or want to report an issue? Our ticket system is here to make sure " +
              "your concerns are handled efficiently and privately. By opening a ticket, you'll be able to speak " +
              'directly with a member of the Xastra Studios team regarding technical issues, moderation concerns, ' +
              'or general inquiries related to our projects.\n\n' +
              'Please provide clear and detailed information when creating a ticket so we can assist you as quickly ' +
              'as possible. We appreciate your patience while our team reviews and responds to your request.',
          },
        ],
      },

      categories: [
        {
          id: 'bug_report',
          label: 'Bug Report',
          emoji: '🐛',
          style: 'Danger',
          channelPrefix: 'bug',
          supportRoleId: process.env.SERVER1_BUG_ROLE_ID || null,
          modal: {
            title: 'Bug Report',
            fields: [
              {
                customId: 'bug_description',
                label: 'What is the bug you encountered?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'bug_reproduce',
                label: 'How can we reproduce this bug?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'bug_when',
                label: 'When did this occur? (date / time / version)',
                style: 'Short',
                required: false,
                maxLength: 200,
              },
            ],
          },
        },

        {
          id: 'discord_assistance',
          label: 'Discord Assistance',
          emoji: '💬',
          style: 'Primary',
          channelPrefix: 'discord',
          supportRoleId: process.env.SERVER1_DISCORD_ROLE_ID || null,
          modal: {
            title: 'Discord Assistance',
            fields: [
              {
                customId: 'discord_issue',
                label: 'What do you need help with?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'discord_tried',
                label: 'Have you tried anything to resolve it?',
                style: 'Short',
                required: false,
                maxLength: 500,
              },
            ],
          },
        },

        {
          id: 'ingame_assistance',
          label: 'In-Game Assistance',
          emoji: '🎮',
          style: 'Success',
          channelPrefix: 'ingame',
          supportRoleId: process.env.SERVER1_INGAME_ROLE_ID || null,
          modal: {
            title: 'In-Game Assistance',
            fields: [
              {
                customId: 'ingame_game',
                label: 'Which game or project is this regarding?',
                style: 'Short',
                required: true,
                maxLength: 200,
              },
              {
                customId: 'ingame_issue',
                label: 'What issue are you experiencing?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'ingame_when',
                label: 'When did this start occurring?',
                style: 'Short',
                required: false,
                maxLength: 200,
              },
            ],
          },
        },
      ],
    },

    // ── Server 2 · Xastra Studios Reports ─────────────────────────────────────
    server2: {
      id: process.env.SERVER2_ID,
      panelChannelId: process.env.SERVER2_PANEL_CHANNEL_ID,
      ticketCategoryId: process.env.SERVER2_TICKET_CATEGORY_ID || null,
      // Single support role for all tickets in this server
      supportRoleId: process.env.SERVER2_SUPPORT_ROLE_ID || null,

      embed: {
        title: '📋  Xastra Studios Reports',
        description:
          'Use this system to submit official reports regarding players, staff members, or leadership. ' +
          'Please ensure your report contains accurate information and any supporting evidence. ' +
          'False or malicious reports may result in disciplinary action.',
        color: 0xed4245,
      },

      categories: [
        {
          id: 'player_report',
          label: 'Player Report',
          emoji: '👤',
          style: 'Secondary',
          channelPrefix: 'player-report',
          modal: {
            title: 'Player Report',
            fields: [
              {
                customId: 'player_username',
                label: "What is the player's username?",
                style: 'Short',
                required: true,
                maxLength: 200,
              },
              {
                customId: 'player_rule',
                label: 'What rule did they break?',
                style: 'Short',
                required: true,
                maxLength: 300,
              },
              {
                customId: 'player_description',
                label: 'Describe what happened in detail',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'player_evidence',
                label: 'Do you have evidence? (links / descriptions)',
                style: 'Paragraph',
                required: false,
                maxLength: 1000,
              },
            ],
          },
        },

        {
          id: 'staff_report',
          label: 'Staff Report',
          emoji: '🛡️',
          style: 'Primary',
          channelPrefix: 'staff-report',
          modal: {
            title: 'Staff Report',
            fields: [
              {
                customId: 'staff_username',
                label: 'Which staff member are you reporting?',
                style: 'Short',
                required: true,
                maxLength: 200,
              },
              {
                customId: 'staff_concern',
                label: 'What is your concern regarding them?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'staff_evidence',
                label: 'Do you have evidence? (links / descriptions)',
                style: 'Paragraph',
                required: false,
                maxLength: 1000,
              },
            ],
          },
        },

        {
          id: 'admin_report',
          label: 'Administrator Report',
          emoji: '⚠️',
          style: 'Danger',
          channelPrefix: 'admin-report',
          modal: {
            title: 'Administrator Report',
            fields: [
              {
                customId: 'admin_username',
                label: 'Which administrator are you reporting?',
                style: 'Short',
                required: true,
                maxLength: 200,
              },
              {
                customId: 'admin_concern',
                label: 'What is your concern regarding them?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'admin_evidence',
                label: 'Do you have evidence? (links / descriptions)',
                style: 'Paragraph',
                required: false,
                maxLength: 1000,
              },
            ],
          },
        },

        {
          id: 'bod_report',
          label: 'Board of Directors Report',
          emoji: '📊',
          style: 'Danger',
          channelPrefix: 'bod-report',
          modal: {
            title: 'Board of Directors Report',
            fields: [
              {
                customId: 'bod_username',
                label: 'Which BoD member are you reporting?',
                style: 'Short',
                required: true,
                maxLength: 200,
              },
              {
                customId: 'bod_concern',
                label: 'What is your concern regarding them?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'bod_evidence',
                label: 'Do you have evidence? (links / descriptions)',
                style: 'Paragraph',
                required: false,
                maxLength: 1000,
              },
            ],
          },
        },

        {
          id: 'ownership_report',
          label: 'Ownership Report',
          emoji: '👑',
          style: 'Danger',
          channelPrefix: 'ownership-report',
          modal: {
            title: 'Ownership Report',
            fields: [
              {
                customId: 'ownership_concern',
                label: 'What is your concern?',
                style: 'Paragraph',
                required: true,
                maxLength: 1000,
              },
              {
                customId: 'ownership_evidence',
                label: 'Do you have evidence? (links / descriptions)',
                style: 'Paragraph',
                required: false,
                maxLength: 1000,
              },
            ],
          },
        },
      ],
    },
  },
};
