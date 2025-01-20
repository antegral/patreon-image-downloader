import got, { ToughCookieJar } from "got";
import log from "./logger";
import { CookieJar } from "tough-cookie";
import { promisify } from "util";
import { writeFileSync } from "fs";
import { join } from "path";
import {
  patreonPostIncludeObject,
  patreonDownloadableContent,
} from "../@types/patreonPost";

export default class includedWorker {
  private metadataPieces: Array<patreonPostIncludeObject.RootObject[]>;
  private metadata: patreonDownloadableContent[];
  private sessionId: string;
  private downloadMetadataCnt: number;
  private cookieJar: ToughCookieJar;

  constructor(sessionId: string) {
    let cookieJar = new CookieJar();
    let setCookie = promisify(cookieJar.setCookie.bind(cookieJar));
    this.sessionId = sessionId;
    this.metadataPieces = [];
    setCookie(
      `session_id=${this.sessionId}; Path=/; Domain=.patreon.com; Expires=Sat, 12 Feb 2050 15:53:14 GMT;`,
      "https://www.patreon.com/"
    );
    this.cookieJar = cookieJar;
    this.downloadMetadataCnt = 1; // Reset Counter
  }

  async downloadMetadata(url: string) {
    log(
      `downloadMetadata >> Downloading Included List... (${this
        .downloadMetadataCnt++})`
    );

    let { body } = await got(url, {
      cookieJar: this.cookieJar,
    }).catch((reason) => {
      log("downloadMetadata >> UNEXPECTED ERROR!");
      throw new Error(reason);
    });

    if (!JSON.parse(body).links.next) {
      // Unavailable Next Link => End of Data
      this.downloadMetadataCnt = 1; // Reset Counter
      this.metadata = await this.metadataScraper(); // call metadataScraper
      return null; // return converted metadatas.
    } else if (typeof JSON.parse(body).links.next === "string") {
      // Available Next Link
      this.metadataPieces.push(JSON.parse(body).included); // Parsed된 included 객체를 this.metadataPieces에 push
      await this.downloadMetadata(`https://${JSON.parse(body).links.next}`); // 데이터에 있는 다음 링크로 재귀식 함수 호출
      return this.metadata; // return converted metadatas.
    } else {
      // Unexpected Link Parse Error
      throw new Error("downloadMetadata >> body.links.next is not string!");
    }
  }

  async metadataScraper() {
    let mergedMetadatas = this.metadataPieces.flat();
    let convedMetadatas: patreonDownloadableContent[];
    convedMetadatas = [];

    if (this.metadataPieces.length === 0) {
      throw new Error(
        "metadataScraper >> metadataPieces not found. please check your CLIENT_SESSION_ID."
      );
    }

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
          break;
        case "media":
          convedMetadatas.push({
            filename: e.attributes.file_name,
            downloadURL: e.attributes.download_url,
            type: "media",
          });
          break;
        default:
          log(
            "metadataScraper >> non-detectable or unexceptable type. ignored."
          );
          break;
      }
    }

    return convedMetadatas;
  }

  writeFile(data: patreonDownloadableContent[]) {
    saveMetadata(data);
  }
}

export const saveMetadata = (data: patreonDownloadableContent[]) => {
  writeFileSync(
    join(__dirname, "../", "output.json"),
    Buffer.from(JSON.stringify(data), "utf-8")
  );
  log("saveMetadata >> Saved patreonDownloadableContent.");
};
