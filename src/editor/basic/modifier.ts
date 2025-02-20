import { Api, CoopRepository } from "../../coop";

export class Modifier {
    private __repo: CoopRepository;

    constructor(repo: CoopRepository) {
        this.__repo = repo;
    }

    api: Api | undefined;
    protected getApi(desc: string): Api {
        return this.api ?? (this.api = this.__repo.start(desc));
    }

    protected rollback() {
        this.__repo.rollback();
        this.api = undefined;
    }

    protected commit() {
        this.__repo.commit();
        this.api = undefined;
    }
}