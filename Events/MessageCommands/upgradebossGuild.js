const Discord = require('discord.js');
const SQUADDATA = require('../../modules/squad.js')
const EMOJICONFIG = require('../../config/emoji.json');
const PLAYERDATA = require('../../modules/player.js');
const { bold, inlineCode, codeBlock } = require('@discordjs/builders');
const { prefix } = require('../../App/config.json')
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Message, Events, ButtonStyle, ComponentType } = require('discord.js');
const STATS = require('../../modules/statsBot.js');

// Config Cooldown :
const shuffleTime = 0;
var cooldownPlayers = new Discord.Collection();

module.exports = {
    name: Events.MessageCreate,
    /**
     * @param {Message} message
     */

async execute(message, args, commandName) {
  //  const args = message.content.slice(prefix.length).trim().split(/ +/);
  //  const commandName = args.shift().toLowerCase();
    if (message.content.toLowerCase() && this.info.names.some(name => commandName === name)) {

    let stats = await STATS.findOne({ botID: 899 });
    let user = message.author;
    let itemUpgrade = args[0]
    let amountUpgrade = parseInt(args[1])
    let playerStats = await PLAYERDATA.findOne({ userId: user.id });
    let squad = await SQUADDATA.findOne({ squadName: playerStats.player.other.squadName });
    let guildbank = squad.squadbank;
    
    const prices = {
        attack: 112,
        health: 7,
        defense: 75
    };
    
    const maxUpgrades = {
        attack: Math.floor(guildbank / prices.attack),
        health: Math.floor(guildbank / prices.health),
        defense: Math.floor(guildbank / prices.defense)
    };
    

    if(isNaN(amountUpgrade) || !Number.isInteger(amountUpgrade)) {
        return message.reply(`${EMOJICONFIG.no} Please only use whole numbers \n Command Structure: ${inlineCode("@Eternals guild upgrade <attack/health/defense> <stat amount>")}\n Pricing: \n Attack: ${inlineCode(`${prices.attack} coins (Max: ${maxUpgrades.attack})`)}\n Health: ${inlineCode(`${prices.health} coins (Max: ${maxUpgrades.health})`)}\n Defense: ${inlineCode(`${prices.defense} coins (Max: ${maxUpgrades.defense})`)}`);
    }
    
    if(isNaN(amountUpgrade) || !Number.isInteger(amountUpgrade) || itemUpgrade === '' || amountUpgrade === '' || itemUpgrade === ' ' || amountUpgrade === ' ' || itemUpgrade === undefined || amountUpgrade === undefined) {
        return message.reply(`${EMOJICONFIG.no} Please check your input. Command Structure: ${inlineCode("@Eternals guild upgrade <attack/health/defense> <stat amount>")}\n Pricing: \n Attack: ${inlineCode(`${prices.attack} coins (Max: ${maxUpgrades.attack})`)}\n Health: ${inlineCode(`${prices.health} coins (Max: ${maxUpgrades.health})`)}\n Defense: ${inlineCode(`${prices.defense} coins (Max: ${maxUpgrades.defense})`)}`);
    } else if((itemUpgrade == 'attack' || itemUpgrade == 'atk' || itemUpgrade == 'a' || itemUpgrade == 'health' || itemUpgrade == 'hlh' || itemUpgrade == 'h' || itemUpgrade == 'defense' || itemUpgrade == 'def' || itemUpgrade == 'd') && !isNaN(amountUpgrade)) {
        
        function playerInSquad(playerStats){
            if (!playerStats) return message.reply(`${EMOJICONFIG.no} you are not a player ! : ${inlineCode('@Eternals start')}`);
            else {
                if(playerStats.player.other.squadName != 'undefined') return true
            }
            return false
        };

        // == Player DB ==
        if (!playerStats) return message.reply(`${EMOJICONFIG.no} you are not a player ! : ${inlineCode('@Eternals start')}`);
        else {

            // == Squad DB ==
            if (!squad) return message.reply(`${EMOJICONFIG.no} Guild is not available...`)
            else {

                // === Player is in Squad ===
                if(playerInSquad(playerStats)){

                    let price;  
                    if(itemUpgrade == 'attack' || itemUpgrade == 'atk' || itemUpgrade == 'a'){
                        price = amountUpgrade * 112;
                    } else if(itemUpgrade == 'health' || itemUpgrade == 'hlh' || itemUpgrade == 'h'){
                        price = amountUpgrade * 7;
                    } else if(itemUpgrade == 'defense' || itemUpgrade == 'def' || itemUpgrade == 'd'){
                        price = amountUpgrade * 75;
                    }

                        // === Check amount balance eco Bank ===
                    if(squad.squadbank >= price){

                        // === Initialize Player is the leader of the team ===
                     //   if(playerStats.userId === squad.leader[0] || squad.officers.includes(playerStats.userId)){
                        if(user.id != squad.leader[0] && !squad.officer.some(officer => officer.id === user.id)) {
                            return message.reply(`${EMOJICONFIG.no} you are not the leader or an officer of the Guild: ${inlineCode(squad.squadName)}`);
                        } 
                        
                            function upgradeBossMessage(done, emojiDone, price, amountUpgrade){
                                // ===== Row Button =====
                                const row = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('yes')
                                            .setLabel(`Upgrade Boss`)
                                            .setEmoji(`${EMOJICONFIG.yes}`)
                                            .setStyle(ButtonStyle.Success),
                                        
                                        new ButtonBuilder()
                                            .setCustomId('no')
                                            .setLabel(`Cancel`)
                                            .setEmoji(`${EMOJICONFIG.no}`)
                                            .setStyle(ButtonStyle.Danger),
                                );

                                const upgradeBoss = new EmbedBuilder()
                                    .setColor('#4dca4d')
                                    .setTitle(`${EMOJICONFIG.paper} Upgrade Guild Boss`)
                                    .setDescription(`${EMOJICONFIG.paper} Guild : ${inlineCode(squad.squadName)} by ${inlineCode(squad.leader[1])}\n${EMOJICONFIG.scroll4} Improve ${done}: ${inlineCode('+' + amountUpgrade)} ${emojiDone}\n${EMOJICONFIG.coinchest} Guild Upgrade Cost: ${inlineCode(price)}`)
                                    .setTimestamp();
                                message.reply({embeds: [upgradeBoss], components: [row]});


                                // ========== Filter & Collector ==========
                                const filter = (interaction)  => {
                                    if(interaction.user.id === message.author.id) return true
                                    return interaction.reply({ content: 'You cant use this button' })
                                };
                                const collector = message.channel.createMessageComponentCollector({
                                    filter, 
                                    max: 1
                                });
                            
                                collector.on('end', (ButtonInteraction) => {
                                    ButtonInteraction.first().deferUpdate()
                                    const id = ButtonInteraction.first().customId

                                    if(id === 'yes'){
                                        // ========== YES: UPGRADE the SQUAD BOSS ==========
                                        if(done == 'attack'){
                                            squad.squadboss.bossattack += amountUpgrade
                                            squad.squadbank -= price
                                            stats.amountCoin -= price
                                            stats.save()
                                            squad.save() 
                                        };

                                        if(done == 'health'){
                                            squad.squadboss.bosshealth += amountUpgrade
                                            squad.squadbank -= price
                                            stats.amountCoin -= price
                                            stats.save()
                                            squad.save() 
                                        };

                                        if(done == 'defense'){
                                            squad.squadboss.bossdefense += amountUpgrade
                                            squad.squadbank -= price
                                            stats.amountCoin -= price
                                            stats.save()
                                            squad.save() 
                                        };
                                        

                                        var upgradeDone = new EmbedBuilder()
                                            .setColor('#4dca4d')
                                            .setTitle(`🗿 Boss Upgrade`)
                                            .setDescription(`${EMOJICONFIG.yes} Guild Boss Upgrading !\n${EMOJICONFIG.attack6} Improve ${done}: ${inlineCode('+' + amountUpgrade)} ${emojiDone}\n${EMOJICONFIG.coinchest} Cost: ${inlineCode(price)}`)
                                            .setTimestamp();
                                        return message.reply({embeds: [upgradeDone]});
                                    }
                                    if(id === 'no') return message.reply(`You canceled ${EMOJICONFIG.no}`)
                                });
                            };
                            // === End Function ===

                            if(itemUpgrade == 'attack' || itemUpgrade == 'atk' || itemUpgrade == 'a'){
                                return upgradeBossMessage('attack', `${EMOJICONFIG.attack}`, Math.floor(amountUpgrade * 112), amountUpgrade);

                            } else if(itemUpgrade == 'health' || itemUpgrade == 'hlh' || itemUpgrade == 'h'){
                                return upgradeBossMessage('health', `${EMOJICONFIG.heart}`, Math.floor(amountUpgrade * 7), amountUpgrade);

                            } else if(itemUpgrade == 'defense' || itemUpgrade == 'def' || itemUpgrade == 'd'){
                                return upgradeBossMessage('defense', `${EMOJICONFIG.shield2}`, Math.floor(amountUpgrade * 75), amountUpgrade);
                            } else return message.reply(`${EMOJICONFIG.no} error command, type: ${inlineCode("@Eternals guild upgrade <attack/health/defense> <amount>")}`);

                    } else return message.reply(`${EMOJICONFIG.no}  You Don't Have Enough Coins in the Guild Bank...`);
                } else return message.reply(`${EMOJICONFIG.no} you are not in a guild...`);
            };
        };
    };
};
},
info: {
    names: ['upgradeguildboss', 'ugb', 'upgradeGuildboss', 'guildbossimprove', 'upggboss', 'upgradeteamboss', 'bosslevel', 'levelboss', 'improveboss', 'bossup', 'upboss'],
} }
