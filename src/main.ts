/* eslint-disable @typescript-eslint/naming-convention */
import * as YAML from 'yaml';
import { FileOS, Sfile } from "./fs";
import { Toast } from "./vscode";
import { DEFAULT_CONFIG } from './const';
import { sort2String, sortObjectProps } from './utils';
import { KeyMaps, TEMP_CUS_PROP_FROM_JSON, TEMP_DART_CLASS, TEMP_DART_HEAD, TEMP_IMPORT_CLASS, TEMP_LIST_CUS_PROP_FROM_JSON, TEMP_LIST_SYS_PROP_FROM_JSON, TEMP_PROP, TEMP_PROP_INIT, TEMP_PROP_LIST, TEMP_SYS_PROP_FROM_JSON } from './template/template';

String.prototype.replaceAll = String.prototype.replaceAll || function (this: string, r: string, s: string) {
  return this.replace(new RegExp(r, 'g'), s);
};

export class Json2Dart {
  constructor () {
    this._root = FileOS.workspace || '';
    this._projectPath = FileOS.combinePath(this._root, this._project);
  }

  private _root: string;
  private _project: string = '.iproject.yaml';
  private _projectPath: string;

  private _config: ProjectConfig = null;

  private async _readProjectConfig (): Promise<ProjectConfig> {
    let config: ProjectConfig = null;
    if (FileOS.existFileAsync(this._projectPath)) {
      const data = await FileOS.readFileAsync(this._projectPath);
      config = YAML.parse(data);
    }
    return config;
  }

  private async _writeProjectConfig (): Promise<ProjectConfig> {
    const config: ProjectConfig = this._config || {};
    config.json2dart = DEFAULT_CONFIG;
    await FileOS.writeFileAsync(this._projectPath, YAML.stringify(sortObjectProps(config)));

    return config;
  }

  private async _initConfig () {
    // 首次先读取配置
    if (!this._config) {
      this._config = await this._readProjectConfig();
    }

    // 如果配置不存在或者没有相关配置
    if (!this._config || !this._config.json2dart) {
      this._config = await this._writeProjectConfig();
    }
  }

  private async _build () {
    const input = FileOS.combinePath(this._root, this._config?.json2dart?.json || DEFAULT_CONFIG.json);
    const output = FileOS.combinePath(this._root, this._config?.json2dart?.output || DEFAULT_CONFIG.output);
    // 创建文件夹
    if (!await FileOS.existFileAsync(input)) {
      await FileOS.createFolderAsync(input, this._root);
    }
    // 创建文件夹
    if (!await FileOS.existFileAsync(output)) {
      await FileOS.createFolderAsync(output, this._root);
    }

    await this._buildDart(input);
  }

  private async _buildDart (input: string) {
    const files: (Sfile & Cfile)[] = await listAllJSON(input);
    const pascal = this._config?.json2dart?.pascal_case_class || true;
    const camel = this._config?.json2dart?.camel_case_fields || true;

    let prefix: string;
    let suffix: string;

    if (this._config?.json2dart?.prefix) {
      prefix = this._config.json2dart.prefix.replace(/[^a-zA-Z0-9]+/g, '');
      if (/[0-9]/.test(prefix.charAt(0))) prefix = prefix.slice(1);
    }

    if (this._config?.json2dart?.suffix) {
      suffix = this._config.json2dart.suffix.replace(/[^a-zA-Z0-9]+/g, '');
    }

    files.forEach((file) => {
      file.dart = (this._config?.json2dart?.output ?? '') + '/' + file.name + '.dart';
      file.class = file.name;

      if (prefix) { file.class = `${prefix}_${file.class}`; }
      if (suffix) { file.class = `${file.class}_${suffix}`; }

      file.camel_case_fields = camel;
      file.pascal_case_class = pascal;

      if (pascal) {
        const words = file.class.split(/[^a-zA-Z]+/);
        // 转换大驼峰命名
        const name = words.map(([f, ...o]) => f.toUpperCase() + o.join('')).join('');
        file.class = name;
      }
    });

    const libs = await paseJson2Dart(files);

    await buildDartCodeFromConf(libs, async (f, data) => {
      const file = FileOS.combinePath(this._root, f);
      const folder = FileOS.dirname(file);

      FileOS.createFolderAsync(folder, this._root);
      await FileOS.writeFileAsync(file, data);
    });

    Toast.message('已完成 json 转换 model');
  }


  /**
   * demo
   */
  public async demo () {
    await this._initConfig();
    await this._build();
  }

