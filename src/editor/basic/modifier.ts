import { Api, CoopRepository } from "../../coop";

export class Modifier {
    private __repo: CoopRepository;

    constructor(repo: CoopRepository) {
        this.__repo = repo;
    }

    private m_api: Api | undefined;
    protected getApi(desc: string): Api {
        return this.m_api ?? (this.m_api = this.__repo.start(desc));
    }

    protected rollback() {
        this.__repo.rollback();
        this.m_api = undefined;
    }

    protected commit() {
        this.__repo.commit();
        this.m_api = undefined;
    }

}