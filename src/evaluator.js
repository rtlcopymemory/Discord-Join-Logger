const { GuildMember } = require("discord.js");

const regexes = require("./wordlists/regex.json").elements.map(e => new RegExp(e));

const dangerChars = ['卐'];
const ms2days = 1000 * 60 * 60 * 24;

/** returns a number between 0 and 1 where 1 means the account is suspecious
 * 
 * @param {GuildMember} member 
 */
function evaluator(member) {
    let age = member.user.createdTimestamp;  // ms
    let time = new Date().getTime();  // .getTime() uses milliseconds in JS.
    // At the moment, there are 13 possible user badges
    let badges = member.user.flags.toArray().length / 13;
    // Default pfp doesn't guarantee much
    // This formula can be made better
    let daysAge = Math.floor(Math.abs(time - age) / ms2days);  // [0, inf]
    let ageRating = agePolynom(daysAge);
    let ageWeight = 1;

    let badgesRating = Math.exp(-badges);  //  e^(-x), its 1 at x=0, decreases and lim -> inf is 0
    let badgesWeight = 0.5;

    let average = ((ageRating * ageWeight) + (badgesRating * badgesWeight)) / (ageWeight + badgesWeight);

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
    for (let i in dangerChars) {
        if (member.displayName.includes(dangerChars[i])) {
            return 1;
        }
    }

    if (checkRegexes(member.user.username)) return 0.9;

    let elements = [];

    let hasDefaultPfp = /discordapp.com\/embed\/avatars\/[0-9]\.png/.test(member.avatarURL());
    let pfpRating = hasDefaultPfp ? 0.5 : 0;

    elements.push([pfpRating, 1]);  // rating, weight

    // Weighted average
    let num = 0;
    let den = 0;
    for (let i in elements) {
        num += elements[i][0] * elements[i][1];
        den += elements[i][1];
    }

    return num / den;
}

/** Iterates through all the Regex values and returns true if any of them matches
 * 
 * @param {string} username 
 */
function checkRegexes(username) {
    for (let i in regexes)
        if (regexes[i].test(username))
            return true;

    return false;
}

/** This function was created using Linear Least Squares with:
 * y = [1; 0.5; 0.3; 0.1; 0];
 * x = [0; 30; 100; 180; 200];
 * 
 * @param {Number} x 
 */
function agePolynom(x) {
    if (x >= 197) return 0;
    return 0.9817666 + -0.0196763 * x + 0.000177 * Math.pow(x, 2) + -0.00000052 * Math.pow(x, 3);
}

module.exports = {
    evaluator
}
