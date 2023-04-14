import { _decorator, Component, EventMouse, game, Input, input, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test_mouse_move')
export class test_mouse_move extends Component {

    start () {

        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);

    }

    update (deltaTime: number) {

    }

    pre_mouse_time = 0;
    pre_info = '';
    onMouseMove (event: EventMouse) {

        const deltaTime = game.totalTime - this.pre_mouse_time;

        const info = `time: ${game.totalTime} mouse move delta time:  ${deltaTime}  engine delta time: ${game.deltaTime}`;
        if (deltaTime > 20) {
            console.log('pre:', this.pre_info);
            console.log('cur:', info);
        }

        this.pre_info = info;

        this.pre_mouse_time = game.totalTime;
    }
}

