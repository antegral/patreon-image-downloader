import { env } from "process";
import dotenv from "dotenv";

// module로 컨버팅하고 배포시에 반드시 env 의존성 코드는 삭제.
dotenv.config({ path: "../config.env", encoding: "UTF-8" });

export default function log(message: string) {
  env.IS_DEBUG_MODE === "true" ? console.log(message) : null;
}
