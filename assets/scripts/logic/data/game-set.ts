
import { sys } from "cc";
import { Msg } from "../../core/msg/msg";
import { Singleton } from "../../core/pattern/singleton";
import { Save } from "./save";
import { DataGameSetInst } from "./data-core";

export class GameSet extends Singleton {

    sensitivity: number = 0.5;

    sensitivity_a: number = 0.5;

    screen_to_angle = 270;

    move_value_list = [3, 4, 10, 20, 40];
    move_accelerate_list = [0.7, 0.8, 1, 2, 3];

    accelerate_point = 20;

    data: any;

    public init (): void {

        this.data = DataGameSetInst._data.pc;

        if (sys.platform === sys.Platform.MOBILE_BROWSER ||
            sys.platform === sys.Platform.IOS) {
            this.data = DataGameSetInst._data.ios;
        } else if (sys.platform === sys.Platform.ANDROID) {
            this.data = DataGameSetInst._data.android;
        }

        this.sensitivity_a = this.data.sensitivity_a;
        this.screen_to_angle = this.data.screen_to_angle;
        this.move_value_list = this.data.move_value_list;
        this.move_accelerate_list = this.data.move_accelerate_list;
        this.accelerate_point = this.data.accelerate_point;


        // Init Sensitivity for controller.
        this.sensitivity = Save.Instance.get('sensitivity');
        if (this.sensitivity == undefined) {
            this.sensitivity = 0.5;
            Save.Instance.set('sensitivity', 0.5);
        }

        Msg.on('sli_sensitivity', (value: number) => {
            this.sensitivity = value;
            Save.Instance.set('sensitivity', value);
        })

        Msg.on('sli_sensitivity_a', (value: number) => {
            this.sensitivity_a = value;
        })

        Msg.on('inp_move_value_list', (value: string) => {
            const array = value.split(',');
            this.move_value_list.length = 0;
            for (let i = 0; i < array.length; i++) {
                this.move_value_list.push(Number(array[i]));
            }
        })

        Msg.on('inp_move_accelerate_list', (value: string) => {
            const array = value.split(',');
            this.move_accelerate_list.length = 0;
            for (let i = 0; i < array.length; i++) {
                this.move_accelerate_list.push(Number(array[i]));
            }
        })

        Msg.on('inp_screen_to_angle', (value: string) => {
            this.screen_to_angle = Number(value);
        })

        Msg.on('inp_accelerate_point', (value: string) => {
            this.accelerate_point = Number(value);
        })

    }

}