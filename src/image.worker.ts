import log from "./logger";
import finder from "./finder";
import includedWorker from "./included.worker";
import got, { Progress, ToughCookieJar } from "got";
import {
  patreonPostPageObject,
  patreonDownloadableContent,
} from "../@types/patreonPost";
import { URL } from "url";
import { CookieJar } from "tough-cookie";
import { promisify } from "util";
import fs, { createWriteStream } from "fs";
import stream from "stream";
import { env } from "process";
import { join } from "path";
import Gauge from "gauge";

export default class imageWorker extends finder {
  public campaignID: string;
  public targetThumbnailImageUrl: URL;
  private cookieJar: ToughCookieJar;
  private count: number;
  private objLength: number;

  constructor(sessionId: string, target: string) {
    super(sessionId, target);
    let cookieJar = new CookieJar();
    let setCookie = promisify(cookieJar.setCookie.bind(cookieJar));
    setCookie(
      `session_id=${this.sessionId}; Path=/; Domain=.patreon.com; Expires=Sat, 12 Feb 2050 15:53:14 GMT;`,
      "https://www.patreon.com/"
    );
    this.cookieJar = cookieJar;
  }

  async getDownloadableContentList(campaignID: number) {
    log(`getDownloadableContentList >> Session ID: ${this.sessionId}`);
    let worker = new includedWorker(this.sessionId);
    let metadata = await worker
      .downloadMetadata(
        `https://www.patreon.com/api/stream?include=attachments%2Cimages%2Cmedia&fields[post]=content%2Ccurrent_user_can_view%2Cimage%2Cpost_file%2Cpublished_at%2Cpatreon_url%2Cpost_type%2Cthumbnail_url%2Ctitle&filter[campaign_id]=${campaignID}&filter[contains_exclusive_posts=true&soft=-published_at&json-api-use-default-includes=false&json-api-version=1.0`
      )
      .then((metadata) => {
        log(`getDownloadableContentList >> OK. (${metadata.length} contents.)`);
        return metadata;
      });

    return metadata;
  }

  async getContents(contents: patreonDownloadableContent[]): Promise<boolean> {
    // 에러 핸들링 필요
    this.count = 1;
    this.objLength = contents.length;

    for await (let e of contents) {
      log(`getContents >> ${e.filename} (${e.downloadURL})`);
      await this.downloadContents(e);
      await promisify(setTimeout)(100);
    }

    log("getContents >> Download Complete!");
    return true;
  }

  private async downloadContents(downloadableObj: patreonDownloadableContent) {
    let cookieJar = this.cookieJar; // cookieJar 선언
    let pipeline = promisify(stream.pipeline); // pipeline 생성

    // UTF-8 형태의 디렉토리를 먼저 생성
    let downloadPath: string;

    // 썸네일 여부 확인 후, 썸네일은 상위 폴더에 저장하게 함.
    switch (downloadableObj.type) {
      case "media":
        downloadPath = join(
          __dirname,
          "output",
          this.target,
          "media",
          downloadableObj.filename
        );
        fs.mkdirSync(join(downloadPath, ".."), {
          recursive: true,
        });
        break;

      case "attachment":
        downloadPath = join(
          __dirname,
          "output",
          this.target,
          "attachment",
          downloadableObj.filename
        );
        fs.mkdirSync(join(downloadPath, ".."), {
          recursive: true,
        });
        break;

      default:
        throw new Error("createDownloadTask >> Unknown type");
        break;
    }

    // 파일 다운로드 로직
    // 1. downloadStream, fileWriterStream 선언
    let downloadStream = got.stream(downloadableObj.downloadURL, { cookieJar });
    let fileWriteStream = createWriteStream(downloadPath);
    let gauge: Gauge;

    if (env.IS_DEBUG_MODE === "false") {
      gauge = new Gauge();
      gauge.show(
        `(${this.count}/${this.objLength}) Downloading ${downloadableObj.filename}...`,
        0
      );
    } // Progress Bar

    // ignore MaxListenersExceededWarning
    downloadStream.setMaxListeners(0);
    fileWriteStream.setMaxListeners(0);

    // 2. downloadStream에서 Emit되는 downloadProgress Event 리스닝
    downloadStream.on("downloadProgress", (progress: Progress) => {
      if (env.IS_DEBUG_MODE === "false") {
        // ProgressBar 선언, CLI로 출력 담당
        gauge.pulse();
        gauge.show(
          `(${this.count}/${this.objLength}) Downloading ${downloadableObj.filename}...`,
          progress.percent
        );
      } else {
        log(
          `downloadStream >> Downloading... (${progress.transferred}/${progress.total})`
        );
      }
    });

    // 3. pipeline 구축: downloadStream > fileWriterStream
    await pipeline(downloadStream, fileWriteStream).then(() => {
      this.count = this.count + 1;
      if (env.IS_DEBUG_MODE === "false") gauge.hide(); // Stop Progress Bar
      return true;
    });
  }

  calculrateDownloadablePostContents(
    getPostsResult: patreonPostPageObject.RootObject
  ) {
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
