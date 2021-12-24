import log from "./logger";
import got from "got";
import { Path } from "path-parser";
import { URL } from "url";

export default class finder {
  public sessionId: string;
  public campaignID: string;
  public target: string;
  private targetSearchPathFormat: Path;
  public targetThumbnailImageUrl: URL;

  constructor(sessionId: string, target: string) {
    this.sessionId = sessionId;
    this.target = target;

    this.targetSearchPathFormat = new Path(
      "/3/eyJ3IjoyMDB9/patreon-media/p/campaign/:campaignID"
    );
  }

  async getSearchResult(isNsfw: boolean, algoliaApiKey?: string) {
    log("DEBUG > setSearchResult");
    let { body } = await got(
      `https://27qc0ib0er.algolia.io/1/indexes/campaigns_with_nsfw?query=${
        this.target
      }&page=0&hitsPerPage=1&filters=is_nsfw:${
        isNsfw === true ? 1 : 0
      }%20AND%20patron_count_indexed%20%3E=%2030&analyticsTags=search&clickAnalytics=true`,
      {
        headers: {
          "X-Algolia-API-Key": algoliaApiKey
            ? algoliaApiKey
            : "83db986a08481e94088c75fd57d90118",
          "X-Algolia-Application-Id": "27QC0IB0ER",
        },
      }
    );
    this.targetThumbnailImageUrl = new URL(JSON.parse(body).hits[0].thumb); // 특정한 경우를 위해 타겟의 Thumbnail URL을 imageWorker.targetThumbnailImageUrl 에 할당하고 접근 가능하게 함.
    return new URL(JSON.parse(body).hits[0].thumb);
  }

  async extractUserCampaignId(sourceThumbnailImageUrl: URL) {
    // sourceThumbnailImageUrl을 targetSearchPathFormat에 맞춰 URL path 단위로 parsed 시키고 도출된 값을 리턴하는 로직.
    try {
      let campaignID = this.targetSearchPathFormat.partialTest(
        sourceThumbnailImageUrl.pathname
      ).campaignID;

      log(`DEBUG > extractUserCampaignId > RETURN: ${campaignID}`);
      return campaignID; // 작업이 완료되었으면 campaignID를 return.
    } catch (err) {
      throw new Error("extractUserCampaignId > Parse Error!");
    }
  }
}
