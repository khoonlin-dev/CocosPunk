import { Save } from "../../logic/data/save";
import { Singleton } from "../pattern/singleton";
import { ResCache } from "../res/res-cache";
import { Msg } from "../msg/msg";
import { sys } from "cc";

export class Guide extends Singleton {

    _data: {} = {};
    _cur_index = -1;

    _guide_name = '';

    _cur: [] = [];
    _cur_name: string = '';
    isGuide = false;

    public init () {

        // Test
        //Save.Instance._cur.guide_info = {};

        this._data = ResCache.Instance.getJson('data-guide').json;

        Msg.on('guide_control', () => {
            let guide_control = 'guide_keyboard'
            if (sys.platform === sys.Platform.MOBILE_BROWSER ||
                sys.platform === sys.Platform.ANDROID ||
                sys.platform === sys.Platform.IOS) {
                guide_control = 'guide_joystick'
            }
            this.set_guide(guide_control);
        });

        Msg.on('guide_set', this.set_guide.bind(this));
        Msg.on('guide_next', this.next.bind(this));
        Msg.on('guide_force_set', this.guide_force_set.bind(this));
    }

    public set_guide (name: string) {

        if (name == 'guide_control') {
            name = 'guide_keyboard'
            if (sys.platform === sys.Platform.MOBILE_BROWSER ||
                sys.platform === sys.Platform.ANDROID ||
                sys.platform === sys.Platform.IOS) {
                name = 'guide_joystick'
            }
        }

        this._guide_name = name;

        if (Save.Instance._cur.guide_info === undefined)
            Save.Instance._cur.guide_info = {};

        if (Save.Instance._cur.guide_info[this._guide_name]) {
            console.log('has guide:', this._guide_name);
            return;
        }
        this.isGuide = true;
        this._cur = this._data[this._guide_name];
        this._cur_index = -1;
        this.next();
        Msg.emit('msg_ui_on', 'ui_guide');
    }

    public guide_force_set (name: string) {
        this._guide_name = name;
        this.isGuide = true;
        this._cur = this._data[this._guide_name];
        this._cur_index = -1;
        this.next();
        Msg.emit('msg_ui_on', 'ui_guide');
    }

    public next () {
        this._cur_index++;
        if (this._cur_index >= (this._cur.length - 1)) {
            // Close guide ui.
            Msg.emit('msg_ui_off', 'ui_guide');
            Save.Instance._cur.guide_info[this._guide_name] = true;
            this.isGuide = false;
            var guide_end_event = this._cur[this._cur_index];
            if (guide_end_event !== '')
                Msg.emit(guide_end_event);
            Msg.emit('msg_save_archive');
        } else {
            this._cur_name = this._cur[this._cur_index];
            Msg.emit('guide_refresh');
        }

    }

}
