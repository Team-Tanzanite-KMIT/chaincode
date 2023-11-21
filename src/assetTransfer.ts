/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { Asset } from './asset';

import fs from 'fs';
import * as cryptojs from 'crypto-js';

function getFileNamenExt(name) {
    let nameSplits = name.split(".")
    return [nameSplits[0], nameSplits[1]]
}

function loadFile(fileName: string, content: string, owner: string): Asset {
    // var dataBuffer = fs.readFileSync(path);
    // var dataBuffer = Buffer.from("testData");
    // var data = dataBuffer.toString("base64");
    var hash = cryptojs.SHA256(content).toString(cryptojs.enc.Base64);

    // let fileName = getFileName(path);
    // console.log(data)

    let [name, ext] = getFileNamenExt(fileName);

    if (!fileName.includes(".")) {
        throw Error("Please provide file extension in file name.");
    }
    return {
        Owner: owner,
        Content: content,
        hash: hash,
        ID: name,
        fileType: ext
    };
}



@Info({ title: 'AssetTransfer', description: 'Smart contract for Storing Files' })
export class AssetTransferContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context) {
        // let testPath = 
        const files: Asset[] = [
            loadFile("os-dev.pdf", "ss", "rr"),
            loadFile("Mathematics for Computer Science.pdf", "ss", "ss"),
            loadFile("Introduction_to_Algorithms_Third_Edition_(2009) - 1sukCiCa-2Mvc6gd9YvsMZgeS1UXVKRFa.pdf", "ss", "tt"),
        ]

        for (const file of files) {
            await ctx.stub.putState(file.ID, Buffer.from(stringify(sortKeysRecursive(file))));
            console.log(`File ${file.ID} initialized`);
        }
    }

    @Transaction()
    public async CreateFile(ctx: Context, fileName: string, content: string, owner: string) {
        let exists = await this.FileExists(ctx, getFileNamenExt(fileName)[0]);
        // let fileName = getFileName(filePath)
        if (exists) {
            throw new Error(`The file ${fileName} already exists.`)
        }
        let file: Asset = loadFile(fileName, content, owner);
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
        if (!fileJSON || fileJSON.length == 0) {
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
