const defaultEmbedColor = 0x6093d0;

const serverUrl = 'https://lcv2-server.danqzq.games/';
const authorIconUrl = 'https://img.itch.zone/aW1nLzEwNDYwMzM2LmdpZg==/35x35%23/47%2FqH8.gif';

const getRequestStatusToMessage = {
    200: 'OK',
    404: 'Leaderboard not found',
    500: 'Internal server error'
}

const rankToEmoji = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
}

module.exports = {
    serverUrl,
    defaultEmbedColor,
    getRequestStatusToMessage,
    rankToEmoji,
    authorIconUrl,
}