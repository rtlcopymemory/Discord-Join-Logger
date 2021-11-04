const { Message, Permissions } = require("discord.js");
const { db } = require("./db.js");
const axios = require('axios');

/**
 * @param {Message} message - The message as received from the event
 * @param {Array<string>} argv - The arguments including the prefix
 */
async function handleCommands(message, argv) {
    switch (argv[1]) {
        case 'link':
            try {
                await handleLink(message, argv[2]);
            } catch (e) {
                await message.reply("Error: " + e);
            }
            break;
        case 'remove':
            try {
                await handleRemove(message, argv[2]);
            } catch (e) {
                await message.reply("Error: " + e);
            }
            break;
        case 'help':
            await message.reply(`Usage:\nIn the channel you want to receive your join updates run \`${argv[0]} link <Server ID>\`\n` +
                `**Attention**: The bot must be in the server already to monitor its joins`)
            break;
        case 'alert':
            if (argv.length < 3) {
                await message.reply(`Please provide at least a serverID.\nUsage: \`${argv[0]} alert <ServerID> [RoleID]\``);
            } else if (argv.length < 4) {
                handleAlert(message, argv[2], undefined);
                break;
            }
            handleAlert(message, argv[2], argv[3]);
            break;
    }
}

/**
 * @param {Message} message - The message
 * @param {string} serverID - The server ID to listen to
 */
async function handleLink(message, serverID) {
    if (!/^[0-9]+$/.test(serverID)) {
        throw "Invalid server ID";
    }

    if (message.channel.type !== "GUILD_TEXT") {
        throw "Command not called in a normal Text Channel";
    }

    // check that the person giving the command has permissions to remove this
    let server = message.client.guilds.cache.get(serverID) || message.client.guilds.fetch(serverID);
    let user = server.members.cache.get(message.author.id) || server.members.fetch(message.author.id);
    if (!user.permissions.has([Permissions.FLAGS.BAN_MEMBERS])) {
        throw "You don't have 'BAN' permissions on that server!";
    }

    db.get("SELECT serverID FROM servers WHERE serverID = ?", [serverID], async (err, result) => {
        if (!!err) {
            await message.reply("Error running the query");
            return;
        }

        if (!!result) {
            await message.reply("Error: Server already has a webhook. Use `remove` to remove it");
            return;
        }

        let webhook = await message.channel.createWebhook("Join Notifier");

        if (!webhook || !webhook.url) {
            await message.reply("Webhook creation failed");
            return;
        }

        var stmt = db.prepare("INSERT INTO servers VALUES (?, ?)");
        stmt.run(serverID, webhook.url);
        stmt.finalize();

        await message.reply("Operation completed successfully");
    })
}

/**
 * 
 * @param {Message} message - The Message
 * @param {string} serverID - The server id
 */
async function handleRemove(message, serverID) {
    if (!/^[0-9]+$/.test(serverID)) {
        await message.reply("Invalid server ID");
        return;
    }

    if (message.channel.type !== "GUILD_TEXT") {
        await message.reply("Command not called in a normal Text Channel");
        return;
    }

    // check that the person giving the command has permissions to remove this
    let server = message.client.guilds.cache.get(serverID) || message.client.guilds.fetch(serverID);
    let user = server.members.cache.get(message.author.id) || server.members.fetch(message.author.id);
    if (!user.permissions.has([Permissions.FLAGS.BAN_MEMBERS])) {
        return;
    }

    db.get("SELECT serverID, webhook FROM servers WHERE serverID = ?", [serverID], async (err, result) => {
        if (!!err) {
            await message.reply("Error running the query");
            return;
        }

        if (result === undefined) {
            await message.reply("Error: Server does not exist");
            return;
        }

        await axios.delete(result.webhook);

        var stmt = db.prepare("DELETE FROM servers WHERE serverID = ?");
        stmt.run(serverID);
        stmt.finalize();

        await message.reply("Operation completed successfully");
    })
}

/**
 * Parameter roleID can be undefined. If it is, remove the record from the DB
 * @param {Message} message 
 * @param {String} roleID 
 */
async function handleAlert(message, serverID, roleID) {
    if (!/^[0-9]+$/.test(serverID)) {
        await message.reply("Invalid server ID");
        return;
    }

    if (!!roleID && !/^[0-9]+$/.test(roleID)) {
        await message.reply("Invalid role ID");
        return;
    }

    if (message.channel.type !== "GUILD_TEXT") {
        await message.reply("Command not called in a normal Text Channel");
        return;
    }

    // check that the person giving the command has permissions to remove this
    let server = message.client.guilds.cache.get(serverID) || message.client.guilds.fetch(serverID);
    let user = server.members.fetch(message.author.id);
    if (!user.permissions.has([Permissions.FLAGS.BAN_MEMBERS])) {
        return;
    }

    if (!roleID) {
        // Delete from db
        try {
            var stmt = db.prepare("UPDATE servers SET roleID = '' WHERE serverID = ?");
            stmt.run(serverID);
            stmt.finalize();
        } catch (e) {
            await message.reply("Error occured while removing the role. Did you already setup the bot for logs?");
            return;
        }
        await message.reply("Role Successfully deleted");
        return;
    }

    let role = message.guild.roles.cache.get(roleID) || message.guild.roles.fetch(roleID);
    if (!role) {
        await message.reply(`Role \`${roleID}\` does not exist`);
        return;
    }

    try {
        var stmt = db.prepare("UPDATE servers SET roleID = ? WHERE serverID = ?");
        stmt.run(roleID, serverID);
        stmt.finalize();
    } catch (e) {
        await message.reply("Error occured while adding the role. Did you already setup the bot for logs?");
        return;
    }
    await message.reply("Role added as alert");
}

module.exports = {
    handleCommands
}