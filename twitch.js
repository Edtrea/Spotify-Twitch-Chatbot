"use strict";
//Import twurple twitch api library
const { RefreshingAuthProvider } = require("@twurple/auth");
const { ChatClient } = require("@twurple/chat");
const { ApiClient } = require("@twurple/api");
const { promises } = require("fs");

const { twitchConfig } = require("./config.js");

//Authenicate to twitch
async function getTwitchAuthProvider() {
  const clientId = twitchConfig.clientId;
  const clientSecret = process.env["TWITCH_SECRET"];
  const tokenData = JSON.parse(
    await promises.readFile("./tokens.125328655.json", "utf-8"),
  );

  const authProvider = new RefreshingAuthProvider({ clientId, clientSecret });
  authProvider.onRefresh(
    async (userId, newTokenData) =>
      await promises.writeFile(
        `./tokens.${userId}.json`,
        JSON.stringify(newTokenData, null, 4),
        "utf-8",
      ),
  );

  await authProvider.addUserForToken(tokenData, ["chat"]);
  return authProvider;
}

//Use authProvider to connect to Twitch chat
function createChatClient(authProvider) {
  const chatClient = new ChatClient({
    authProvider,
    channels: twitchConfig.channels,
  });
  chatClient.connect();
  return chatClient;
}

//Use authProvider to connect to Twitch API client
function createApiClient(authProvider) {
  const twitchApiClient = new ApiClient({ authProvider: authProvider });
  return twitchApiClient;
}

//refund a specific channel point message redeem by message ID and redemption ID
async function refundChannelPointRedeem(
  twitchApiClient,
  broadcaster,
  rewardId,
  redemptionIds,
) {
  const response =
    await twitchApiClient.channelPoints.updateRedemptionStatusByIds(
      broadcaster,
      rewardId,
      rewardId,
      [redemptionIds],
      "CANCELED",
    );
  return response.isCanceled;
}

module.exports = {
  getTwitchAuthProvider,
  createChatClient,
  createApiClient,
  refundChannelPointRedeem,
};
