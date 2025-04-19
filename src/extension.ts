import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
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
            // scheme이 존재하는 경우는 링크를 만들지 않음
            if (imgPath.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
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
