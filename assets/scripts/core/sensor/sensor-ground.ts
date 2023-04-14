import { _decorator, Component, Collider, geometry, PhysicsSystem, Vec3, v3, RigidBody, CCFloat, math, Game, game } from 'cc';
import { UtilVec3 } from '../util/util';
const { ccclass, property } = _decorator;

@ccclass('SensorGround')
export class SensorGround extends Component {

    _collider: Collider | undefined | null;
    _isGround = false;
    _isSky = false;
    _ray: geometry.Ray = new geometry.Ray();
    _velocity: Vec3 = v3(0, 0, 0);

    _rigid: RigidBody | undefined;

    @property(CCFloat)
    checkDistance = 0.2;

    @property([Vec3])
    original = []

    @property([CCFloat])
    masks = [];

    _mask = 0
    pos = v3(0, 0, 0);
    velocity = v3(0, 0, 0);

    test_index = 0;

    start () {

        this._collider = this.getComponent(Collider);
        this._ray.d.x = 0;
        this._ray.d.y = -1;
        this._ray.d.z = 0;
        this._rigid = this.getComponent(RigidBody)!;
        this._isGround = true;

        for (let i = 0; i < this.masks.length; i++)
            this._mask = this._mask | 1 << this.masks[i];
    }

    update (deltaTime: number) {
        this.checkGroundRays();
    }

    checkGroundRays () {

        this._rigid?.getLinearVelocity(this.velocity);

        for (let i = 0; i < this.original.length; i++) {
            UtilVec3.copy(this._ray.o, this.node.worldPosition);
            this._ray.o.add(this.original[i]);
            if (PhysicsSystem.instance.raycastClosest(this._ray, this._mask, this.checkDistance)) {
                const res = PhysicsSystem.instance.raycastClosestResult;
                //this._actor!._data.walk_in_type = SubstanceCore.Instance.checkNodeType(res.collider.node);
                if (!this._isGround && this.velocity.y > -1 && this.velocity.y <= 0 && res.distance < 0.3) {
                    //console.log('on ground:', this.test_index);
                    this.node.emit('onGround');
                    this._isGround = true;
                    this._isSky = false;
                    this.test_index++;
                } else {
                    this.checkOffGround();
                }
                return;
            }
        }

        this.checkToSky();
    }


    checkOffGround () {
        if (this._isGround && this.velocity.y > 0.5) {
            //console.log('off ground:', this.test_index);
            this.node.emit('offGround');
            this._isGround = false;
        }
    }

    checkToSky () {
        if (!this._isSky) {
            //console.log('move to sky:', this.test_index);
            if (this._isGround) {
                this.node.emit('offGround');
                this._isGround = false;
            }
            this.node.emit('moveToSky');
            this._isSky = true;
        }
    }

}