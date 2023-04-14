import { _decorator, Component, RigidBody, v3, Node, Vec3, CCFloat, SphereCollider, geometry, PhysicsRayResult, PhysicsSystem } from 'cc';
import { calculateDamage } from './damage-core';
import { Actor } from './actor';
import { fx } from '../../core/effect/fx';
import { UtilVec3 } from '../../core/util/util';
import { ResPool } from '../../core/res/res-pool';
import { Level } from '../level/level';
import { Msg } from '../../core/msg/msg';
import { Sound } from '../../core/audio/sound';
import { FxBase } from '../../core/effect/fx-base';
import { fun } from '../../core/util/fun';
const { ccclass, property } = _decorator;

let tempForward = v3(0, 0, 0);

let ray = new geometry.Ray();

let mask = 1 << 2 | 1 << 3 | 1 << 4;

let mas_actor = 1 << 3;

@ccclass('ProjectileGrenade')
export class ProjectileGrenade extends Component {

    _data: any;

    _size = v3(1, 1, 1);

    @property(CCFloat)
    explodeTime = 3;

    @property(Vec3)
    endSize = v3(6, 6, 6);

    @property(SphereCollider)
    collider: SphereCollider | undefined;

    @property(RigidBody)
    rigidbody: RigidBody | undefined;

    @property
    useGravity = true;

    @property({ type: FxBase })
    fxTrail: FxBase | undefined;

    updateFunction: Function | undefined;
    actor: Actor | undefined;

    @property(Node)
    view: Node | undefined;

    force: Vec3 = v3(0, 0, 0);

    move_force = 5;
    second_move_force = 3;
    second_move_time = 2.5;

    isSecond = false;
    state = 0;

    isHit = false;

    start () {
        //this.collider!.on('onCollisionEnter', this.onCollisionEnter, this);
    }

    onDestroy () {
        //this.collider!.off('onCollisionEnter', this.onCollisionEnter, this);
    }

    onThrow (weaponData: any, dir: Vec3, shootActor: Actor | undefined) {
        this._data = weaponData;
        this.move_force = this._data.move_force;
        this.second_move_force = this._data.second_move_force;
        this.second_move_time = this._data.second_move_time;
        this.actor = shootActor;
        UtilVec3.copy(tempForward, this.node.worldPosition);
        tempForward.add(dir);
        this.node.lookAt(tempForward);
        this.rigidbody?.setAngularVelocity(Vec3.ZERO);
        UtilVec3.copy(this.force, dir);
        this.onFirstSection();
        this.explodeTime = this._data.explode_time;
        this.updateFunction = this.waitExplode;
        this.node.setWorldScale(Vec3.ONE);
        this.isSecond = false;
        this.state = 0;
        this.view!.active = true;
        fun.delay(() => {
            this.fxTrail?.setLoop(true);
            this.fxTrail?.play();
        }, 0.1);

    }

    onFirstSection () {
        this.force.multiplyScalar(this.move_force);
        this.rigidbody?.applyImpulse(this.force);
    }

    onSecondSection () {
        if (this.isSecond) return;
        this.isSecond = true;
        this.force!.multiplyScalar(this.second_move_force);
        this.rigidbody?.applyImpulse(this.force!);
        this.collider!.isTrigger = true;
        fx.on('fx_grenade_2_trail_speedup', this.node.worldPosition, this.node.forward);
        Sound.onByDistance('sfx_second_launching', this.node.worldPosition);
    }

    onExplode () {
        this.view!.active = false;
        this.updateFunction = this.exploding;
        Sound.onByDistance(this._data.sound_explode, this.node.worldPosition);
        fx.on(this._data.fx_explode, this.node.worldPosition);
        this.rigidbody?.setLinearVelocity(Vec3.ZERO);
        this.checkDamage();
    }

    onExplodeEnd () {
        this.updateFunction = undefined;
        this.fxTrail?.setLoop(false);
        fun.delay(() => {
            this.fxTrail?.clear();
            this.node.active = false;
            ResPool.Instance.push(this.node);
        }, 0.1);

    }


    /*
    onCollisionEnter (event: ICollisionEvent) {
        if (this.state == 0) {
            this.onExplode();
            this.state = 1;
        }
        this.state = 1;
        console.log(event.otherCollider.node.name);
        const hitPoint = event.otherCollider.node.getWorldPosition();
        calculateDamageNode(this._data, event.otherCollider.node, hitPoint, this.actor);
    }
    
    
     
    onTriggerEnter (event: ITriggerEvent) {
    
        if (this.state == 0) {
            this.onExplode();
            this.state = 1;
        }
    
        this.state = 1;
        console.log(event.otherCollider.node.name);
        const hitPoint = event.otherCollider.node.getWorldPosition();
        calculateDamageNode(this._data, event.otherCollider.node, hitPoint, this.actor);
    }
    */

    waitExplode (deltaTime: number) {

        this.explodeTime -= deltaTime;
        if (this.explodeTime < this.second_move_time) {
            this.onSecondSection();
        }

        if (this.explodeTime <= 0) {
            this.onExplode();
        } else {
            this.checkHit();
        }

    }

    exploding (deltaTime: number) {
        Vec3.lerp(this._size, this._size, this.endSize, deltaTime * 5);
        this.node.setWorldScale(this._size);
        if (Math.abs(this._size.x - this.endSize.x) < 0.1) {
            this.onExplodeEnd();
        }
    }

    update (deltaTime: number) {
        if (this.updateFunction !== undefined)
            this.updateFunction(deltaTime);
    }

    checkHit () {
        if (this.state == 1) return;
        const distance = 0.5;
        const origin = this.node.worldPosition;
        const dir = this.node.forward;
        UtilVec3.copy(ray.o, origin);
        UtilVec3.copy(ray.d, dir);
        //let hit: PhysicsRayResult | undefined;
        if (PhysicsSystem.instance.raycastClosest(ray, mask, distance)) {
            if (this.state == 0) {
                this.onExplode();
                this.state = 1;
                //hit = PhysicsSystem.instance.raycastClosestResult;
                //calculateDamage(this._data, hit, this.actor);
            }
        }
    }

    checkDamage () {
        const player = Level.Instance._player;
        if (!player) return;

        const origin = this.node.worldPosition;
        UtilVec3.copy(tempForward, player.node.worldPosition);
        tempForward.y += 0.5;
        const dir = tempForward.subtract(this.node.worldPosition).normalize();
        UtilVec3.copy(ray.o, origin);
        UtilVec3.copy(ray.d, dir);
        const distance = this._data.damage.distance;
        let hit: PhysicsRayResult | undefined;
        if (PhysicsSystem.instance.raycastClosest(ray, mas_actor, distance)) {
            hit = PhysicsSystem.instance.raycastClosestResult;
            Msg.emit('msg_camera_shake', { time: this._data.fire_shake_time, size: this._data.fire_shake_range })
        }
        calculateDamage(this._data, hit, this.actor);
    }

}

