/* eslint-disable @typescript-eslint/naming-convention */
import * as YAML from 'yaml';
import { FileOS, Sfile } from "./fs";
import { Toast } from "./vscode";
import { DEFAULT_CONFIG } from './const';
import { sort2String, sortObjectProps } from './utils';

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
    files.forEach((file) => {
      file.class = file.name;
      file.camel_case_fields = camel;
      file.pascal_case_class = pascal;

      if (pascal) {
        const words = file.name.split(/[^a-zA-Z]+/);
        // 转换大驼峰命名
        const name = words.map(([f, ...o]) => f.toUpperCase() + o.join('')).join('');
        file.class = name;
      }
    });

    await paseJson2Dart(files);
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
    const config = await this._readProjectConfig();
    if (!config || !config.json2dart) return;
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

  [key: string]: any;
}

interface Cfile {
  class?: string;
  pascal_case_class?: boolean;
  camel_case_fields?: boolean;
}

interface Jfile extends Cfile {
  ___file?: string;
  ___path?: string;

  ___import?: string;
  ___toJSON?: string;
  ___SQLite?: boolean;
  ___ignore?: boolean | 'auto';

  ___fields?: DartProp[];

}


async function paseJson2Dart (files: (Sfile & Cfile)[] = []) {
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


      // 获取所有有效属性
      const props = Object.keys(jdart).filter((k) => k && !k.startsWith('_')).sort(sort2String);

      const fields: DartProp[] = [];
      for (const prop of props) {
        const field: DartProp = {
          prop,
          name: prop,
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

        // 小驼峰属性
        if (file.camel_case_fields) {
          const words = field.name.split(/[^a-zA-Z]+/);
          field.prop = words.map(([f, ...o], i) => (i ? f.toUpperCase() : f) + o.join('')).join('');
        }

        fields.push(field);
      }

      config.___fields = fields;

      configs.push(config);
    }
  }

  console.log({ configs });
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

