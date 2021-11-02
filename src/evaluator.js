const { GuildMember } = require("discord.js");

/** returns a number between 0 and 1 where 1 means the account is suspecious
 * 
 * @param {GuildMember} member 
 */
function evaluator(member) {
    let hasDefaultPfp = /discordapp.com\/embed\/avatars\/[0-9]\.png/.test(member.avatarURL());
    let age = member.user.createdTimestamp;
    let time = new Date().getTime();
    // At the moment, there are 13 possible user badges
    let badges = member.user.flags.toArray().length / 13;
    // Default pfp doesn't guarantee much
    // This formula can be made better
    return (Math.log10((age / time) + 0.5)) * (hasDefaultPfp ? 1 : 0.7) * (1 - Math.log2(badges + 1));
}

module.exports = {
    evaluator
}