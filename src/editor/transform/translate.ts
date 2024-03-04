import { CoopRepository } from "../../editor/coop/cooprepo";
import { AsyncApiCaller } from "./handler";
import { PageView } from "../../dataview/page";
import { Document } from "../../data/document";

export class Transporter extends AsyncApiCaller {
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page, 'translate')
    }
    
}