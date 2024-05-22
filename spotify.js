//Import spotify api library
const { Client } = require("spotify-api.js");

const { spotifyConfig } = require("./config.js");

//Authticate an spotify user client
async function createSpotifyClient() {
  const cliendId = spotifyConfig.clientId;
  const clientSecret = process.env["SPOTIFY_SECRET"];
  const refreshToken = spotifyConfig.refreshToken;

  const client = await Client.create({
    refreshToken: true,
    token: {
      clientID: cliendId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      redirectURL: "http://localhost",
    },
    retryOnCacheLimit: true,
  });
  //console.log(client);
  return client;
}

//Get Spotify ID of a Track from URL
function extractSongIdFromSpotifyUrl(url) {
  if (!url) {
    throw new Error("URL is undefined");
  }

  // Check if url is in a valid URL format
  try {
    new URL(url);
  } catch (_) {
    throw new Error("URL is not in valid format");
  }

  const myArray = url.split("track/");
  const ourArray = myArray[1].split("?");
  return ourArray[0];
}

//Checks if a playlist for today's stream had already been created.
//If not, create new playlist. Else, use existing playlist.
async function createOrGetTodayPlaylist(spotifyClient) {
  const playlists = await spotifyClient.user.getPlaylists();
  const numOfPlaylist = playlists.length;
  const todayDate = new Date().toDateString();

  for (let i = 0; i < numOfPlaylist; i++) {
    if (playlists[i].name === todayDate) {
      return playlists[i];
    }
  }

  return await spotifyClient.playlists.create(spotifyClient.user.id, {
    name: new Date().toDateString(),
  });
}

module.exports = {
  createSpotifyClient,
  extractSongIdFromSpotifyUrl,
  createOrGetTodayPlaylist,
};
