const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { serverUrl, defaultEmbedColor, getRequestStatusToMessage, rankToEmoji, authorIconUrl } = require('../constants.js')
const { itchApiKey } = require('../secrets.js')

const fetchLeaderboard = async (publicKey, take, skip, ascending, timePeriod, userId, isDateEnabled, isTimeEnabled, itchGameId, fancyStyle) => {
    const embed = new EmbedBuilder().setColor(defaultEmbedColor);
    const row = new ActionRowBuilder();

    const reload = new ButtonBuilder()
        .setCustomId('reload')
        .setLabel('🔄️')
        .setStyle(ButtonStyle.Success);

    const backPage = new ButtonBuilder()
        .setCustomId('back-page')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Secondary);

    const nextPage = new ButtonBuilder()
        .setCustomId('next-page')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Secondary);

    row.addComponents(reload, backPage, nextPage);

    if (take > 50) {
        embed.setTitle('Error').setDescription('Cannot request more than 50 entries!');
        return { error: true, embed };
    } else if (take < 0) {
        embed.setTitle('Error').setDescription('Argument \'take\' cannot be of negative value!');
        return { error: true, embed };
    }

    const url = `${serverUrl}get?publicKey=${publicKey}&take=${take}&skip=${skip}&isInAscendingOrder=${ascending ? 1 : 0}&timePeriod=${timePeriod}&userId=${userId}&isDateEnabled=${isDateEnabled ? 1 : 0}&isTimeEnabled=${isTimeEnabled ? 1 : 0}&itchGameId=${itchGameId}`;

    let res;
    try {
        res = await axios.get(url);
    } catch (error) {
        embed.setTitle('Error');
        embed.setDescription(getRequestStatusToMessage[error.response.status]);
        return { error: true, embed };
    }

    const entries = res.data;

    const title = `Leaderboard ${timePeriod === 1 ? '(Daily)' : timePeriod === 7 ? '(Weekly)' : timePeriod === 30 ? '(Monthly)' : timePeriod === 365 ? '(Yearly)' : ''}`;
    embed.setTitle(title)
        .setURL(url)
        .setFooter({ text: 'made by danqzq', iconURL: authorIconUrl })
        .setTimestamp();

    if (entries === null || entries.length === 0) {
        embed.setDescription('No entries!');
        return { error: true, embed };
    }

    let names = '';
    let scores = '';
    let dates = '';

    for (let i in entries) {
        const rank = entries[i].Rank;

        if (fancyStyle)
            names += (rank in rankToEmoji) ? rankToEmoji[rank] : '⭐';

        names += rank.toString().padStart(2, '0') + ') ';
        names += entries[i].Username + '\n';
        scores += parseInt(entries[i].Score) + '\n';

        const date = new Date(0);
        date.setUTCSeconds(entries[i].Date);

        let dateText = '';
        if (isDateEnabled)
            dateText += date.toLocaleString('en-US', { dateStyle: 'short' }) + ' ';
        if (isTimeEnabled)
            dateText += date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        dates += `${dateText}\n`;
    }

    embed.addFields(
        { name: 'Rank & Username', value: names, inline: true },
        { name: 'Score', value: scores, inline: true },
    );

    if (isDateEnabled || isTimeEnabled)
        embed.addFields({ name: 'Date & Time', value: dates, inline: true });

    if (itchGameId != 'undefined') {
        const res = await axios.get(`https://itch.io/api/1/${itchApiKey}/game/${itchGameId}`)
        const gameData = res.data.game;
        if (gameData) {
            embed.setTitle(`${gameData.title} - ${title}`);
            embed.setThumbnail(gameData.cover_url);
            embed.setAuthor({ name: gameData.user.display_name, iconURL: gameData.user.cover_url, url: gameData.user.url });

            let description = gameData.short_text;
            let supportedPlatforms = '';

            if (gameData.p_windows)
                supportedPlatforms += '<:windows:1157021695719260232>';
            if (gameData.p_osx)
                supportedPlatforms += '<:macos:1157021694364487771>';
            if (gameData.p_linux)
                supportedPlatforms += '<:linux:1157021693466902528>';
            if (gameData.p_android)
                supportedPlatforms += '<:android:1157021696629424128>';

            if (supportedPlatforms !== '')
                description += '\n\nSupported platforms:\n' + supportedPlatforms;

            embed.setDescription(description);
        }
    }

    return { embed, row };
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Gets leaderboard data based on given parameters')
        .addStringOption(option =>
            option
                .setName('public-key')
                .setDescription('The public key of your leaderboard')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('take')
                .setDescription('Amount of entries to take (default: 20, max 50)')
                .setRequired(false))
        .addIntegerOption(option =>
            option
                .setName('skip')
                .setDescription('Amount of entries to skip (default: 0)')
                .setRequired(false))
        .addBooleanOption(option =>
            option
                .setName('in-ascending-order')
                .setDescription('Returns the leaderboard in an ascending order. (Default: False)')
                .setRequired(false))
        .addIntegerOption(option =>
            option
                .setName('time-period')
                .setDescription('Will return the entries that were submitted within the time period specified (default: All Time)')
                .setRequired(false)
                .addChoices(
                    { name: 'Today', value: 1 },
                    { name: 'Weekly', value: 7 },
                    { name: 'Monthly', value: 30 },
                    { name: 'Yearly', value: 365 },
                    { name: 'All Time', value: 0 }))
        .addBooleanOption(option =>
            option
                .setName('is-date-enabled')
                .setDescription('Appends the date of submission to each entry row (default: True)')
                .setRequired(false))
        .addBooleanOption(option =>
            option
                .setName('is-time-enabled')
                .setDescription('Appends the time of submission in hours and minutes to each entry row (default: True)')
                .setRequired(false))
        .addBooleanOption(option =>
            option
                .setName('fancy-style')
                .setDescription('Adds fancy emojis to the embed 😉 (default: False)')
                .setRequired(false))
        .addBooleanOption(option =>
            option
                .setName('is-pagination-disabled')
                .setDescription('Removes browsing buttons (default: False)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('itch-game-id')
                .setDescription('Adds game info from itch.io into the embed')
                .setRequired(false)),
    async execute(interaction) {
        const publicKey = interaction.options.getString('public-key');
        const take = interaction.options.getInteger('take') ?? 20;
        const skip = interaction.options.getInteger('skip') ?? 0;
        const ascending = interaction.options.getBoolean('in-ascending-order') ?? false;
        const timePeriod = interaction.options.getInteger('time-period') ?? 0;
        const userId = interaction.user.id;
        const isDateEnabled = interaction.options.getBoolean('is-date-enabled') ?? true;
        const isTimeEnabled = interaction.options.getBoolean('is-time-enabled') ?? true;
        const itchGameId = interaction.options.getString('itch-game-id');
        const fancyStyle = interaction.options.getBoolean('fancy-style') ?? false;
        const disablePagination = interaction.options.getBoolean('is-pagination-disabled') ?? false;

        const data = await fetchLeaderboard(publicKey, take, skip, ascending, timePeriod, userId, isDateEnabled, isTimeEnabled, itchGameId, fancyStyle);

        if (data.error) {
            await interaction.reply({ embeds: [data.embed], ephemeral: true });
            return;
        }

        replyData = { embeds: [data.embed], components: [] };

        if (!disablePagination)
            replyData.components = [data.row];

        await interaction.reply(replyData);
    },
    fetchLeaderboard
};