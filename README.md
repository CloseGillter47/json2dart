# json2dart 可以将JSON报文生成 Dart Model

将 JSON 文件生成 Dart 中的 Model 类

> 注意！！！ 这是 Typescript 模版解析生成的 dart 代码，并不能保证 dart 代码完全可用，当然如果你是按照我们的规范来的话，肯定是可以的 😂

## Features

首次运行需要先执行初始化命令 ` json2dart demo` ，这个命令主要作用是生成插件的配置文件`iproject.yaml`

```yaml
json2dart:
  json: json									# json文件存放位置
  output: lib/plugins/models	# dart文件输出位置
  pascal_case_class: true			# 大驼峰的类名
  camel_case_fields: true			# 小驼峰的属性名
```

如果需要修改默认值，请修改项目根目录（你运行该命令的根目录）下面的`iproject.yaml`

之后在你的json文件存放位置放入json文件，json文件可以参考下面的例子

> 正常用可以忽略下面的配置，下面属于高级一点用法

```json
	{
  // * 双下划线开头为配置变量

  // * 统一配置，可以将下面的命令用一条来表示，【;】分割
  "__": "__import:demo.dart;__toJSON:toString;__ignore:auto;",

  // * 自定义类导入【非该插件生成的类】
  "__import": "demo.dart",

  // * 自定义json输出方法 json 序列化会用到
  "__toJSON": "toString",

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
}
```

将您的文件放好后运行命令`json2dart update` 即可在输出文件夹下找到生成的dart代码文件

## Requirements

VScode 编辑器

## Extension Commands

目前有一下两个命令

* `json2dart demo`: 初始化配置文件
* ` json2dart update`: 通过json文件夹下的json文件来更新生成的dart代码

## Known Issues

1. 生成 SQLite命令还未完成...

## Release Notes

通过一个vscode命令就可以生成dart model 代码

### 0.0.1

1. json转dart Model

