/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

@Object()
export class Asset {
    @Property()
    public fileType: string;

    @Property()
    public ID: string;

    @Property()
    public hash: string;

    @Property()
    public Owner: string;

    @Property()
    public AccessList: string[];

    @Property()
    public Content: string;
}
