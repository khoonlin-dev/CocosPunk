import { _decorator, Component, Node, Animation, SpriteComponent, Color } from 'cc';
import { Msg } from '../msg/msg';
const { ccclass, property } = _decorator;

@ccclass('UIPlayAnim')
export class UIPlayAnim extends Component {

    anim: Animation | undefined;

    @property
    msg = "msg";

    sprite: SpriteComponent | undefined;

    spriteColor = new Color(255, 255, 255, 255);

    start () {

        this.anim = this.getComponent(Animation)!;
        Msg.on(this.msg, this.play.bind(this));
    }

    protected onDestroy (): void {
        Msg.off(this.msg, this.play.bind(this));
    }

    protected onEnable (): void {
        this.anim?.stop();

        if (this.sprite == undefined) {
            this.sprite = this.getComponent(SpriteComponent)!;
        }
        this.spriteColor.a = 255;
        this.sprite!.color = this.spriteColor;
    }

    play () {
        this.anim?.stop();
        this.anim?.play();
    }
}

