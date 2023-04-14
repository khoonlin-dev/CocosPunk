import { _decorator, Component, Node, Animation, CCFloat, CCString } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DelayPlay')
export class DelayPlay extends Component {


    @property([Animation])
    animations = [];

    @property([CCFloat])
    delay = [];

    @property([CCString])
    animation_names = [];

    start () {



    }

}

