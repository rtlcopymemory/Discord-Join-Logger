require('dotenv').config()

const { Client, Intents } = require('discord.js');
const { Permissions } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_WEBHOOKS] });

const { handleCommands } = require('./commands.js');

const prefix = (process.env.PREFIX).trim().toLowerCase();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', async member => {

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