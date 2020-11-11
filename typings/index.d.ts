/* eslint-disable @typescript-eslint/naming-convention */

type ProjectConfig = _ProjectConfig | null;

interface _ProjectConfig {

  json2dart?: JsonConfig;

  [key: string]: any;
}

interface JsonConfig {

  /** json 文件来源 */
  json: string;

  /** dart 文件输出位置 */
  output: string;

  /** 类名大驼峰 */
  pascal_case_class?: boolean;

  /** 变量小驼峰 */
  camel_case_fields?: boolean;

  /** 生成 Model 的前缀 如：ModelUser */
  prefix?: string;

  /** 生成 Model 的后缀 如：UserModel */
  suffix?: string;
}