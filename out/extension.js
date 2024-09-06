"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('Congratulations, your extension "my-vscode-extension" is now active!');
    let helloWorldDisposable = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from my-vscode-extension!');
    });
    let openYouTubeViewerDisposable = vscode.commands.registerCommand('extension.openYouTubeViewer', () => {
        const panel = vscode.window.createWebviewPanel('youtubeViewer', 'YouTube Viewer', vscode.ViewColumn.Beside, {
            enableScripts: true
        });
        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'setLink':
                    panel.webview.html = getWebviewContent(message.link);
                    return;
            }
        }, undefined, context.subscriptions);
        vscode.window.showInputBox({ prompt: 'Enter YouTube Video Link' }).then(link => {
            if (link) {
                panel.webview.postMessage({ command: 'setLink', link: link });
            }
        });
    });
    context.subscriptions.push(helloWorldDisposable);
    context.subscriptions.push(openYouTubeViewerDisposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function getWebviewContent(link = '') {
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
//# sourceMappingURL=extension.js.map