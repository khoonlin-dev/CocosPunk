import { Component, _decorator, profiler } from "cc";
import { EDITOR } from "cc/env";
import { HrefSetting } from "../../../../extensions/pipeline/pipeline/settings/href-setting";

const { ccclass } = _decorator;

@ccclass('HiddenState')
export class HiddenState extends Component {

    __preload () {
        if (!EDITOR && HrefSetting.showFps) {
            profiler.hideStats();
        }
    }

}