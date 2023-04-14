import { _decorator, Component, EventTouch, Input, Touch } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TouchCancel')
export class TouchCancel extends Component {

    onDisable () {

        const touch = new Touch(0, 0, 0);

        const cancelEvent = new EventTouch([touch], true, Input.EventType.TOUCH_CANCEL);

        cancelEvent.touch = touch;

        this.node.dispatchEvent(cancelEvent);

    }

}

