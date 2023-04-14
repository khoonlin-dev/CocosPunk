import { _decorator, Component, Node } from 'cc';
import { Sound } from './sound';
const { ccclass, property } = _decorator;

@ccclass('SoundActorMain')
export class SoundActorMain extends Component {

    start () {
        Sound.node = this.node;
    }

    onDestroy (): void {
        Sound.node = undefined;
    }
}

