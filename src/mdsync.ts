import { readFile } from 'node:fs';
import * as vscode from 'vscode';
import { fetchAnnotationsForUser } from './hypothesis';
import * as matter from 'gray-matter';
import slugify from 'slugify';

function mapFilesToUris(files: vscode.Uri[]) : Map<string,string> {
    let fmap = new Map<string,string>();

    // scan files 
    vscode.window.withProgress({title: `Scan existing notes for annotations...`, location: vscode.ProgressLocation.Notification}, (progress, token) =>{

        
        for(let i=0; i < files.length; i++){

            let file = files[i];

            let increment = i / files.length * 100;

            readFile(file.fsPath, (err, data) => {
                
                let doc = matter(data.toString());

                if(doc.data.hypothesisURI){
                    fmap.set(doc.data.hypothesisURI, file.fsPath);
                }

            });

            progress.report({increment, message: file.fsPath});

        }
    });

    return fmap;
}

export async function doHypothesisSync(user: string) {

        if(!vscode.workspace.workspaceFolders){
            console.log("No workspace folders open!");
            return;
        }

        let chosenFolder;
        if(vscode.workspace.workspaceFolders.length > 1){
            const folderNames = vscode.workspace.workspaceFolders.map( x => x.name)
            const chosenName = await vscode.window.showQuickPick(folderNames, {title: "Which folder should be synced?"});
            chosenFolder = vscode.workspace.workspaceFolders.find( (folder) => folder.name === chosenName);
            
        }else{
            chosenFolder = vscode.workspace.workspaceFolders[0];
        }

        if(!chosenFolder?.uri){
            vscode.window.showErrorMessage("Failed to sync: something went wrong while opening your workspace folder.");
            return;
        }

		const config = vscode.workspace.getConfiguration();

		const filePattern = config.get("hypothesis.filePattern");

        let filter = new vscode.RelativePattern(chosenFolder?.uri, "**/*.md");

        let files = await vscode.workspace.findFiles(filter);

        // map uris to files
        let fmap = mapFilesToUris(files);


        // scan files 
        vscode.window.withProgress({title: `Syncing Hypothesis notes from user ${user}...`, location: vscode.ProgressLocation.Notification}, async (progress, token) =>{

            let result = await fetchAnnotationsForUser({user});

            let total = result.total;
            
            let uris = new Set(result.rows.map( (x) => x.uri ));

        });
        


}