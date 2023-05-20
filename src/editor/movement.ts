import { Repository } from '../data/transact';
export class Movement {
    private __repo: Repository;
    private __name: string;
    private __status: 'uninit' | 'pending' | 'fulfilled' = 'uninit';
    constructor(repo: Repository, name: string) {
        this.__repo = repo;
        this.__name = name;
    }

    private begin(payload: any) {
        const ex = this.__repo.transactCtx.transact;
        if (ex !== undefined) {
            this.__repo.rollback();
        }
        this.__repo.start(this.__name, payload);
        this.__status = 'pending';
    }

    private updater() {
        this.__repo.transactCtx.fireNotify();
    }

    private close(payload?: any) {
        if (payload) {
            this.__repo.commit(payload);
        } else {
            this.__repo.rollback();
        }
    }

    public do(payload?: any) {
        switch (this.__status) {
            case 'uninit':
                this.begin(payload);
                break;
            case 'pending':
                this.updater();
                break;
            case 'fulfilled':
                this.close(payload);
                break;
            default:
                break;
        }
    }
}