import { Object, Property } from "fabric-contract-api";


@Object()
export class File {
    @Property()
    public fileType?: string;

    @Property()
    public ID: string;

    @Property()
    public hash: string;

    @Property()
    public Owner: string;

    @Property()
    public Content: string;
}

