/* eslint-disable @typescript-eslint/naming-convention */

export const JSON_DEMO = {
  // * 双下划线开头为配置变量

  // * 配置限定属性 忽略该json文件不转换
  "__": "__import:demo.dart;__toJSON:toString;__ignore:auto;__SQLite:false;",

  // * 自定义类导入
  "__import": "demo.dart",

  // * 自定义json输出方法 json 序列化会用到
  "__toJSON": "toString",

  // * 是否生成 SQLite 语句
  "__SQLite": false,

  /** 命令执行时是否忽略该文件 */
  "__ignore": "auto",

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

  // 系统内置类型 DateTime 
  "prop6": "$DateTime",

  // 自定义类型必须用 $开头
  "prop7": "$Model",

  // 数组类型
  "prop8": "[]$dynamic",

  // 支持多个配置，分号【;】分割，格式：配置:属性;
  // 目前支持以下几个，后面看需求再陆续扩展
  // import 自定义该类的导入文件
  // cast 数组专用 自动转换类型
  // json 序列化的来源方法 默认是 [toJson]
  "prop9": "[]$Model;import:./models/demo.dart;json:toString",
};

export const TEMP_DART_HEAD = `//////////////////////////////////////////////////////////////////
///
/// vscode插件自动生成的代码，请勿手动修改，以免丢失编辑内容
///
//////////////////////////////////////////////////////////////////\n
`;

export const KeyMaps = {
  prop_type: '%PROP_TYPE',
  dart_prop: '%DART_PROP',
  json_prop: '%JSON_PROP',
  dart_file: '%DART_FILE',
  class_name: '%CLASS_NAME',
  props_init: '%PROPS_INIT',
  props_list: '%PROPS_LIST',
  from_json: '%FROM_JSON',
  to_json: '%TO_JSON',
  dart_from_json: '%DART_FROM_JSON',

};

export const TEMP_DART_CLASS = `class ${KeyMaps.class_name} {
  ${KeyMaps.class_name}({
${KeyMaps.props_init}
  });

  ${KeyMaps.class_name}.${KeyMaps.from_json}(Map json) {
${KeyMaps.dart_from_json}
  }

${KeyMaps.props_list}
}
`;

export const TEMP_IMPORT_CLASS = `import '${KeyMaps.dart_file}';`;

export const TEMP_PROP = `\t${KeyMaps.prop_type} ${KeyMaps.dart_prop};`;


export const TEMP_PROP_LIST = `\tList<${KeyMaps.prop_type}> ${KeyMaps.dart_prop};`;

export const TEMP_PROP_INIT = `\t\tthis.${KeyMaps.dart_prop},`;

export const TEMP_SYS_PROP_FROM_JSON = `\t\t${KeyMaps.dart_prop} = json['${KeyMaps.json_prop}'];\n`;

export const TEMP_CUS_PROP_FROM_JSON = `
    if (json['${KeyMaps.json_prop}'] != null) {
      ${KeyMaps.dart_prop} = ${KeyMaps.prop_type}.${KeyMaps.from_json}(json['${KeyMaps.json_prop}']);
    }
`.trimEnd();

export const TEMP_LIST_SYS_PROP_FROM_JSON = `
    if (json['${KeyMaps.json_prop}'] != null && json['${KeyMaps.json_prop}'] is List) {
      ${KeyMaps.dart_prop} = (json['${KeyMaps.json_prop}'] as List).cast<${KeyMaps.prop_type}>();
    }
`.trimEnd();

export const TEMP_LIST_CUS_PROP_FROM_JSON = `\t\tif (json['${KeyMaps.json_prop}'] != null && json['${KeyMaps.json_prop}'] is List) {
      ${KeyMaps.dart_prop} = (json['${KeyMaps.json_prop}'] as List<Map<String, dynamic>>).map<${KeyMaps.prop_type}>((Map<String, dynamic> e) => ${KeyMaps.prop_type}.${KeyMaps.from_json}(e)).toList();
    }
`.trimEnd();
