const { Events } = require("discord.js");
const { fetchLeaderboard } = require("../commands/leaderboard.js");

const parseLeaderboardUrl = url => {
    const skipIndex = url.indexOf('&skip=');
    const ascendingIndex = url.indexOf('&isInAscendingOrder=');
    const timePeriodIndex = url.indexOf('&timePeriod=');
    const userIdIndex = url.indexOf('&userId=');
    const isDateEnabledIndex = url.indexOf('&isDateEnabled=');
    const isTimeEnabledIndex = url.indexOf('&isTimeEnabled=');
    const itchGameIdIndex = url.indexOf('&itchGameId=');
    return {
        publicKey: url.substring(url.indexOf('=') + 1, url.indexOf('&') + 1),
        take: parseInt(url.substring(url.indexOf('&take=') + 6, skipIndex)),
        skip: parseInt(url.substring(skipIndex + 6, ascendingIndex)),
        ascending: url.substring(ascendingIndex + 20, timePeriodIndex) === '1',
        timePeriod: parseInt(url.substring(timePeriodIndex + 12, userIdIndex)),
        userId: url.substring(userIdIndex + 8, isDateEnabledIndex),
        isDateEnabled: url.substring(isDateEnabledIndex + 15, isTimeEnabledIndex) === '1',
        isTimeEnabled: url.substring(isTimeEnabledIndex + 15, itchGameIdIndex) === '1',
        itchGameId: url.substring(itchGameIdIndex + 12, url.length)
    }
};

const handleButton = async interaction => {
    const { publicKey, take, skip, ascending, timePeriod, userId, isDateEnabled, isTimeEnabled, itchGameId } = parseLeaderboardUrl(interaction.message.embeds[0].data.url);
    let newSkip = skip;
    if (interaction.customId === 'next-page') {
        newSkip += take;
    }
    else if (interaction.customId === 'back-page') {
        newSkip = (newSkip <= 0) ? 0 : newSkip - take;
    }
    const data = await fetchLeaderboard(publicKey, take, newSkip, ascending, timePeriod, interaction.user.id, isDateEnabled, isTimeEnabled, itchGameId, false);
    if (data.error) {
        await interaction.reply({ embeds: [data.embed], ephemeral: true });
        return;
    }

    if (interaction.user.id === userId)
        await interaction.update({ embeds: [data.embed], components: [data.row]});
    else
        await interaction.reply({ embeds: [data.embed], components: [data.row], ephemeral: true});
};

const onInteractionCreate = async interaction => {
    if (!interaction.isChatInputCommand()) {
        if (interaction.isButton())
            await handleButton(interaction);
        return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
};

module.exports = {
    name: Events.InteractionCreate,
    func: onInteractionCreate
}