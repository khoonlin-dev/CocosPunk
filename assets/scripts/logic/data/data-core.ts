import { DataEquip } from "../../logic/data/data-equip";
import { DataSound } from "../../logic/data/data-sound";
import { DataCamera } from "./data-camera";
import { DataGame } from "./data-game";
import { DataGameSet } from "./data-game-set";
import { DataLevel } from "./data-level";
import { DataNavigation } from "./data-navigation";
import { DataPool } from "./data-pool";
import { DataUpgradeCard } from "./data-upgrade-card";

export const DataEquipInst = new DataEquip();
export const DataSoundInst = new DataSound();
export const DataCameraInst = new DataCamera();
export const DataNavigationInst = new DataNavigation();
export const DataUpgradeCardInst = new DataUpgradeCard();
export const DataGameInst = new DataGame();
export const DataLevelInst = new DataLevel();
export const DataPoolInst = new DataPool();
export const DataGameSetInst = new DataGameSet();

export function Init () {
    //Init data.
    DataEquipInst.init('data-equips');
    DataSoundInst.init('data-sound');
    DataCameraInst.init('data-camera');
    DataNavigationInst.init('data-navigation');
    DataUpgradeCardInst.init('data-upgrade-card');
    DataGameInst.init('data-game');
    DataLevelInst.init('data-level');
    DataPoolInst.init('data-pool');
    DataGameSetInst.init('data-game-set');

}