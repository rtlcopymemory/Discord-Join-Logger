require('dotenv').config()

const axios = require('axios');
const { Client, Intents } = require('discord.js');
const { Permissions } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_WEBHOOKS] });

const { handleCommands } = require('./commands.js');
const { db } = require('./db');
const { evaluator } = require('./evaluator.js');

const prefix = (process.env.PREFIX).trim().toLowerCase();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`for ${prefix} help`, { type: 'WATCHING' });
});

client.on('guildMemberAdd', async member => {
    db.get("SELECT webhook FROM servers WHERE serverID = ?", [member.guild.id], (err, row) => {
        if (!!err) {
            console.log(`There was an error!\n${err}`)
        }

        if (!row)
            return;

        let susScore = evaluator(member);

        let color = parseInt("2f3136", 16)
        if (susScore >= 0.75) {
            color = parseInt("ff0000", 16);
        } else if (susScore >= 0.4) {
            color = parseInt("ffff00", 16);
        }

        axios.post(row.webhook, {
            "content": member.id,
            "embeds": [{
                "color": color,
                "title": "New Member Join!",
                "fields": [
                    {
                        name: "Username",
                        value: member.displayName,
                        inline: true
                    },
                    {
                        name: "ID",
                        value: member.id,
                        inline: true
                    },
                    {
                        name: "Joined at",
                        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:f>`,
                        inline: true
                    },
                    {
                        name: "Account Creation",
                        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`,
                        inline: true
                    },
                    {
                        name: "Account age",
                        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    {
                        name: "Badges",
                        value: member.user.flags.toArray().length,
                        inline: true
                    },
                    {
                        name: "Sus Grade",
                        value: `${susScore}`,
                        inline: true
                    }
                ],
                "image": {
                    "url": member.user.avatarURL()
                }
            }]
        })
            .catch(error => {
                console.log("Soemthing failed while sending the webhook\n" + error);
            });
    });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    let authorMember = await message.guild.members.fetch(message.author.id);

    if (!authorMember.permissions.has([Permissions.FLAGS.BAN_MEMBERS])) {
        return;
    }

    if (!message.content.toLowerCase().startsWith(prefix)) return;

    let argv = message.content.split(' ');

    // This saves us from the dreaded hello!ping and forces a space
    if (argv[0].toLowerCase() !== prefix) return;

    handleCommands(message, argv);
});

client.login(process.env.TOKEN);