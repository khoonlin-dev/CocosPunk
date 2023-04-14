import { _decorator, Component, Input, EventTouch, game, math } from 'cc';
import { InputJoystick } from './input-joystick';
import { GameSet } from '../../logic/data/game-set';
const { ccclass, property } = _decorator;

@ccclass('JoystickPadRotation')
export class JoystickPadRotation extends Component {

    _input: InputJoystick | undefined;

    accelerateRotation = 0;

    start () {
        this._input = this.node.parent!.getComponent(InputJoystick)!;
        this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onDestroy () {
        this.node.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onTouchMove (event: EventTouch) {

        const x = event.getDeltaX();
        const y = event.getDeltaY();

        /*
        const screenXRate = x / game.canvas!.width * 180;
        const screenYRate = y / game.canvas!.height * 180;

        const rotationAccelerate = GameSet.Instance.sensitivity;

        const distance = Math.sqrt(screenXRate * screenXRate + screenYRate * screenYRate);

        const rotateX = screenXRate * (1 + rotationAccelerate * distance) * GameSet.Instance.sensitivity_a * 3;
        const rotateY = screenYRate * (1 + rotationAccelerate * distance) * GameSet.Instance.sensitivity_a * 3;
        */


        const screenXRate = x / game.canvas!.width * GameSet.Instance.screen_to_angle;
        const screenYRate = y / game.canvas!.width * GameSet.Instance.screen_to_angle;

        let distance = Math.sqrt(screenXRate * screenXRate + screenYRate * screenYRate);

        if (distance < GameSet.Instance.accelerate_point) distance = 0;

        let index = 0;
        let move_value_list = GameSet.Instance.move_value_list;
        for (let i = 0; i < move_value_list.length; i++) {
            index = i;
            if (distance <= move_value_list[i]) break;
        }

        const accelerateRate = GameSet.Instance.move_accelerate_list[index];

        const rotationAccelerate = GameSet.Instance.sensitivity;

        this.accelerateRotation = math.lerp(this.accelerateRotation, accelerateRate, game.deltaTime * 10);

        const rate = GameSet.Instance.sensitivity_a * 3 * this.accelerateRotation;

        const rotateX = screenXRate * (1 + rotationAccelerate * distance) * rate * accelerateRate;
        const rotateY = screenYRate * (1 + rotationAccelerate * distance) * rate * accelerateRate;

        this._input?.onRotation(rotateX, rotateY);
    }

}

