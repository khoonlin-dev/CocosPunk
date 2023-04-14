import { _decorator, Animation, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnablePlayAnimation')
export class EnablePlayAnimation extends Component {

    _anim: Animation | undefined | null

    onEnable () {

        if (!this._anim) {
            this._anim = this.getComponent(Animation);
        }

        this._anim?.stop();
        this._anim?.play();
    }
}

