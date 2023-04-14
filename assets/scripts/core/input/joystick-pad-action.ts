import { _decorator, Component, Node, Input, EventTouch } from 'cc';
import { Msg } from '../msg/msg';
import { InputJoystick } from './input-joystick';
const { ccclass, property } = _decorator;

@ccclass('JoystickPadAction')
export class JoystickPadAction extends Component {

    _input:InputJoystick | undefined;

    @property(Node)
    actionNode:Node | undefined;

    @property
    startMsg = '';

    @property
    endMsg = '';

    start() {
        this._input = this.node.parent!.getComponent(InputJoystick)!;
        this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDestroy() {
        this.node.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onTouchStart(event: EventTouch) {
        this.actionNode?.emit(this.startMsg);
    }

    onTouchEnd(event: EventTouch) {
        this.actionNode?.emit(this.endMsg); 
    } 

    onTouchCancel(event: EventTouch) {
        this.actionNode?.emit(this.endMsg); 
    }

}

