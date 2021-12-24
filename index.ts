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
import logUpdate from "log-update";
import { writeFileSync } from "fs";
import { join } from "path";

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

  let targetUrl = await imgWorker.getSearchResult(true).then((url: URL) => {
    spinner.color = "green";
    spinner.text = " 🚀  Target Found! > Extracting Campaign ID...";

    return url;
  });

  let campaignID = await imgWorker
    .extractUserCampaignId(targetUrl)
    .then((cid) => {
      spinner.color = "green";
      spinner.text =
        " 🔭  Extracted Campaign ID! > Downloading post metadatas...";

      return cid;
    });

  await imgWorker.getDownloadableContent(campaignID).then((metadata) => {
    spinner.color = "yellow";
    spinner.text =
      " 🧲  Downloaded post metadatas! > Starting download services...";

    setTimeout(() => {
      imgWorker.downloadContents(metadata).then((isDownloaded) => {
        if (isDownloaded) {
          console.log("Download Completed!");
        }
      });
    }, 10000);
  });
}

/*
      campaignID,
      async (res: patreonDownloadableContent[]) => {
        if (env.IS_DEBUG_MODE !== "true") {
          spinner.stop();
          console.log(` 🧲  Collected metadatas! (${res.length} images)`);
        }
        setTimeout(() => {
          imgWorker.downloadContents(res);
        }, 10000); 


*/

/*
private petchData = [];
private petchIncluded = [];
private convertedIncludedObject = [];
private runCount: number; // + 1

private async linkExplorer() {
  if (env.IS_DEBUG_MODE === "true")
    log(`DEBUG > getPosts > Downloading Pages... (${runCount++})`);
  let { body } = await got(nextLink, {
    cookieJar,
  });
  if (!JSON.parse(body).links.next) {
    // Unavailable Next Link
  } else if (typeof JSON.parse(body).links.next === "string") {
    // Available Next Link
    petchData.push(JSON.parse(body).data);
    petchIncluded.push(JSON.parse(body).included);
    run(`https://${JSON.parse(body).links.next}`);
  } else {
    // Unexpected Parse Error
    if (env.IS_DEBUG_MODE === "true") log("Error!");
    callback(null);
  }
}
*/

// return new Promise((resolve, reject) => {
//   // Include 객체안에 있는게 Attachment
//   // PostFile은 그냥 Thumbnail로 추측
//   // run URL에 있는건 수정해서 include도 받아오게 해야 함...

//   log(
//     `DEBUG > getIncludedList > run > Last petchData / petchIncluded array push`
//   );

//   petchIncluded.push(JSON.parse(body).included);
//   petchIncluded = petchIncluded.flat();

//   resolve(true);
// })
//   .then(() => {
//     log(
//       `DEBUG > getIncludedList > run > includedObjectProcess > unprocessed count: ${petchIncluded.length})`
//     );
//     // included object process (only attachment | media)
//     return petchIncluded.forEach((e: patreonPostIncludeObject.RootObject) => {
//       switch (e.type) {
//         case "attachment":
//           convertedIncludedObject.push({
//             filename: e.attributes.name,
//             downloadURL: e.attributes.url,
//             type: "attachment",
//           });
//           // if(env.IS_DEBUG_MODE === "true") log(`DEBUG > getPosts > run > RETURN attachment`);
//           break;

//         case "media":
//           convertedIncludedObject.push({
//             filename: e.attributes.file_name,
//             downloadURL: e.attributes.download_url,
//             type: "media",
//           });
//           // if(env.IS_DEBUG_MODE === "true") log(`DEBUG > getPosts > run > RETURN media`);
//           break;

//         default:
//           return null;
//       }
//     });
//   })
//   .then(async () => {
//     log(
//       `DEBUG > getIncludedList > run > includedObjectProcess > processed count: ${convertedIncludedObject.length}`
//     );
//     for await (let e of convertedIncludedObject) {
//       if (ConvSetObj.has(e) === true) {
//         log(
//           `DEBUG > getIncludedList > run > excludeDuplicatedObjectProcess > true (Duplicated Data)`
//         );
//       } else {
//         /* log(
//           `DEBUG > getPosts > run > excludeDuplicatedObjectProcess > FALSE (NEW)`
//         ); */
//         Conv.push(e);
//         ConvSetObj = new Set(Conv);
//       }
//     }
//   })
//   .then(() => {
//     log(
//       `DEBUG > getIncludedList > run > excludeDuplicatedObjectProcess > unduplicated count: ${Conv.length}`
//     );
//     log(`DEBUG > getIncludedList > run > Downloadable Object Generated.`);
//     savePostLinks(Conv);
//     // callback(Conv);
//     return Conv;
//   });
