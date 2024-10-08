const PLAYER = require('../../modules/player.js');
const TREES = require('../../config/woodcut.json');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Message, Events, ButtonStyle, ComponentType, RoleSelectMenuInteraction } = require('discord.js');
const { prefix } = require('../../App/config.json')
const {client} = require('../../App/index.js');
const { bold, inlineCode, codeBlock } = require('@discordjs/builders');
const Party = require('../../modules/party.js');
const EMOJICONFIG = require('../../config/emoji.json');
const shuffleTime = 30000;

module.exports = {
    name: Events.MessageCreate,
    /**
     * @param {Message} message
     */
    async execute(message, args, command) {
        let commandName;

        if (typeof command === 'string') {
            commandName = command.split(' ')[0];
        } else if (message && message.content) {
            if (!message.mentions.has(client.user)) return;
            const cleanMessage = message.content.replace(/<@!?[0-9]+>/, '').trim();
            args = cleanMessage.split(/ +/);
            commandName = args.shift().toLowerCase();
        } 

        if (this.info.names.some(name => commandName === name)) {
 
            var user = message.author;
            let constore = args[0];

            try {
                let player = await PLAYER.findOne({ userId: user.id }).exec();
                if (!player) {
                    message.reply("You are not a player yet.");
                    return;
                }
                if (player.player.energy < 2) return message.reply(`${EMOJICONFIG.no} You don't have enough energy! Restore your energy with ${inlineCode('@Eternals energy')}`)


                const currentArea = player.player.other.area;
                const eligibleTrees = TREES.filter(tree => 
                    player.player.woodcutting.level >= tree.level && 
                    tree.area.includes(currentArea)
                );
                if (eligibleTrees.length === 0){
                    message.reply("No logs are eligible for your current woodcutting level in this area. Try going to another area.");
                    return;
                }

                if (constore && !eligibleTrees.some(tree => tree.alias.toLowerCase() === constore.toLowerCase())) {
                    message.reply(`You cannot chop ${constore} in your current area.`);
                    return;
                }
                
                if (constore && eligibleTrees.some(tree => tree.alias.toLowerCase() === constore.toLowerCase() && player.player.woodcutting.level < tree.level)) {
                    message.reply(`Your woodcutting level is not high enough to chop ${constore} in your current area.`);
                    return;
                }
        
                if (player.player.cooldowns && player.player.cooldowns.skilling) {
                    const cooldownData = player.player.cooldowns.skilling;
                    const timeSinceLastFight = new Date().getTime() - cooldownData.timestamp;
                    if (timeSinceLastFight < cooldownData.duration) {
                        var measuredTime = new Date(null);
                        measuredTime.setSeconds(Math.ceil((cooldownData.duration - timeSinceLastFight) / 1000));
                        var MHSTime = measuredTime.toISOString().substr(11, 8);
                        message.channel.send(`${EMOJICONFIG.hellspawn} Please wait \`${MHSTime}\` and try again.`);
                        return;
                    }
                }    
                player.player.cooldowns = player.player.cooldowns || {};
                player.player.cooldowns.skilling = {
                    timestamp: new Date().getTime(),
                    duration: shuffleTime
                };
                await player.save();
        


     //           let countdown = 30; // Set your own countdown for woodcutting
     //           message.reply(`You started ${EMOJICONFIG.axe2} woodcutting. Please wait ${countdown} Seconds...`).then(msg => {
     //               let countdownInterval = setInterval(() => {
      //                  countdown--;
       //                 if (countdown === 0) {
      //                      clearInterval(countdownInterval);
                            performWoodcutting();
        //                }
       //             }, 1000);

                    async function performWoodcutting() {
                        try {
                            function xpToLevel(level) {
                                let total = 0;
                                for (let l = 1; l < level; l++) {
                                    total += Math.floor(l + 300 * Math.pow(2, l / 7.0));
                                }
                                return Math.floor(total / 4);
                            }  
                            
                            function xpToNextLevel(currentLevel) {
                                return xpToLevel(currentLevel + 1) - xpToLevel(currentLevel);
                            }


                            const player = await PLAYER.findOne({ userId: user.id });  
                            
                            const currentArea = player.player.other.area;
                            const eligibleTrees = TREES.filter(tree => 
                                player.player.woodcutting.level >= tree.level && 
                                tree.area.includes(currentArea)
                            );
                            if (eligibleTrees.length === 0){
                                message.reply("No logs are eligible for your current woodcutting level in this area. Try going to another area.");
                                return;
                            }
                            let tree;
                            if (constore) {
                                tree = eligibleTrees.find(t => t.alias.toLowerCase() === constore.toLowerCase());
                            }
                            else  {
                             tree = eligibleTrees[Math.floor(Math.random() * eligibleTrees.length)];
                            }
                            let logsCut;
                            if (constore){
                                logsCut = Math.floor(Math.random() * 75) + 1;
                            }
                            else {
                                logsCut = Math.floor(Math.random() * 25) + 1;
                            }
                            const playerLogs = player.player.stuff.logs.find(l => l.name === tree.name);
                            if (!playerLogs) {
                                player.player.stuff.logs.push({
                                    id: tree.id,
                                    name: tree.name,
                                    amount: logsCut
                                });
                            } else {
                                playerLogs.amount += logsCut;
                            }

                            const woodcuttingXP = Math.abs(Math.floor(tree.xp * logsCut));
                            player.player.woodcutting.xp += woodcuttingXP;
                            player.player.woodcutting.totalxp += woodcuttingXP;

                            let fishingMessage = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle(`${EMOJICONFIG.axe2} Woodcutting Results`);
                            let fields = [];
                            fields.push({ name: `You Chopped`, value: `${EMOJICONFIG.wood2} ${logsCut} ${tree.name}`});
                            fields.push({ name: `XP Gained`, value: `${woodcuttingXP} XP`});
                

                            const party = await Party.findOne({ member: { $elemMatch: { id: message.author.id } } });
                            let sharedXpPercentage = 0;
                            let inparty = false;            
                            if (party && party.member.length > 1) {
                                inparty = true;
                            const additionalXPPerMember = Math.floor(woodcuttingXP * 0.02);
                            const totalAdditionalXP = Math.min(additionalXPPerMember * party.member.length, Math.floor(woodcuttingXP * 0.10));
                            sharedXpPercentage = (totalAdditionalXP / woodcuttingXP) * 100;

                           //     for (const member of party.member) {
                                    let promises = party.member.map(async member => {
                                    if (member.id === message.author.id) Promise.resolve();
                                    let memberBalance = await PLAYER.findOne({ userId: member.id });
                                    if (memberBalance) {
                                    memberBalance.player.woodcutting.xp += totalAdditionalXP;
                                    memberBalance.player.woodcutting.totalxp += totalAdditionalXP;
                                    /*
                                    let xpNeeded = xpToNextLevel(memberBalance.player.woodcutting.level);
                                    let initialLevel = memberBalance.player.woodcutting.level;
                                    while (memberBalance.player.woodcutting.xp >= xpNeeded) {
                                        if (memberBalance.player.woodcutting.level < 120) {
                                            memberBalance.player.woodcutting.level += 1;
                                            memberBalance.player.woodcutting.xp -= xpNeeded;
                                            xpNeeded = xpToNextLevel(memberBalance.player.woodcutting.level);

            
                                        }
                                    }
                                    if (memberBalance.player.woodcutting.level > initialLevel) {
                                    const logChannel = client.channels.cache.get('1169491579774443660');
                                    var now = new Date();
                                    var date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                                    var messageEmbed = new EmbedBuilder()
                                    .setColor('#D5EB0D')
                                    .setTitle(`Log ${date}`)
                                    .setDescription(`${EMOJICONFIG.axe2} ${inlineCode(member.pseudo)} is now woodcutting level **${memberBalance.player.woodcutting.level}**!`);
                                    logChannel.send({embeds: [messageEmbed], ephemeral: true });
                                }
                                */
                                 await memberBalance.save();
                            }
                        });
                        await Promise.all(promises);
                
                //        }
                    }



                            let xpNeeded = xpToNextLevel(player.player.woodcutting.level);
                            if (player.player.woodcutting.xp >= xpNeeded) {
                                if (player.player.woodcutting.level >= 120) {
                                }
                                else if (player.player.woodcutting.level <= 120) {

                                    while (player.player.woodcutting.xp >= xpToNextLevel(player.player.woodcutting.level)) {
                                        player.player.woodcutting.level += 1;
                                        let xpNeeded = xpToNextLevel(player.player.woodcutting.level - 1);
                                        if (player.player.woodcutting.xp >= xpNeeded) {
                                            player.player.woodcutting.xp -= xpNeeded;
                                        } else {
                                            player.player.woodcutting.xp = 0;
                                        }
                                    }                                       

                    
                                    fields.push({ name: `Congratulations! You leveled up!`, value: `Your new level is ${player.player.woodcutting.level}.\n`});
                                    if(inparty) fields.push({ name: `XP Shared With Party`, value: `${sharedXpPercentage.toFixed(0)}%\n`});
                                const logChannel = client.channels.cache.get('1169491579774443660');
                                var now = new Date();
                                var date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                                var messageEmbed = new EmbedBuilder()
                                .setColor('#D5EB0D')
                                .setTitle(`Log ${date}`)
                                .setDescription(`${EMOJICONFIG.axe2} ${inlineCode(user.username)} is now woodcutting level **${player.player.woodcutting.level}**!`);
                                logChannel.send({embeds: [messageEmbed], ephemeral: true });
                    

                            } } else {
                                if(inparty) fields.push({ name: `XP Shared With Party`, value: `${sharedXpPercentage.toFixed(0)}%\n`});
                            }

                            fishingMessage.addFields(fields);
                            message.reply({ embeds: [fishingMessage] });
                        
                        player.player.energy -= 2;
                        await player.save();
                        } catch (err) {
                            console.log(err);
                        }
                    }
            //    });
            }
            catch (error) {
                console.log(error);
            };
        }
    },

    info: {
        names: ['woodcut', 'chop', 'cut'], // Add more aliases as needed
    }
}