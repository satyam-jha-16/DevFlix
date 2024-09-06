import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "my-vscode-extension" is now active!');

    let helloWorldDisposable = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from my-vscode-extension!');
    });

    let openYouTubeViewerDisposable = vscode.commands.registerCommand('extension.openYouTubeViewer', () => {
        const panel = vscode.window.createWebviewPanel(
            'youtubeViewer',
            'YouTube Viewer',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'setLink':
                        panel.webview.html = getWebviewContent(message.link);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );

        vscode.window.showInputBox({ prompt: 'Enter YouTube Video Link' }).then(link => {
            if (link) {
                panel.webview.postMessage({ command: 'setLink', link: link });
            }
        });
    });

    context.subscriptions.push(helloWorldDisposable);
    context.subscriptions.push(openYouTubeViewerDisposable);
}

export function deactivate() { }

function getWebviewContent(link: string = ''): string {
    const videoId = link ? new URL(link).searchParams.get('v') : '';
    const iframeSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : '';

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Viewer</title>
        </head>
        <body>
            <input type="text" id="linkInput" placeholder="Enter YouTube link" style="width: 100%; padding: 8px;" />
            <button onclick="setLink()">Set Link</button>
            <div style="margin-top: 20px;">
                ${iframeSrc ? `<iframe width="100%" height="500" src="${iframeSrc}" frameborder="0" allowfullscreen></iframe>` : ''}
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function setLink() {
                    const link = document.getElementById('linkInput').value;
                    vscode.postMessage({ command: 'setLink', link: link });
                }
            </script>
        </body>
        </html>
    `;
}