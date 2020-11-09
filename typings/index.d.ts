/* eslint-disable @typescript-eslint/naming-convention */

interface ProjectConfig {

  json?: JsonConfig;

  [key: string]: any;
}

interface JsonConfig {

  /** json 来源 */
  json: string;

  /** dart 输出位置 */
  output: string;
}