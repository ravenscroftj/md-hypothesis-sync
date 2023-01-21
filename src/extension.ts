// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { fetchAnnotationsForUser } from './hypothesis';

import {readFile, writeFile} from 'node:fs';
import { doHypothesisSync } from './mdsync';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "md-hypothesis-sync" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('md-hypothesis-sync.syncHypothesis', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		const config = vscode.workspace.getConfiguration();

		const username = config.get("hypothesis.username");

		const filePattern = config.get("hypothesis.filePattern");

		if(username){
			//vscode.window.showInformationMessage(`Syncing Hypothesis notes from user ${username}...`, );
			doHypothesisSync(username as string);

		}else{
			let response = await vscode.window.showWarningMessage("You must set your Hypothesis username before you can sync!", "Open Plugin Settings", "Dismiss");

			switch(response){
				case 'Open Plugin Settings':
					vscode.commands.executeCommand( 'workbench.action.openSettings', 'hypothesis.username' );
					break;

				default:
					break;
			}


				
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
