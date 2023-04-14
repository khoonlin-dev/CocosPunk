import { _decorator, Component, EventKeyboard, Input, input, KeyCode, Node } from 'cc';
import { Msg } from '../core/msg/msg';
const { ccclass, property } = _decorator;

@ccclass('Dev')
export class Dev extends Component {

    start () {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown (event: EventKeyboard) {

        if (event.keyCode == KeyCode.KEY_P) {
            this.onClickDev();
        }

    }

    onClickDev () {
        Msg.emit('push', 'dev');
    }

    update (deltaTime: number) {

    }
}

