// import login from './src/login';
import imageWorker from "./src/image.worker";
import finder from "./src/finder";
import {
  patreonPostPageObject,
  patreonPostIncludeObject,
  patreonDownloadableContent,
} from "./@types/patreonPost";
import { URL } from "url";
import dotenv from "dotenv";
import { env } from "process";
import ora from "ora";

let spinner: any;

(() => {
  dotenv.config({ path: "./config.env", encoding: "UTF-8" });
  if (env.IS_DEBUG_MODE === "true") {
    spinner = { color: null, text: null };
  } else {
    spinner = ora(" 📑 Modules Init").start();
  }

  spinner.color = "yellow";
  spinner.text = " 🔭  Target Searching...";

  run();
})();

async function run() {
  // generate imageWorker
  let imgWorker = new imageWorker(env.CLIENT_SESSION_ID, env.CLIENT_TARGET);

  let targetUrl = await imgWorker.getUser(true).then((url: URL) => {
    spinner.color = "green";
    spinner.text = " 🚀  Target Found! > Extracting Campaign ID...";

    return url;
  });

  if (env.MANUAL_CAMPAIGN_ID) {
    spinner.color = "green";
    spinner.text =
      " 🔭  Manual Campaign ID detected! > Downloading post metadatas...";
  }

  let campaignID =
    env.MANUAL_CAMPAIGN_ID ||
    (await imgWorker.extractUserCampaignId(targetUrl).then((cid) => {
      spinner.color = "green";
      spinner.text =
        " 🔭  Extracted Campaign ID! > Downloading post metadatas...";

      return cid;
    }));

  imgWorker.getDownloadableContentList(campaignID).then((metadata) => {
    spinner.color = "yellow";
    spinner.text = " 🧲  Downloaded post metadatas! > Starting download...";

    setTimeout(() => {
      if (env.IS_DEBUG_MODE === "false") spinner.stop();
      imgWorker.getContents(metadata).then((isDownloaded) => {
        if (isDownloaded) {
          console.log("Download Completed!");
        }
      });
    }, 1000);
  });
}
