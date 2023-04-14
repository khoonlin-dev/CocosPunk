import { _decorator, Collider, Component, geometry, ICollisionEvent, ITriggerEvent, Node, PhysicsSystem } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test_physic')
export class test_physic extends Component {

    collider: Collider | undefined;

    @property
    mask = 4;

    start () {
        this.collider = this.getComponent(Collider)!;
        this.collider.on('onCollisionEnter', this.onCollisionEnter, this);
        this.collider.on('onTriggerEnter', this.onTriggerEnter, this);

        this.mask = 1 << this.mask;
        const ray: geometry.Ray = new geometry.Ray();
        ray.o.x = this.node.worldPosition.x;
        ray.o.y = this.node.worldPosition.y;
        ray.o.z = this.node.worldPosition.z;
        ray.d.x = 0;
        ray.d.y = -1;
        ray.d.z = 0;
        if (PhysicsSystem.instance.raycastClosest(ray, this.mask, 100)) {
            const res = PhysicsSystem.instance.raycastClosestResult;
            console.log('ray hit:', res.collider.name);
        }
    }

    onCollisionEnter (event: ICollisionEvent) {
        console.log('on collider enter.');
    }

    onTriggerEnter (event: ITriggerEvent) {
        console.log('on trigger enter.');
    }
}

