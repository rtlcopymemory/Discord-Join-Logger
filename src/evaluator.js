const { GuildMember } = require("discord.js");

const dangerChars = ['卐'];
const secs2days = 60 * 60 * 24;

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
    let daysAge = Math.abs(time - age) / secs2days;  // [0, inf]
    let daysTime = time / secs2days;
    let ageRating = 1 - Math.log10(daysAge) / Math.log10(daysTime);  // log10 increasing. argmax log10(time - age) would be time
    let ageWeight = 1;

    let pfpRating = hasDefaultPfp ? 1 : 0.3;
    let pfpWeight = 1;

    let badgesRating = 1 - Math.log2(badges + 1);
    let badgesWeight = 0.7;

    let average = ((ageRating * ageWeight) + (pfpRating * pfpWeight) + (badgesRating * badgesWeight)) / (ageWeight + pfpWeight + badgesWeight);

    // return (Math.log10((age / time) + 0.5)) * (hasDefaultPfp ? 1 : 0.7) * (1 - Math.log2(badges + 1));
    return average + (1 - average) * evalModifiers(member);
}

/** Evaluates modifiers that add to the score.  
 * Modifiers are different than the normal rating parameters
 * as they can potentially make the score go to 1 regardless
 * of any other parameter.
 * 
 * If this function returns 1 then the final score will be 1.
 * If instead it's a number between 0 and 1 then it will be a
 * percentage of the remaining points that are needed to reach 1.
 * 
 * @param {GuildMember} member 
 */
function evalModifiers(member) {
    for (let char in dangerChars) {
        if (member.displayName.includes(char)) {
            return 1;
        }
    }

    return 0;
}

module.exports = {
    evaluator
}