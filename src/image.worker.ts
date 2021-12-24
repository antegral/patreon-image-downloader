import log from "./logger";
import finder from "./finder";
import includedWorker from "./included.worker";
import got from "got";
import {
  patreonPostPageObject,
  patreonPostIncludeObject,
  patreonDownloadableContent,
} from "../@types/patreonPost";
import { Path } from "path-parser";
import { URL } from "url";
import { CookieJar } from "tough-cookie";
import { promisify } from "util";
import fs, { createWriteStream } from "fs";
import stream from "stream";
import ora from "ora";
import ProgressBar from "progress";
import { env } from "process";
import { join } from "path";

export default class imageWorker extends finder {
  private IncludedListStorages: string[];
  public campaignID: string;
  public targetThumbnailImageUrl: URL;

  constructor(sessionId: string, target: string) {
    super(sessionId, target);
  }

  async getDownloadableContent(campaignID: number) {
    let worker = new includedWorker();
    let metadata = await worker.downloadMetadata(
      `https://www.patreon.com/api/stream?include=attachments%2Cimages%2Cmedia&fields[post]=content%2Ccurrent_user_can_view%2Cimage%2Cpost_file%2Cpublished_at%2Cpatreon_url%2Cpost_type%2Cthumbnail_url%2Ctitle&filter[campaign_id]=${campaignID}&filter[contains_exclusive_posts=true&soft=-published_at&json-api-use-default-includes=false&json-api-version=1.0`
    );
    log(`DEBUG > getIncludedList > Session ID: ${this.sessionId}`);
  }

  async downloadContents(
    contents: patreonDownloadableContent[]
  ): Promise<boolean> {
    // 에러 핸들링 필요
    log("DEBUG > downloadContents");
    let count: number = 1;
    let spinner: ora.Ora;

    return new Promise((resolve, reject) => {
      log(`DEBUG > downloadContents > Session ID: ${this.sessionId}`);
      if (env.IS_DEBUG_MODE !== "true")
        spinner = ora(
          `🛰 Downloading Contents... (${count}/${contents.length})`
        ).start();
    })
      .then(async () => {
        // if(env.IS_DEBUG_MODE === "true") { log(`DEBUG > downloadContents > ${contents[0].downloadURL} (${contents[0].filename})`) };
        for await (let e of contents) {
          this.createDownloadTask(
            e.downloadURL,
            this.target,
            e.filename,
            false,
            (res) => {
              log(`DEBUG > createDownloadTask > OK - ${res}`);
            }
          );
        }
      })
      .then(() => {
        if (env.IS_DEBUG_MODE !== "true") spinner.stop();
        log("Download Complete!");
        return true;
      });
  }

  private async createDownloadTask(
    SourceURL: string,
    path: string,
    filename: string,
    isThumbnail: boolean,
    callback
  ) {
    let cookieJar = new CookieJar();
    let setCookie = promisify(cookieJar.setCookie.bind(cookieJar));
    let pipeline = promisify(stream.pipeline); // pipeline 생성
    let bar: ProgressBar; // ProgressBar 준비

    // UTF-8 형태의 디렉토리를 먼저 생성
    let downloadPath: string;

    // 썸네일 여부 확인 후, 썸네일은 상위 폴더에 저장하게 함.
    if (isThumbnail === true) {
      downloadPath = fs.mkdirSync(join(__dirname, "output", path), {
        recursive: true,
      });
    } else {
      downloadPath = fs.mkdirSync(
        join(__dirname, "output", path, "Attachment"),
        {
          recursive: true,
        }
      );
    }

    log("DEBUG > createDownloadTask");
    await setCookie(
      `session_id=${this.sessionId}; Path=/; Domain=.patreon.com; Expires=Sat, 12 Feb 2050 15:53:14 GMT;`,
      "https://www.patreon.com/"
    );

    log("DEBUG > createDownloadTask > Downloading...");

    // 파일 다운로드 로직
    // 1. downloadStream, fileWriterStream 선언
    let downloadStream = got.stream(SourceURL, { cookieJar });
    let fileWriterStream = createWriteStream(
      join(__dirname, downloadPath, filename)
    );

    // 2. downloadStream에서 Emit되는 downloadProgress Event 리스닝
    downloadStream.on("downloadProgress", (progress) => {
      if (!bar && env.IS_DEBUG_MODE !== "true") {
        // ProgressBar 선언, CLI로 출력 담당
        bar = new ProgressBar(
          "  📥 Downloading images...\n  |:bar| :rate/kbps :percent (Remaining :etas)",
          {
            complete: "█",
            incomplete: " ",
            width: 50,
            total: progress.total,
          }
        );
      } else if (env.IS_DEBUG_MODE !== "true") {
        // 전송받은 양 전달하여, ProgressBar를 tick.
        bar.tick(progress.transferred);
      }
    });

    // 3. pipeline 구축: downloadStream > fileWriterStream
    pipeline(downloadStream, fileWriterStream)
      .then(() => {
        log("DEBUG > createDownloadTask > Complate.");
        callback(join(__dirname, downloadPath, filename)); // 저장된 파일 경로를 반환.
      })
      .catch(() => {
        callback(null);
      });
  }

