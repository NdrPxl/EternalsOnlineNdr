const Discord = require('discord.js');
const Player = require('../../modules/player.js');
const Areas2 = require('../../config/areas.json');
const Areas = require('../../modules/area.js');
const { bold, inlineCode, codeBlock } = require('@discordjs/builders');
const { prefix } = require('../../App/config.json')
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Message, Events, ButtonStyle, ComponentType, StringSelectMenuBuilder } = require('discord.js');
const {client} = require('../../App/index.js');
const EMOJICONFIG = require('../../config/emoji.json');

module.exports = {
    name: Events.MessageCreate,
    /**
     * @param {Message} message
     */
    async execute(message) {
        if (message.mentions.users.first() !== client.user) return;
        const args = message.content.split(/ +/).slice(1);
        const commandName = args.shift().toLowerCase();
        if (this.info.names.some(name => commandName === name)) {
     
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const newArea = args.slice(1).join(' ').toLowerCase(); // Get all arguments after the command as the area name
    const user = message.author;
    let player = await Player.findOne({ userId: user.id });
    let playerLevel = player.player.level;
    if (!player) return message.reply(`${EMOJICONFIG.no} you are not a player ! : ${inlineCode('@Eternals start')}`);
    else {
    let checkarea = newArea ? Areas2.find(area => area.name.toLowerCase() === newArea) : null;
    if (!checkarea) {
        
            const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${EMOJICONFIG.map} Travel`)
            .setDescription('choose a area to travel to');

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select-action')
                    .setPlaceholder(`Select a area`)
                    .addOptions([
                        {
                            label: 'Lumby - Level 1',
                            description: `A humble village where many adventures start their journey `,
                            value: 'lumby',
                            emoji: `${EMOJICONFIG.map}`,
                        },
                        // ... (rest of the options remain the same)
                    ]),
            );

        const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = (interaction) => interaction.user.id === message.author.id;

        const collector = sentMessage.createMessageComponentCollector({ filter, componentType: ComponentType.SelectMenu, time: 15000 });

        collector.on('collect', async (interaction) => {
            try {
           // await interaction.deferUpdate().catch(console.error);
            const selectedValue = interaction.values[0];
            let areaLevel = Areas2.find(area => area.name.toLowerCase() === selectedValue).level;
           // if (playerLevel < areaLevel) {
           //     return interaction.reply(`${EMOJICONFIG.no} You are not high enough level to enter ${selectedValue}!`);
           // }
            player.player.other.area = selectedValue;
            await player.save();
    
            var itemEmbed = new EmbedBuilder()
                .setColor('#6d4534')
                .setTitle(`${EMOJICONFIG.map} ${user.username}'s Journey`)
                .setDescription(`${client.users.cache.get(user.id).username} has traveled a long distance to reach ${selectedValue}`)
                .setTimestamp();
            await interaction.reply({embeds: [itemEmbed], ephemeral: false});
    
                            
            
        } catch (error) {
            console.log(error);
        }
        });
        collector.on('end', collected => {
            
        });
        
        return;
        }
        

    else {
        let areaLevel = Areas2.find(area => area.name.toLowerCase() === newArea).level;
        if(playerLevel < areaLevel) {
            return message.reply(`${EMOJICONFIG.no} You are not high enough level to enter ${newArea}!`);
        }

        if(player.player.other.area.toLowerCase() === newArea) {
            return message.reply(`${EMOJICONFIG.no} You are already in ${newArea}!`);
        }

        // [========== Button Travel ==========]
        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('yes')
                .setLabel('Travel')
                .setEmoji(`${EMOJICONFIG.yes}`)
                .setStyle(ButtonStyle.Success),
            
            new ButtonBuilder()
                .setCustomId('no')
                .setLabel('CANCEL')
                .setEmoji(`${EMOJICONFIG.no}`)
                .setStyle(ButtonStyle.Danger),
        );
        
        const buyItemEmbed = new EmbedBuilder()
            .setColor('#4dca4d')
            .setTitle(`${EMOJICONFIG.map} Travel to ${newArea}`)
            .setDescription(`${client.users.cache.get(user.id).username}, Travel to ${newArea}?`)
            .setTimestamp();
        const msg = await message.reply({ embeds: [buyItemEmbed], components: [row] });
                // ========== Filter & Collector ==========
                const collector = msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    max: 1,
                    time: 70_000
                });
            
                collector.on('collect', async interaction => {
                    if (interaction.customId == 'yes') {

                        player.player.other.area = newArea
                        player.save()


                        var itemEmbed = new EmbedBuilder()
                        .setColor('#6d4534')
                        .setTitle(`${EMOJICONFIG.map} ${user.username}'s Journey`)
                        .setDescription(`${client.users.cache.get(user.id).username} has traveled a long distance to reach ${newArea}`)
                        .setTimestamp()
                        await interaction.reply({embeds: [itemEmbed], ephemeral: false});

                            
                    };
                    if(interaction.customId === 'no') await interaction.reply({content: `You canceled`, ephemeral: true});
                });
            }    
        } 
    }
                         
    },
    
    
info: {
    names: ['travel', 't'],
}
}
