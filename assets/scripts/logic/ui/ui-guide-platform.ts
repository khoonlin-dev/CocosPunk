import { _decorator, Component, Node, Sprite, SpriteFrame, sys } from 'cc';
import { Save } from '../data/save';
import { Msg } from '../../core/msg/msg';
const { ccclass, property } = _decorator;

@ccclass('UIGuidePlatform')
export class UIGuidePlatform extends Component {

    @property({ type: [SpriteFrame] })
    guideSprites: SpriteFrame[] = [];

    @property({ type: Sprite })
    sprite: Sprite | undefined;

    start () {
        Msg.on('refresh_local', this.refresh.bind(this));
        this.refresh();
    }

    onDestroy () {
        Msg.off('refresh_local', this.refresh.bind(this));
    }

    refresh () {
        const state_index = Save.Instance._cur.languageIndex == 0 ? 0 : 2;
        if (sys.platform === sys.Platform.MOBILE_BROWSER ||
            sys.platform === sys.Platform.ANDROID ||
            sys.platform === sys.Platform.IOS) {
            this.sprite!.spriteFrame = this.guideSprites[state_index + 1];
        } else {
            this.sprite!.spriteFrame = this.guideSprites[state_index + 0];
        }

        this.sprite!.sizeMode = Sprite.SizeMode.RAW;
    }

}

