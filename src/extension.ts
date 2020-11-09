import * as vscode from 'vscode';
import { Json2Dart } from './main';

export function activate (context: vscode.ExtensionContext) {

  /** 注册 demo 命令 */
  context.subscriptions.push(vscode.commands.registerCommand('json2dart.demo', () => {
    new Json2Dart().demo();
  }));

}

export function deactivate () {

}
