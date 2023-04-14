import { _decorator, Component, animation } from 'cc';
import { DataGameInst } from '../data/data-core';
const { ccclass, property } = _decorator;

@ccclass('LevelEnablePlay')
export class LevelEnablePlay extends Component {

    onEnable () {
        if (DataGameInst._currentGameNodeName !== 'level') {
            this.node.getComponent(animation.AnimationController)!.enabled = false;
        }
    }
}

