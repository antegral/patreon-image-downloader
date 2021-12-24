import got from "got";
import log from "./logger";
import { CookieJar } from "tough-cookie";
import { promisify } from "util";
import { writeFileSync } from "fs";
import { join } from "path";
import {
  patreonPostPageObject,
  patreonPostIncludeObject,
  patreonDownloadableContent,
} from "../@types/patreonPost";

export default class includedWorker {
  private metadataPieces: Array<patreonPostIncludeObject.RootObject[]>;
  private sessionId: string;
  private postDownloaderCnt: number;
  private setCookie;

  constructor() {
    let cookieJar = new CookieJar();
    this.setCookie = promisify(cookieJar.setCookie.bind(cookieJar));
  }

  async downloadMetadata(url: string) {
    let cookieJar = await this.setCookie(
      `session_id=${this.sessionId}; Path=/; Domain=.patreon.com; Expires=Sat, 12 Feb 2050 15:53:14 GMT;`,
      "https://www.patreon.com/"
    );

    log(
      `DEBUG > postDownloader > Downloading Included List... (${this
        .postDownloaderCnt++})`
    );

    let { body } = await got(url, {
      cookieJar,
    });

    if (!JSON.parse(body).links.next) {
      // Unavailable Next Link => End of Data
      this.postDownloaderCnt = 1; // Reset Counter
      let metadata = await this.metadataScraper(); // call metadataScraper
      return metadata; // return converted metadatas.
    } else if (typeof JSON.parse(body).links.next === "string") {
      // Available Next Link
      this.metadataPieces.push(JSON.parse(body).included); // petchIncluded에 post에서 추출된 included 파일을 push
      this.downloadMetadata(`https://${JSON.parse(body).links.next}`); // 데이터에 있는 다음 링크로 재귀식 함수 호출
    } else {
      // Unexpected Link Parse Error
      throw new Error("postDownloader >> links.next is not string!");
    }
  }

  async metadataScraper() {
    let mergedMetadatas: patreonPostIncludeObject.RootObject[];
    let convedMetadatas: patreonDownloadableContent[];

    if (!this.metadataPieces) {
      throw new Error(
        "metadataScraper >> metadataPieces is undefined. please check your session id."
      );
    }

    this.metadataPieces.forEach((e) => {
      mergedMetadatas.concat(e);
    });

    // include 객체 type별 imageURL Location (imageWorker)
    // media => e.attributes.download_url (Viewer에서 보여지는 원본 사진?)
    // attachment => e.attributes.url (첨부된 원본 파일?)

    for await (let e of mergedMetadatas) {
      switch (e.type) {
        case "attachment":
          convedMetadatas.push({
            filename: e.attributes.name,
            downloadURL: e.attributes.url,
            type: "attachment",
          });
        case "media":
          convedMetadatas.push({
            filename: e.attributes.name,
            downloadURL: e.attributes.download_url,
            type: "media",
          });
        default:
          log("non-detectable or unexceptable type. ignored.");
      }
    }
  }

  saveMetadata(data: patreonDownloadableContent[]) {
    writeFileSync(
      join(__dirname, "../", "output.json"),
      Buffer.from(JSON.stringify(data), "utf-8")
    );
    log("saveMetadata >> Saved patreonDownloadableContent.");
  }
}
