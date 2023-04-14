import { _decorator, Component, director, Node, CCBoolean } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('destroySettings')
export class destroySettings extends Component {

    @property(CCBoolean)
    isDestroy = true;

    start () {
        //if (this.isDestroy) director.addPersistRootNode(this.node);
    }

}

