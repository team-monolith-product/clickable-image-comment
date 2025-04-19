// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "clickable-image-comment" is now active!'
  );

  const IMAGE_RX = /([^\s'"<>()]+\.(png|jpe?g|gif|svg))/gi;

  function resolveTarget(docUri: vscode.Uri, imgPath: string): vscode.Uri | null {
    const wsFolder = vscode.workspace.getWorkspaceFolder(docUri);

    if (!wsFolder) {
      return null;
    }

    if (path.isAbsolute(imgPath)) {
      const relativePath = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
      return vscode.Uri.joinPath(wsFolder.uri, relativePath);
    }

    const docDirUri = docUri.with({ path: path.dirname(docUri.path) });
    return vscode.Uri.joinPath(docDirUri, imgPath);
  }

  /** DocumentLinkProvider 등록 */
  const provider = vscode.languages.registerDocumentLinkProvider(
    { scheme: "*", language: "*" }, // 모든 파일에 적용
    {
      provideDocumentLinks(document) {
        const links: vscode.DocumentLink[] = [];

        const wsFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!wsFolder) {
          return links;
        }

        for (let line = 0; line < document.lineCount; line++) {
          const text = document.lineAt(line).text;
          let match: RegExpExecArray | null;

          while ((match = IMAGE_RX.exec(text))) {
            const imgPath = match[1];
            // http/https로 시작하는 URL은 건너뛰기
            if (imgPath.match(/^https?:\/\//i)) {
              continue;
            }
            const start = new vscode.Position(line, match.index);
            const end = new vscode.Position(line, match.index + imgPath.length);
            const range = new vscode.Range(start, end);

            const target = resolveTarget(document.uri, imgPath);
            if (target) {
              links.push(new vscode.DocumentLink(range, target));
            }
          }
        }
        return links;
      },
    }
  );

  context.subscriptions.push(provider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
