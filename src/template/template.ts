/* eslint-disable @typescript-eslint/naming-convention */

export const JSON_DEMO = {
  // * 双下划线开头为配置变量
  // * 配置限定属性 忽略该json文件不转换
  "__": true,
  // * 自定义类导入
  "__import": "demo.dart",
  // * 自定义json输出方法 json 序列化会用到
  "__toJSON": "toString",

  // * 是否生成 SQLite 语句
  "__SQLite": false,

  // 单下划线开头的变量忽略不输出
  "_ignore": null,

  // 无法解析的值默认类型为 dynamic
  "prop0": null,

  // 这是 num 类型
  "prop1": 1,

  // 这是 double 类型
  "prop2": 1.0,

  // 这是bool 类型
  "prop3": false,

  // 这是字符串类型
  "prop4": "dynamic",

  // $ 为解析字符 这里会解析后面的类型, 这里是 dynamic
  "prop5": "$dynamic",

  // 系统内内置类型 DateTime 
  "prop6": "$DateTime",

  // 自定义类型必须用 $开头
  "prop7": "$Model",

  // 数组类型
  "prop8": "[]$dynamic",

  // 支持多个配置，分号【;】分割，
  // import 自定义该类的导入文件
  // cast 数组专用 自动转换类型
  // json 序列化的来源方法 默认是 [toJson]
  "prop9": "[]$Model;import:./models/demo.dart;cast:$String;json:toString",
};