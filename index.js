const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const { Webhook, MessageBuilder } = require("discord-webhook-node");

const token = core.getInput("token");
const webhookUrl = core.getInput("webhook_url");
const userTable = JSON.parse(core.getInput("user_table"));

if (!token || !webhookUrl || !userTable) {
  core.setFailed("Token, userTable and Webhook URL are required inputs.");
  return;
}

const hook = new Webhook(webhookUrl);

const sendDiscord = async (message) => {
  try {
    await hook.send(message);
    core.info("디스코드 메세지 전송 정공");
  } catch (err) {
    core.setFailed(err.message);
  }
};

const reviewEmbed = ({ repoName, title, url, username }) => {
  const name = userTable[username];

  const embed = new MessageBuilder()
    .setTitle("리뷰 요청을 받았어요 🙂")
    .addField(" ", `<@${name}>`)
    .addField(` `, `[${title}](${url})`)
    .setColor("#e0b88a")
    .addField(" ", "")
    .setThumbnail(
      "https://github.com/user-attachments/assets/23ca5221-eced-471d-9525-4cdd8c18536a"
    )
    .setTimestamp();

  return embed;
};

(async () => {
  try {
    const {
      context: {
        payload: {
          pull_request: { title, html_url: prUrl },
          sender,
          requested_reviewer: requestedReviewer,
          requested_team: requestedTeam,
          repository: { full_name: repoName },
        },
      },
    } = github;

    if (!requestedReviewer) {
      core.notice(
        `Failed: 'requested_reviewer' does not exist. Looks like you've requested a team review which is not yet supported. The team name is '${requestedTeam.name}'.`
      );

      return;
    }

    const { login } = requestedReviewer; // username

    core.notice(`Sender: ${sender.login}, Receiver: ${login}, PR: ${prUrl}`);
    core.info(`'${sender.login}' requests a pr review for ${title}(${prUrl})`);
    core.info(`Sending a discord msg to '${(login, userTable[login])}'...`);

    await sendDiscord(
      reviewEmbed({ repoName, title, url: prUrl, username: login })
    );

    core.info("Successfully sent");
    core.notice("Successfully sent");
  } catch (error) {
    core.setFailed(error.message);
  }
})();
