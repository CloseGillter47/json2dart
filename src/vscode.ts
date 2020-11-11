/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';

type ToastType = 'message' | 'confirm' | 'error' | 'warn';

export class Toast {

  private static async _toast (type: ToastType, message: string, submit?: ToastButton, cancel?: ToastButton) {
    if (!message) return;

    const btns: ToastButton[] = [];

    if (submit) btns.push(submit);
    if (cancel) btns.push(cancel);

    let tar: string | undefined;

    const labels = btns.map((b) => b.label);

    if (type === 'message') {
      tar = await vscode.window.showInformationMessage(message);
    } else if (type === 'confirm') {
      tar = await vscode.window.showInformationMessage(message, ...labels);
    } else if (type === 'error') {
      tar = await vscode.window.showErrorMessage(message, ...labels);
    } else if (type === 'warn') {
      tar = await vscode.window.showWarningMessage(message, ...labels);
    }

    if (tar) {
      const btn = btns.find((b) => tar === b.label);
      if (btn) btn?.event();
    }
  }

  public static message (message: string) {
    Toast._toast('message', message);
  }

  public static confirm (message: string, submit?: ToastButton, cancel?: ToastButton) {
    Toast._toast('confirm', message, submit, cancel);
  }

  public static error (message: string, submit?: ToastButton, cancel?: ToastButton) {
    Toast._toast('confirm', message, submit, cancel);
  }

  public static warn (message: string, submit?: ToastButton, cancel?: ToastButton) {
    Toast._toast('warn', message, submit, cancel);
  }

  public static loading () {
  }
}

interface ToastButton {
  label: string;
  event: Function;
}