import { _decorator, Camera, Component, game, Node, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraPlayer')
export class CameraPlayer extends Component {

    static camera: Camera | undefined;

    static screenCenter = v3(0, 0, 0);

    static screenBottom = v3(0, 0, 0);

    start () {

        CameraPlayer.camera = this.getComponent(Camera)!;

        CameraPlayer.screenCenter.x = game.canvas!.width / 2;
        CameraPlayer.screenCenter.y = game.canvas!.height / 2;

        CameraPlayer.screenBottom.x = game.canvas!.width / 2;
        CameraPlayer.screenBottom.y = 0;

    }
}

