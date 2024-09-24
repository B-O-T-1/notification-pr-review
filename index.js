const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const { Webhook, MessageBuilder } = require("discord-webhook-node");

const token = core.getInput("token");
const hook = new Webhook(core.getInput("webhook_url"));

if (!token || !webhookUrl) {
  core.setFailed("Token and Webhook URL are required inputs.");
  return;
}

const fetchUser = (url) =>
  axios({
    method: "get",
    headers: {
      Authorization: `token ${token}`,
    },
    url,
  }).then((res) => res.data);

const sendDiscord = async (message) => {
  try {
    await hook.send(message);
    core.info("디스코드 메세지 전송 정공");
  } catch (err) {
    core.setFailed(err.message);
  }
};

const reviewEmbed = ({ repoName, title, url, email }) => {
  let [name] = email.split("@")[0];
  if (core.getInput("user_table")) {
    const userTable = JSON.parse(core.getInput("user_table"));
    name = userTable[name];
  }

  const embed = new MessageBuilder()
    .setTitle("리뷰 요청을 받았어요 😊")
    .setDescription(`@${name} 님에게 새로운 리뷰 요청이 도착했습니다`)
    .addField(`${repoName}`, `[${title}](${url})`)
    .setColor("#e0b88a")
    .addField(" ", "")
    .setThumbnail("https://avatars.githubusercontent.com/u/164152763?s=200&v=4")
    .setFooter(
      "코테스터디 봇",
      "https://avatars.githubusercontent.com/u/164152763?s=200&v=4"
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

    const { login, url } = requestedReviewer;

    core.notice(`Sender: ${sender.login}, Receiver: ${login}, PR: ${prUrl}`);
    core.info(`'${sender.login}' requests a pr review for ${title}(${prUrl})`);
    core.info(`Fetching information about '${login}'...`);

    const { email } = await fetchUser(url);

    core.info(`Sending a slack msg to '${login}'...`);

    if (!email) {
      core.warning(`Failed: '${login}' has no public email.`);
      core.notice(`Failed: '${login}' has no public email.`);

      return;
    }

    await sendDiscord(reviewEmbed({ repoName, title, url: prUrl, email }));

    core.info("Successfully sent");
    core.notice("Successfully sent");
  } catch (error) {
    core.setFailed(error.message);
  }
})();