  /**
   * update
   */
  public async update () {
    this._config = await this._readProjectConfig();
    if (!this._config || !this._config.json2dart) return;
    await this._build();
  }
}

/**
 * 文件夹内所有json文件
 * @param folder 文件夹
 */
async function listAllJSON (folder: string): Promise<Sfile[]> {
  let json: Sfile[] = [];
  const list = await FileOS.listFileAsync(folder);

  for await (const it of list) {
    if (it.isFile) {
      if (it.ext.toLowerCase() === '.json') json.push(it);
    } else {
      const ll = await listAllJSON(it.path);
      json = [...json, ...ll];
    }
  }

  return json;
}

interface Jdart {
  __?: string;
  __import?: string;
  __toJSON?: string;
  __SQLite?: boolean;
  __ignore?: boolean | 'auto';

  __fromJSON?: string;

  [key: string]: any;
}

interface Cfile {
  dart?: string;
  class?: string;
  pascal_case_class?: boolean;
  camel_case_fields?: boolean;
}

interface Jfile extends Cfile {
  ___file?: string;
  ___path?: string;
  ___dart?: string;

  ___import?: string;
  ___toJSON?: string;
  ___SQLite?: boolean;
  ___ignore?: boolean | 'auto';
  ___fromJSON?: string;

  ___fields?: DartProp[];

}


/** 将文件配置解析为代码生成配置 */
async function paseJson2Dart (files: (Sfile & Cfile)[] = []): Promise<Jfile[]> {
  const configs: Jfile[] = [];

  for await (const file of files) {
    const data = await FileOS.readFileAsync(file.path);

    let jdart: Jdart | null;

    try {
      jdart = JSON.parse(data);
    } catch (error) {
      jdart = null;
    }

    if (jdart && !Array.isArray(jdart) && Object.keys(jdart).length) {

      const config: Jfile = {
        ___dart: file.dart,
        ___file: file.name,
        ___path: file.path,

        class: file.class,
        pascal_case_class: file.camel_case_fields,
        camel_case_fields: file.camel_case_fields,
      };

      // 解析内置配置
      if (jdart.__) {
        if (typeof jdart.__ !== 'string') {
          delete jdart.__;
        } else {
          const keyVals = jdart.__.replace(/\s+/g, '').split(';');
          for (const keyVal of keyVals) {
            const [k, v] = keyVal.split(':');
            if (k.startsWith('__')) {
              jdart[`_${k}`] = v === 'true' ? true : (v === 'false' ? false : v);
            }
          }
        }
      }

      config.___ignore = jdart.__ignore;
      config.___toJSON = jdart.__toJSON || 'toJSON';
      config.___fromJSON = jdart.__fromJSON || 'fromJSON';

      // 获取所有有效属性
      const props = Object.keys(jdart).filter((k) => k && !k.startsWith('_')).sort(sort2String);

      const fields: DartProp[] = [];
      for (const prop of props) {
        const field: DartProp = {
          prop,
          name: prop,
          from: '',
          type: DartTypes.dynamic,
          import: '',
          isModel: false,
        };

        const tp = typeof jdart[prop];
        if (tp === 'boolean') {
          field.type = DartTypes.bool;
        } else if (tp === 'number') {
          field.type = `${jdart[prop]}`.includes('.') ? DartTypes.double : DartTypes.int;
        } else if (tp === 'string') {
          field.type = DartTypes.String;
          const val = jdart[prop] as string;

          // []$Model;import:./models/demo.dart;cast:$String;json:toString
          const [_type, ...oth] = val.replace(/\s+/g, '').split(';');

          // 类型处理
          if (_type) {
            // []$dynamic
            const [_l, _t] = _type.split('$');
            // 是[]
            if (_l && _l === '[]') {
              field.isList = true;
            }

            if (_t) {
              // 内置类型
              if (Object.keys(DartTypes).includes(_t)) {
                field.type = DartTypes[_t];
              } else {
                field.type = _t;
                field.isModel = true;
              }
            }
          }
          // ['import:./models/demo.dart','cast:$String','json:toString']
          if (oth) {
            for (const ot of oth) {

              // 'import:./models/demo.dart'
              const [_c, _v] = ot.split(':');
              if (_c && _v) {
                if (JPropConfKeys.includes(_c)) {
                  field[_c] = field[_c] || _v;
                }
              }
            }
          }

        }

        if (field.isModel) {
          field.from = field.from || 'fromJSON';
        }

        // 小驼峰属性
        if (file.camel_case_fields) {
          const words = field.name.split(/[^a-zA-Z]+/);
          field.prop = words.map(([f, ...o], i) => (i ? f.toUpperCase() : f) + o.join('')).join('');
        }

        fields.push(field);
      }

      config.___fields = fields.sort((a, b) => (a.isList as any) ^ 0 - (b.isList as any) ^ 0);

      configs.push(config);
    }
  }

  // 再遍历一遍，补全自定义属性的导入头
  for (const config of configs) {
    for (const field of config.___fields ?? []) {
      // 自定义属性
      if (field.isModel) {
        // 类型和自己的类名相同
        if (field.type === config.class) {
          field.json = config.___toJSON;
        } else {
          // 在当前库中查找对应的类
          const tar = configs.find((c) => c.class === field.type);
          if (tar && tar.___dart && config.___dart) {
            field.import = fileImportPath(config.___dart, tar.___dart);
          }
        }
      }
    }
  }

  return configs;
}

