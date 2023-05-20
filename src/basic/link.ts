import { EventEmitter } from "../basic/event";

export class Link extends EventEmitter {
    private __ws: WebSocket;
    constructor(url: string) {
        super();
        const ws = this.__ws = new WebSocket(url);

        const interval = 1000;
        let timer: NodeJS.Timer | undefined;
        const clearTimmer = () => {
            if (timer) {
                clearInterval(timer);
                timer = undefined;
            }
        }
        timer = setInterval(() => {
            // ws.send('I am alive.');
            this.send({ msg: 'I am alive.' })
        }, interval);

        ws.onopen = () => {
            // ws.send('hello in open')
            this.emit('onopen');
        }
        ws.onmessage = (ev: MessageEvent<any>) => {
            // console.log(ev.data);
            const data: { msg: string, data?: any } = JSON.parse(ev.data);
            this.emit(data.msg, data.data);
        }
        ws.onclose = (ev: CloseEvent) => {
            // console.log('onclose')
            clearTimmer();
            // console.log(ev);
            this.emit('onclose');
        }
        ws.onerror = (ev: Event) => {
            clearTimmer();
            // console.log(ev);
            this.emit('onerror');
        }
    }

    close() {
        this.__ws.close();
    }

    isOpen(): boolean {
        return this.__ws.readyState === WebSocket.OPEN;
    }

    send(data: { msg: string, data?: any }) {
        const d = JSON.stringify(data);
        this.__ws.send(d);
    }
}