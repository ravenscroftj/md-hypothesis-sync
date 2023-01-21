import { readFile, writeFile, existsSync, mkdir, mkdirSync, write } from 'node:fs';
import * as vscode from 'vscode';
import { Annotation, fetchAnnotationsForUser, fetchUserAnnotationCount } from './hypothesis';
import * as matter from 'gray-matter';
import slugify from 'slugify';

function mapFilesToUris(files: vscode.Uri[]) : Map<string,string> {
    let fmap = new Map<string,string>();

    // scan files 
    vscode.window.withProgress({title: `Scan existing notes for annotations...`, location: vscode.ProgressLocation.Notification}, async (progress, token) => {

        
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

async function createOrUpdateNote(filename: string, note: Annotation) {


    let doc : matter.GrayMatterFile<string> | undefined;

    try{
        doc = await new Promise<matter.GrayMatterFile<string>>((resolve, reject)=>{
            readFile(filename, (err, data) => {
                if(err){
                    reject(err);
                }else{
                    resolve(matter.read(data.toString()));
                }
    
            });
        });
    }catch(err){
        doc = matter({content: ""});

        doc.data.hypothesisURI = note.uri;

        if(note.document.title && note.document.title.length > 0){
            doc.data.title = note.document.title[0];
        }
    }


    return new Promise<void>( (resolve, reject) => {

        if(!doc){
            reject("undefined file");
            
        }else{
                writeFile(filename, matter.stringify(doc.content, doc.data), ()=>{
                    resolve();
                });
        }
    });
}


export async function doHypothesisSync(user: string) {

        if(!vscode.workspace.workspaceFolders){
            console.log("No workspace folders open!");
            return;
        }

        let chosenFolder: vscode.WorkspaceFolder | undefined;
        if(vscode.workspace.workspaceFolders.length > 1){
            const folderNames = vscode.workspace.workspaceFolders.map( x => x.name);
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

        const fileDir = config.get("hypothesis.fileDir") as string;



		const filePattern = config.get("hypothesis.filePattern") as string;

        let filter = new vscode.RelativePattern(chosenFolder?.uri, "**/*.md");
        

        let files = await vscode.workspace.findFiles(filter);

        // map uris to files
        let fmap = mapFilesToUris(files);


        // scan files 
        vscode.window.withProgress({title: `Syncing Hypothesis notes from user ${user}...`, location: vscode.ProgressLocation.Notification}, async (progress, token) =>{

            let total = await fetchUserAnnotationCount(user);

            let pages = Math.ceil(total / 100);

            let noteIdx = 0;

            let folderPath = chosenFolder?.uri?.fsPath?.concat("/", fileDir);

            if(!folderPath){
                vscode.window.showErrorMessage("Could not resolve folder path. Weirdness.");
                return;
            }

            if(!existsSync(folderPath)) {
                mkdirSync(folderPath);
            }

            console.log("pages", pages)

            for(let i=0; i<pages;i++) {

                let notes = await fetchAnnotationsForUser({user, limit:100, offset: (i*100)});

                for(let note of notes.rows){

                    if(fmap.has(note.uri)){
                        
                    }else{
                        // create the note
                        let url = new URL(note.uri);
                        let slug = (note.document.title && (note.document.title.length>0)) ?  slugify(note.document.title[0]) : slugify(url.host.concat(url.pathname));
                        let basename = filePattern.replace("%DOCSLUG%", slug);
                        let fullname = folderPath.concat("/", basename);

                        await createOrUpdateNote(fullname, note);

                        fmap.set(note.uri, fullname);
                    }

                }

            }
            

        });
        


}