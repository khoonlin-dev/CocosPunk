/*
 Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

import { Msg } from "../../core/msg/msg";
import { Singleton } from "../../core/pattern/singleton";
import { Local } from "../../core/localization/local";
import { GameQuality } from "./GameQuality";
import { Sound } from "../../core/audio/sound";
import { ResCache } from "../../core/res/res-cache";
import { Level } from "../level/level";
import { Save } from "./save";
import { GameSet } from "./game-set";
import { DataGameInst } from "./data-core";

export class Bind extends Singleton {

    // Event dictionary, used to construct the mapping of keys to events.
    _map: { [name: string]: Function } = {}

    // Total number of events.
    totalEvents = 0;

    public init (): void {

        // Registered events are used to count the total number of events.
        Msg.on('msg_count_events', this.countEvents.bind(this));

        // Bind the skill detail 0.
        this._map['txt_upgrade_life_detail'] = () => Level.Instance.getUpgradeCardInfo(0);

        // Bind the skill detail 1.
        this._map['txt_upgrade_attack_detail'] = () => Level.Instance.getUpgradeCardInfo(1);

        // Bind the skill detail 2.
        this._map['txt_upgrade_defense_detail'] = () => Level.Instance.getUpgradeCardInfo(2);

        // Bind the button event of skill upgrade tab 0.
        this._map['btn_select_upgrade_0'] = () => {
            Level.Instance.upgradePlayerAttributes(0);
            Msg.emit('back');
        }

        // Bind the button event of skill upgrade tab 1.
        this._map['btn_select_upgrade_1'] = () => {
            Level.Instance.upgradePlayerAttributes(1);
            Msg.emit('back');
        }

        // Bind the button event of skill upgrade tab 2.
        this._map['btn_select_upgrade_2'] = () => {
            Level.Instance.upgradePlayerAttributes(2);
            Msg.emit('back');
        }

        // Bind button change equip items
        this._map['btn_change_0'] = () => {
            Level.Instance._player.onEquip(0);
            Msg.emit('back');
        }
        this._map['btn_change_1'] = () => {
            Level.Instance._player.onEquip(1);
            Msg.emit('back');
        }
        this._map['btn_change_2'] = () => {
            Level.Instance._player.onEquip(2);
            Msg.emit('back');
        }
        this._map['btn_change_3'] = () => {
            Level.Instance._player.onEquip(3);
            Msg.emit('back');
        }

        // Bind the current language name.
        this._map['txt_language'] = () => Local.Instance.getShowName();

        // Bind the current game quality name.
        this._map['txt_game_quality'] = () => GameQuality.Instance.getShowName();

        // Bind the current volume value.
        this._map['sli_sound'] = () => Sound.volumeSound;

        // Bind the current music volume value.
        this._map['sli_music'] = () => Sound.volumeMusic;

        // Bind sensitivity.
        this._map['sli_sensitivity'] = () => GameSet.Instance.sensitivity;

        this._map['sli_sensitivity_a'] = () => GameSet.Instance.sensitivity_a;

        // Bind game result score.
        this._map['spr_score'] = () => {
            const imgSrc = `txt_score_${Level.Instance.getLevelScore()}`;
            return ResCache.Instance.getSprite(imgSrc);
        }

        // Bind level over killed value.
        this._map['txt_killed'] = () => Save.Instance.getStatistics('killedTimes');

        // Bind level over hit value.
        this._map['txt_hit_head'] = () => Save.Instance.getStatistics('hit_headTimes');

        // Bind level over Hit Rate.
        this._map['txt_hsp'] = () => `${(Save.Instance.getStatistics('hit_rate') * 100).toFixed(2)} %`;

        // Bind level over hit value.
        this._map['txt_be_hit'] = () => Save.Instance.getStatistics('be_hit_times');

        // Bind dodge rate.
        this._map['txt_dodge'] = () => `${(Save.Instance.getStatistics('dodge_rate') * 100).toFixed(2)} %`;

        // Bind level score.
        this._map['txt_level_score'] = () => `${Save.Instance.getStatistics('level_score')}`;

        // Bind day value.
        this._map['txt_day_num'] = () => `${Save.Instance.get('day')}`;

        // Bind Show Version.
        this._map['txt_show_version'] = () => `${DataGameInst._data.show_version}`;

    }

    /**
     * The method is used to initialize the event binder.
     * @param data The data is game events mapping.
     */
    public initData (data: [{ name: string, event: string, data: string | undefined }]) {

        this.init();

        data.forEach(events => {
            let name = events.name;
            let event = events.event;
            let data = events.data;
            if (!events.data) data = undefined;
            this._map[name] = () => {
                Msg.emit(event, data);
            }
        });
    }

    /**
     * This method is used to execute specific events by key.
     * @param key The name of the event to execute.
     */
    public on (key: string) {
        var event = this._map[key];
        if (event) {
            event();
            this.countEvents();
        } else {
            console.warn('Can not find key:' + key);
        }
    }

    /**
     * This method is to get this event and return the result of executing the method.
     * @param key The key is event to execute.
     * @returns 
     */
    public get (key: string) {
        return this._map[key]();
    }

    /**
     * This method is used to determine if the event is mapped or not.
     * @param key The key of the event to be judged.
     * @returns 
     */
    public hasBind (key: string): boolean {
        return this._map[key] !== undefined;
    }

    /**
     * Current frame event execution statistics.
     */
    public countEvents () {
        this.totalEvents++;
    }

    /**
     * Check if the count needs to be refreshed according to the current frame.
     */
    public checkRefresh () {
        if (this.totalEvents > 0) {
            Msg.emit("refresh_ui");
            this.totalEvents = 0;
        }
    }

    /**
     * This method is an update function for each frame.
     * @param deltaTime This value is the execution time per frame.
     */
    public update (deltaTime: number): void {

        // Check if a refresh is needed.
        this.checkRefresh();
    }

}