import { Director, director, instantiate, Node, Prefab, resources, Scene } from "cc";
import { Msg } from "../msg/msg";
import { ILoadMsg } from "../../logic/ui/ui-loading";
import { ResCache } from "../res/res-cache";
import { HrefSetting } from "../../../../extensions/pipeline/pipeline/settings/href-setting";

export class GScene {

    public static isLoadScene = false;

    public static isPreload = false;

    public static msg: ILoadMsg = {
        id: 100,
        action: 'load scene',
        current: '',
        wait_count: 1,
        count: 1,
    }


    public static Load (name: string, onload: () => void) {
        GScene.isLoadScene = true;
        /*
        this.msg.current = name;
        this.msg.wait_count = 1;
        this.msg.count = 1;
        Msg.emit('msg_loading',this.msg);
        */

        director.loadScene(name, (error: Error | null, scene?: Scene) => {
            if (error) {
                throw new Error(`Load Scene Error.`);
            }
            if (scene) {
                let sceneName = 'prefabs/scene-root'
                if (!HrefSetting.fullScene) {
                    sceneName += '-simple'
                }

                if (globalThis.lightCluster) {
                    globalThis.lightCluster.forceUpdate = true
                }
                resources.load([sceneName], (err, prefabs) => {
                    let root = instantiate(prefabs[0] as Prefab)
                    root.parent = scene

                    onload();
                    GScene.isLoadScene = false;
                    ResCache.Instance.removeLoad();

                    setTimeout(() => {
                        if (globalThis.lightCluster) {
                            globalThis.lightCluster.forceUpdate = false
                        }
                    }, 100)
                })


                //this.msg.count--;
            } else {
                console.warn('Can not load scene. - ' + name);
            }
        });
    }

}