import { Canvas, Node, PhysicsRayResult, Vec3, game, math, randomRangeInt, v3 } from "cc";
import { Sound } from "../../core/audio/sound";
import { fx } from "../../core/effect/fx";
import { Local } from "../../core/localization/local";
import { Msg } from "../../core/msg/msg";
import { ActorPart } from "./actor-part";
import { Actor } from "./actor";
import { DataLevelInst } from "../data/data-core";
import { UtilVec3 } from "../../core/util/util";
import { CameraPlayer } from "../camera/camera-player";

let tempShootDirection = v3(0, 0, 0);
let tempVec3 = v3(0, 0, 0);

export function calculateDamageNode (data: any, node: Node, hitPoint: Vec3, shootActor: Actor | undefined) {
    const hitName = node.name.split('_')[0];
    let hitTag = `hit_${hitName}`;

    const damage = data.damage;
    const actorPart = node.getComponent(ActorPart);

    if (shootActor?.isPlayer) Msg.emit('msg_stat_times', `enemy_fire`);

    if (actorPart) {
        const actorBodyName = actorPart.part;
        const part_damage = damage[actorBodyName];
        if (part_damage === undefined) throw new Error(`${node.name} node hit part undefine '${actorBodyName}'`);

        const actor = actorPart.actor;
        if (actor === undefined) throw new Error(`${node.name} node hit part '${actorBodyName}' undefine actor`);

        if (shootActor?.isPlayer) {
            Msg.emit('msg_stat_times', `hit_${actorBodyName}`);
        }

        if (actor.isPlayer) {
            Msg.emit('msg_stat_times', `be_hit_${actorBodyName}`);
        }

        actor._data.hp -= part_damage;
        if (actor._data.hp <= 0) {
            actor._data.hp = 0;
            fx.on(DataLevelInst._data.fx_dead, actor.node.worldPosition);
            if (actor.isPlayer) Msg.emit('msg_stat_times', 'killed');
            actor.do('dead');
        } else {
            actor.do('hit_gun');
        }

        if (actor.isPlayer) actor.updateHP();

        hitTag = 'hit_body';
    }
    calculateDamageView(damage[hitTag], hitPoint, shootActor?.node.worldPosition);
}

export function calculateDamage (data: any, hit: PhysicsRayResult | undefined, shootActor: Actor | undefined) {

    if (shootActor?.isPlayer) Msg.emit('msg_stat_times', `enemy_fire`);

    if (hit === undefined) {
        /*
        Msg.emit(
            'msg_tips',
            `${Local.Instance.get('hit_nothing')}`,
        );
        */
        return;
    }
    const node: Node = hit.collider.node;
    const hitName = node.name.split('_')[0];
    let hitTag = `hit_${hitName}`;

    const damage = data.damage;
    const actorPart = node.getComponent(ActorPart);

    if (actorPart) {

        const actorBodyName = actorPart.part;
        const part_damage = damage[actorBodyName] + randomRangeInt(-5, 5);

        if (part_damage === undefined) throw new Error(`${node.name} node hit part undefine '${actorBodyName}'`);

        hitTag = `hit_${actorBodyName}`;

        const actor = actorPart.actor;
        if (actor === undefined) throw new Error(`${node.name} node hit part '${actorBodyName}' undefine actor`);

        if (actor._data.hp <= 0) return;

        if (shootActor?.isPlayer) {
            Msg.emit('msg_stat_times', `hit_${actorBodyName}`);
        }

        actor._data.hp -= part_damage;

        if (actor.isPlayer) {

            Msg.emit('msg_stat_times', `be_hit_${actorBodyName}`);

            // calculate hit direction.
            const camera = CameraPlayer.camera;
            UtilVec3.copy(tempVec3, shootActor!.node.worldPosition);
            tempVec3.y += 0.5;
            camera?.worldToScreen(tempVec3, tempShootDirection);
            tempShootDirection.subtract(CameraPlayer.screenBottom);
            const angle = math.toDegree(Vec3.angle(tempShootDirection, Vec3.UP));
            const side = Math.sign(-tempShootDirection.cross(Vec3.UP).z);
            Msg.emit('msg_hit_direction', angle * side);

        } else {

            // Set actor hate value.
            actor._data.ai_hate += 1;

            const hpPercent = actor._data.hp / actor._data.max_hp;
            Msg.emit('msg_show_hit_info', { target: actor.viewPointHead, hpPercent: hpPercent, damageValue: part_damage, hitPoint: hit.hitPoint, isHead: actorBodyName == 'head' })
        }

        if (actor._data.hp <= 0) {
            actor._data.hp = 0;
            fx.on(DataLevelInst._data.fx_dead, actor.node.worldPosition);
            if (shootActor?.isPlayer) Msg.emit('msg_stat_times', 'killed');
            actor.do('dead');
        } else {
            actor.do('hit_gun')
        }

        if (actor.isPlayer) actor.updateHP();

    }
    calculateDamageView(damage[hitTag], hit.hitPoint, shootActor?.node.worldPosition);
}

function calculateDamageView (damage: Record<string, any> | undefined, hitPoint: Vec3, direction: Vec3 | undefined) {
    if (damage === undefined) return;
    if (damage.fx) fx.on(damage.fx, hitPoint, direction);
    if (damage.sfx) Sound.onByDistance(damage.sfx, hitPoint);
    if (damage.notify === undefined) {
        const showMsg = damage['notify'];
        if (showMsg == undefined) return;
        Msg.emit(
            'msg_tips',
            `${Local.Instance.get(damage['notify'])}`
        );
    }
}