  calculrateDownloadablePostContents(
    getPostsResult: patreonPostPageObject.RootObject
  ) {
    log(`DEBUG > calculrateDownloadAvailablePostContents`);
    let count: number = 1;

    getPostsResult.data.forEach((e: patreonPostPageObject.Data) => {
      if (typeof e.attributes.image?.large_url === "string") count++;
      if (typeof e.attributes.post_file?.name === "string") count++;
      if (typeof e.attributes.post_file?.url === "string") count++;
    });

    log(`imageWorker >> downloadable content count: ${count}`);
    return count;
  }
}

/* 
  // 모든 posts만 가져오고 included를 가져오는 처리는 하지 않음.
  // 이는 getIncluded에서 해당 로직을 기반으로 보강해서 재작성 했으므로 해당 기능은 주석처리 (미사용)
  async getPosts(
    campaignID: number,
    callback: (result: null | patreonPostPageObject.RootObject) => void
  ) {
    if (env.IS_DEBUG_MODE === "true") {
      log("DEBUG > getPosts");
    }

    let cookieJar = new CookieJar();
    let setCookie = promisify(cookieJar.setCookie.bind(cookieJar));

    if (env.IS_DEBUG_MODE === "true") {
      log(`DEBUG > getPosts > Session ID: ${this.sessionId}`);
    }
    await setCookie(
      `session_id=${this.sessionId}; Path=/; Domain=.patreon.com; Expires=Sat, 12 Feb 2050 15:53:14 GMT;`,
      "https://www.patreon.com/"
    );

    let petchData = [];
    let petchIncluded = [];

    let convertedIncludedObject = [];

    let runCount: number = 1;

    run(
      `https://www.patreon.com/api/stream?include=attachments%2Cimages%2Cmedia&fields[post]=content%2Ccurrent_user_can_view%2Cimage%2Cpost_file%2Cpublished_at%2Cpatreon_url%2Cpost_type%2Cthumbnail_url%2Ctitle&filter[campaign_id]=${campaignID}&filter[contains_exclusive_posts=true&soft=-published_at&json-api-use-default-includes=false&json-api-version=1.0`
    );

    async function run(nextLink: string) {
      if (env.IS_DEBUG_MODE === "true")
        log(`DEBUG > getPosts > Downloading Pages... (${runCount++})`);
      let { body } = await got(nextLink, {
        cookieJar,
      });
      if (!JSON.parse(body).links.next) {
        // Unavailable Next Link
        return new Promise((resolve, reject) => {
          // Last data push
          petchData.push(JSON.parse(body).data);
          resolve(true);
        }).then(() => {
          if (env.IS_DEBUG_MODE === "true")
            log(
              `DEBUG > getPosts > run > includedObjectProcess > processed count: ${convertedIncludedObject.length}`
            );
          let serveData: patreonPostPageObject.RootObject = {
            data: petchData.flat(),
            included: convertedIncludedObject,
            meta: {
              posts_count: petchData.flat().length,
            },
          };

          if (env.IS_DEBUG_MODE === "true")
            log(
              `DEBUG > All Pages Collected! Post/Included count : ${serveData.data.length}/${convertedIncludedObject.length}`
            );
          callback(serveData); // post를 모두 가져온다음, 코드 동기성을 위해 callback의 인자 값으로 값을 넘겨주고 호출함. (paramater의 function을 호출하고 그 인자로 결과값을 전달)
        });
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
  }
*/
