import { readFile, writeFile, existsSync, mkdir, mkdirSync, write } from 'node:fs';
import * as vscode from 'vscode';
import { Annotation, fetchAnnotationsForUser, fetchUserAnnotationCount } from './hypothesis';
import * as matter from 'gray-matter';
import slugify from 'slugify';

import {remark, } from 'remark';
import {Root, Content} from 'mdast';
import { parse } from 'node:path';

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

interface Section{
    breakOffset: number
    idOffset: number
    contentEndsOffset: number
    id: string
}

function parseMarkdownSections(mdRoot: Root) : Section[] {

    let prevChild : Content | undefined;
    let currentSection : Section | null = null;
    let sections : Section[] = [];
    
    // check for existing annotations
    for(let i=0; i < mdRoot.children.length; i++){

        let child = mdRoot.children[i];

        if ((child.type === 'html') && !currentSection){

            let idMatch = child.value.match(/\<\!--\s+START\s+(.+)\s+--\>/);

            if(idMatch){
                currentSection = {id: idMatch[1], breakOffset: i-1, idOffset: i, contentEndsOffset: -1 };
            }

        }


        if ( (child.type === 'html') && currentSection && (child.value === '<!-- END -->')) {
            currentSection.contentEndsOffset = i;
            sections.push(currentSection);
            currentSection = null;
        }

        prevChild = child;
    }

    return sections;
}

async function createOrUpdateNote(filename: string, note: Annotation) {


    let doc : matter.GrayMatterFile<string> | undefined;

    try{
        doc = matter.read(filename);
    }catch(err){
        doc = matter({content: ""});

        doc.data.hypothesisURI = note.uri;

        if(note.document.title && note.document.title.length > 0){
            doc.data.title = note.document.title[0];
        }
    }

    const mdRoot = remark.parse(doc.content);
    const sections = parseMarkdownSections(mdRoot);

    for( let section of sections){
        if(section.id === note.id){
            return false;
        }
    }
   
    // if we got this far, the section doesn't exist so we can add it


    // add the opening metadata
    mdRoot.children.push(
        {type:'thematicBreak'},
        {type:'html', value: `<!-- START ${note.id} -->`});

    //optionally add a quote that this annotation addresses
    if(note.target[0].selector){
        // get the quote from the note
        let quote =  note.target[0].selector.find( (x) => x.type === 'TextQuoteSelector');
        mdRoot.children.push({type:'blockquote', children:[
            {
                type:"paragraph",
                children:[
                    {
                        type: "text",
                        value: quote?.exact || ""
                    }
                ]
            }
        ]})
    }

    // add the actual annotation content
    mdRoot.children.push(
        {type: "paragraph", children:[
            {type: "text", value: note.text}
        ]},
        {type:'html', value:'<!-- END -->'}
    );


    doc.content = remark.stringify(mdRoot);



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

                        await createOrUpdateNote(fmap.get(note.uri) as string, note);
                        
                    }else{
                        // create the note
                        let url = new URL(note.uri);
                        let slugTarget = (note.document.title && (note.document.title.length>0)) ?  note.document.title[0] : url.host.concat(url.pathname);

                        let slug = slugify(slugTarget, {lower: true, trim: true, strict: true});


                        let basename = filePattern.replace("%DOCSLUG%", slug);
                        let fullname = folderPath.concat("/", basename);

                        await createOrUpdateNote(fullname, note);

                        fmap.set(note.uri, fullname);
                    }

                }

            }
            

        });
        


}