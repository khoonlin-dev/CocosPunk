import { _decorator, Component, Label, Node } from 'cc';
import { Msg } from '../../core/msg/msg';
const { ccclass, property } = _decorator;

@ccclass('ui_score')
export class ui_score extends Component {

    @property({ type: Label })
    label: Label | undefined;

    time = 2;

    onLoad () {
        this.node.on('set_score', this.setScore, this);
    }

    onDestroy (): void {
        this.node.off('set_score', this.setScore, this);
    }

    setScore (value: string) {
        this.time = 2;
        this.label!.string = value;
    }

    update (deltaTime: number): void {

        this.time -= deltaTime;
        if (this.time < 0) {
            this.node.active = false
        }

    }

}

