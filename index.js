"use strict";

//imports
const {
  getTwitchAuthProvider,
  createChatClient,
  createApiClient,
  refundChannelPointRedeem,
} = require("./twitch.js");
const {
  createSpotifyClient,
  extractSongIdFromSpotifyUrl,
  createOrGetTodayPlaylist,
} = require("./spotify.js");
const { redeemIds } = require("./config.js");

//Checks if a chat message is a channel point song redeem
function songRedeemHandler(
  chatClient,
  twitchApiClient,
  spotifyClient,
  playlist,
) {
  chatClient.onMessage(async (channel, user, text, msg) => {
    if (
      //msg.isRedemption &&
      msg.rewardId === redeemIds.song
    ) {
      try {
        const songId = extractSongIdFromSpotifyUrl(text);
        const response = await spotifyClient.playlists.addItems(playlist.id, [
          "spotify:track:" + songId,
        ]);
        if (response === "") {
          if (
            refundChannelPointRedeem(
              twitchApiClient,
              msg.channelId,
              msg.rewardId,
              redeemIds.song,
            )
          ) {
            chatClient.say(
              channel,
              `@${user} Error adding song to playlist, channel point had been refunded.`,
            );
          } else {
            chatClient.say(
              channel,
              `@${user} Error adding song to playlist, channel point refund failed.`,
            );
          }
        } else {
          const track = await spotifyClient.tracks.get(songId);
          if (track !== null) {
            chatClient.say(
              channel,
              `@${user} track ${track.name} had been added to playlist`,
            );
          }
          //chatClient.say()
        }
      } catch (err) {
        console.log(err);
        if (
          refundChannelPointRedeem(
            twitchApiClient,
            msg.channelId,
            msg.rewardId,
            redeemIds.song,
          )
        ) {
          chatClient.say(
            channel,
            `@${user} error getting ID from URL, please check that you are requesting a song track from Spotify. Channel points had been refunded`,
          );
        } else {
          chatClient.say(
            channel,
            `@${user} Error finding song, please make sure that the URL provided is a song track from Spotify. Channel point refund failed.`,
          );
        }
      }
    }
  });
}

(async () => {
  const twitchAuthProvider = await getTwitchAuthProvider();
  const twitchApiClient = createApiClient(twitchAuthProvider);
  const chatClient = createChatClient(twitchAuthProvider);

  const spotifyClient = await createSpotifyClient();
  const playlist = await createOrGetTodayPlaylist(spotifyClient);

  songRedeemHandler(chatClient, twitchApiClient, spotifyClient, playlist);
})();