type fileCallback = (file: string, buffer: string) => Promise<void>;

/** 根据配置生成具体代码 */
async function buildDartCodeFromConf (libs: Jfile[], cb: fileCallback) {

  for await (const lib of libs) {

    let buffer: string = TEMP_DART_CLASS;
    // 类属性
    const props: string[] = [];
    // 导入头文件
    const imports: string[] = [];
    // 构造属性
    const init_props: string[] = [];
    // json赋值
    const props_maps: string[] = [];

    for (const field of lib.___fields ?? []) {
      // 自定义属性需要导入头文件
      if (field.isModel && field.import) {
        imports.push(
          TEMP_IMPORT_CLASS.replaceAll(KeyMaps.dart_file, field.import),
        );
      }

      props.push(
        (field.isList ? TEMP_PROP_LIST : TEMP_PROP)
          .replaceAll(KeyMaps.prop_type, field?.type || '')
          .replaceAll(KeyMaps.dart_prop, field?.prop || '')
      );

      init_props.push(
        TEMP_PROP_INIT.replaceAll(KeyMaps.dart_prop, field?.prop ?? '')
      );

      const formJson = !field.isList
        ? field.isModel ? TEMP_CUS_PROP_FROM_JSON : TEMP_SYS_PROP_FROM_JSON
        : field.isModel ? TEMP_LIST_CUS_PROP_FROM_JSON : TEMP_LIST_SYS_PROP_FROM_JSON;

      props_maps.push(
        formJson
          .replaceAll(KeyMaps.dart_prop, field?.prop || '')
          .replaceAll(KeyMaps.json_prop, field?.name || '')
          .replaceAll(KeyMaps.prop_type, field?.type || '')
          .replaceAll(KeyMaps.from_json, field?.from || '')
      );
    }

    // imports 需要去重
    let import_data = Array.from(new Set(imports)).join('\n');

    const props_data = props.join('\n');

    const init_data = init_props.join('\n');

    const json_data = props_maps.join('\n');


    buffer = buffer
      .replaceAll(KeyMaps.props_init, init_data)
      .replaceAll(KeyMaps.class_name, lib?.class || '')
      .replaceAll(KeyMaps.from_json, lib?.___fromJSON || '')
      .replaceAll(KeyMaps.dart_from_json, json_data)
      .replaceAll(KeyMaps.props_list, props_data)
      ;

    // buffer = TEMP_DART_HEAD + import_data + buffer;
    if (import_data) {
      import_data += '\n\n';
    }

    buffer = import_data + buffer;

    await cb(lib?.___dart ?? '', buffer);
  }
}


function fileImportPath (from: string, to: string): string {
  let res: string = '';
  if (from && to) {
    res = FileOS.relative(from, to);
    const f = FileOS.dirname(res);
    if (f === '..') {
      res = FileOS.basename(to);
    }
  }

  return res;
}

const DartTypes: IDartTypes = {
  dynamic: 'dynamic',
  num: 'num',
  int: 'int',
  double: 'double',
  bool: 'bool',
  String: 'String',
  // List: 'List',
  // Object: 'Object',
};

interface IDartTypes {
  [key: string]: string;
}

interface DartProp {
  name: string;
  prop?: string;
  type?: string;
  from?: string;
  json?: string;

  import?: string;
  isList?: boolean;
  isModel?: boolean;

  [key: string]: any;
}

const JPropConfKeys = ['import', 'from', 'json'];

