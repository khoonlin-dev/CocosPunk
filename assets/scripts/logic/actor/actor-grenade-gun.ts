import { _decorator, v3 } from 'cc';
import { ActorEquipBase } from './actor-equip-base';
import { ProjectileGrenade } from './projectile-grenade';
import { ResPool } from '../../core/res/res-pool';
import { UtilVec3 } from '../../core/util/util';
const { ccclass } = _decorator;

let dir = v3(0, 0, 0);

@ccclass('ActorGrenadeGun')
export class ActorGrenadeGun extends ActorEquipBase {

    onFire () {
        const forwardNode = this._actor!._forwardNode!;
        const origin = forwardNode.worldPosition;
        UtilVec3.copy(dir, forwardNode.forward);
        let position = v3(origin.x, origin.y, origin.z);
        position.add(dir);
        const projectile = ResPool.Instance.pop(this._data.projectile_res, position, undefined);
        const projectileGrenade = projectile.getComponent(ProjectileGrenade);
        projectileGrenade?.onThrow(this._data, dir, this._actor);
    }

}

