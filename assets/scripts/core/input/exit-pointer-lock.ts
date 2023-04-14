import { _decorator, Component, EventKeyboard, Input, input, KeyCode, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ExitPointerLock')
export class ExitPointerLock extends Component {

    start () {
        // Register keyboard events.
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown (event: EventKeyboard) {
        if (event.keyCode === KeyCode.ESCAPE) {
            document.exitPointerLock();
        }
    }
}

