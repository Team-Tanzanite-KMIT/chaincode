import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {File} from './asset';
import * as fs from 'fs';
import * as cryptojs from "crypto-js";

function getFileName(path) {
    let pathSplits = path.split("/")
    return pathSplits[pathSplits.length - 1].split(".")[0]
}   

function loadFile(path: string, owner: string): File {
    var dataBuffer = fs.readFileSync(path);
    var data = dataBuffer.toString("base64");
    var hash = cryptojs.SHA256(data).toString(cryptojs.enc.Base64);
    
    let fileName = getFileName(path);
    // console.log(data)


    return {
        Owner: owner,
        Content: data,
        hash: hash,
        ID: fileName,
        fileType: "pdf"
    }
}

// console.log(loadFile("../testdocs/os-dev.pdf", "rr"))


@Info({title: "FileTransfer", description: "Smart contract for file transfer"})
export class FileTransferContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context) {
        // let testPath = 
        const files: File[] = [
            loadFile("../testdocs/os-dev.pdf","rr"),
            loadFile("../testdocs/Mathematics for Computer Science.pdf","ss"),
            loadFile("../testdocs/Introduction_to_Algorithms_Third_Edition_(2009) - 1sukCiCa-2Mvc6gd9YvsMZgeS1UXVKRFa.pdf","tt"),
        ]

        for (const file of files) {
            await ctx.stub.putState(file.ID, Buffer.from(stringify(sortKeysRecursive(file))));
            console.log(`File ${file.ID} initialized`);
        }
    }

    @Transaction()
    public async CreateFile(ctx: Context, filePath: string, owner: string ) {
        let exists = await this.FileExists(ctx, filePath);
        let fileName = getFileName(filePath)
        if(exists) {
            throw new Error(`The file ${fileName} already exists.`)
        }
        let file: File = loadFile(filePath, owner);
    }

    @Transaction(false)
    @Returns('boolean')
    public async FileExists(ctx: Context, id: string): Promise<boolean> {
        const fileJSON = await ctx.stub.getState(id);
        return fileJSON && fileJSON.length > 0;
    }

    @Transaction(false)
    @Returns('string')
    public async ReadFile(ctx: Context, id: string): Promise<string> {
        const fileJSON = await ctx.stub.getState(id);
        if(!fileJSON || fileJSON.length == 0) {
            throw new Error(`The file ${id} does not exist`)
        }
        return fileJSON.toString()
    }

    @Transaction(false)
    @Returns('string')
    public async GetAllFiles(ctx: Context) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}





