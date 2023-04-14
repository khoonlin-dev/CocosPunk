import { game, math, PhysicsSystem, profiler } from "cc";
import { Save } from "./save";
import { Local } from "../../core/localization/local";
import { Msg } from "../../core/msg/msg";
import { Singleton } from "../../core/pattern/singleton";
import { ResCache } from "../../core/res/res-cache";
import { EDITOR } from "cc/env";
import { HrefSetting } from "../../../../extensions/pipeline/pipeline/settings/href-setting";

export class GameQuality extends Singleton {

    index: number = 0;
    max: number = 2;
    _data = Object.create(null);
    _map = Object.create(null);
    cur = {
        "name": "game_quality_high",
        "level": -1,
        "fps": 59.9,
        "maxSubSteps": 1,
        "open_ik": true
    };
    _default = 0;

    public init (): void {
        this._data = ResCache.Instance.getJson('data-quality').json;
        this.index = 0;
        if (this.index < 0) this.index = 0;
        if (this.index >= this._data.set.length) this.index = this.index = this._data.set.length - 1;
        this._default = this.index;
        this.cur = this._data.set[this.index];
        PhysicsSystem.instance.maxSubSteps = 10;
        // game.frameRate = this.cur.fps;

        Msg.on('next_quality', () => {
            this.index++;
            if (this.index >= this._data.set.length) this.index = 0;
            this.cur = this._data.set[this.index];
            Save.Instance._cur.game_quality = this.index;
            Local.Instance.refresh();
        });

        Msg.on('pre_quality', () => {
            this.index--;
            if (this.index < 0) this.index = this._data.set.length - 1;
            this.cur = this._data.set[this.index];
            Save.Instance._cur.game_quality = this.index;
            Local.Instance.refresh();
        });

        Msg.on('msg_check_change', this.checkChange.bind(this));

        Msg.on('msg_show_state', this.showState.bind(this));

    }

    public checkChange () {

        if (this._default !== this.index) {
            // Restart game.
            globalThis.window.location.reload();
        }
    }

    public getShowName () {
        return Local.Instance.get(this._data.set[this.index].name);
    }

    public showState () {
        if (!EDITOR && HrefSetting.showFps) {
            profiler.showStats();
        }
    }
}