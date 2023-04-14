import { _decorator, Component, Node, AudioClip, AudioSource, math, CCFloat } from 'cc';
import { Msg } from '../msg/msg';
import { Sound } from './sound';
const { ccclass, property } = _decorator;

@ccclass('MusicComposeValue')
export class MusicComposeValue extends Component {

    @property([AudioClip])
    clips: AudioClip[] = [];

    @property([CCFloat])
    weight: number[] = [];

    @property
    smooth: number = 0.1;

    _selects: number[] = [];

    _curs: number[] = [];

    _audios: AudioSource[] = [];

    _value = 0;

    start () {

        Msg.on('music_level_by_speed', this.setValue.bind(this));

        for (let i = 0; i < this.clips.length; i++) {
            var as = this.node.addComponent(AudioSource);
            as.clip = this.clips[i];
            as.volume = 0;
            as.loop = true;
            as.play();
            this._audios.push(as);
            this._curs.push(0);
            this._selects.push(1);
        }


    }

    onDestroy () {
        Msg.off('music_level_by_speed', this.setValue.bind(this));
    }

    setValue (speed: number) {

        this._value = speed;
        for (let i = 0; i < this.clips.length; i++) {
            if (this.weight[i] <= this._value) this._selects[i] = 1;
            else this._selects[i] = 0;
        }

    }

    update (deltaTime: number) {
        for (let i = 0; i < this._audios.length; i++) {
            this._curs[i] = math.lerp(this._curs[i], this._selects[i], deltaTime * this.smooth);
            this._audios[i].volume = this._curs[i] * Sound.volume;
        }
    }
}

