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

import { game, _decorator } from 'cc';
import { DataEquipInst } from '../data/data-core';
import { Actor } from './actor';
import { Msg } from '../../core/msg/msg';

export class ActorBag {

    // The character object to which the current bag belongs.
    _actor: Actor;

    // Bag capacity.
    _capacity = 0;

    // Bag usage count statistics.
    _usageCount = 0;

    constructor (actor: Actor) {

        // The character object to which the current equipment belongs.
        this._actor = actor;

        // Set Bag capacity.
        this._capacity = this._actor._data.bag_capacity;

        // Initialize the bag space and set the default value.
        this._actor._data.equipment_name_list = new Array<string>(this._capacity);
        for (let i = 0; i < this._capacity; i++) {
            this._actor._data.equipment_name_list[i] = '';
            this._actor.node.emit('equip', i, false);
        }

        // Set the default value of the bag.
        const bags = actor._data.bags;
        for (let i = 0; i < bags.length; i++) {
            this.pickedItem(bags[i]);
            const weaponID = DataEquipInst._data[bags[i]].id;
            this._actor.node.emit('equip', weaponID, true);
        }
    }

    /**
     * Get the index of the empty slot in the bag
     * @returns Returns the index of the corresponding empty slot, -1 means it cannot exist. 
     */
    public getEmptySlot (): number {

        for (let i = 0; i < this._actor._data.equipment_name_list.length; i++) {
            const name = this._actor._data.equipment_name_list[i];
            if (name.length <= 0) return i;
        }
        return -1;
    }

    /**
     * The method is check picked same weapon then increase clip.
     * @param name Weapon name
     * @returns TRUE is same weapon increase clip, FALSE is not same weapon.
     */
    public pickedSameWeaponIncreaseClips (name: string) {

        const bagItems = this._actor._data.items[name] as BagItem;

        if (bagItems) {

            //bagItems.bulletClipCount++;
            this._actor.bulletBox++;

            return true;
        }

        return false;

    }

    /**
     * The method picked bullet box.
     * @returns 
     */
    public pickedBulletBox () {

        const bagItems = this._actor._actorEquipment?.currentEquipItem;

        if (bagItems) {

            //bagItems.bulletClipCount++;
            this._actor.bulletBox += 2;

            return true;
        }

        return false;

    }

    /**
     * This method is used to pick up item.
     * @param name Pick item name.
     * @returns Picked state, true is picked, false is not picked.
     */
    public pickedItem (name: string): boolean {

        // Get the current backpack item by name, may be empty.
        let bagItems = this._actor._data.items[name];

        // Get information about equipment props.
        const equipData = DataEquipInst.get(name);

        // If the item already exists in the backpack and is stackable, run the stacking logic.
        if (bagItems && equipData.stackable) {
            this.stackItem(equipData.bullet_count);
        } else {

            // Get the current empty slot index and determine if it exists.
            const index = this.getEmptySlot();
            if (index === -1) return false;

            // Create a backpack item.
            this.createItem(equipData, name);

            // Update the value corresponding to the array index of the item slot
            this._actor._data.equipment_name_list[index] = name;

            // Accumulation of the number of uses.
            this._usageCount++;
        }

        return true;
    }

    /**
     * This method is used to discard the equipment currently held in your hand.
     * @returns Dropped status: true is success false is failure
     */
    public dropItem (): boolean {

        // Get the bag index of the currently held equipment.
        const curIndex = this._actor._data.current_equipment_index;

        // Determine if the current index is in the valid range.
        // Default 0 equipment is not drop.
        if (curIndex >= this._capacity || curIndex <= 0) return false;

        // Get it from the bag equipment list.
        const data = this._actor._data.equipment_name_list;

        //Get the name of the equipment in the current slot and determine if the equipment exists based on the name value.
        const name = data[curIndex];
        if (!name || name.length <= 0) return false;

        // Take off the prop that is being equipped.
        this._actor._actorEquipment?.unEquip();

        // Clear specific items data.
        this._actor._data.items[name] = undefined;

        // Discard the current prop near the character.
        const pos = this._actor.node.worldPosition;
        Msg.emit('msg_add_item', { res: name, pos: pos })

        // Clears the value of the equipment list for the current index mapping.
        data[curIndex] = '';

        // Replace the default equipment.
        this._actor._data.current_equipment_index = 0;
        this._actor._actorEquipment?.equip(0);

        // The total number of bags used decreases.
        this._usageCount--;

        return true;
    }

    /**
     * This method is used to create bag items.
     * @param equipData Current equip data.
     * @param name The name of the bag prop that needs to be created.
     */
    public createItem (equipData: any, name: string) {

        let newItems = {
            'name': name,
            'actor': this._actor,
            'stackable': equipData.stackable === undefined ? false : true,
            'count': 1,
            'data': equipData,
            'bulletClipCount': equipData.bullet_clip_count,
            'bulletCount': equipData.bullet_count,
            'lastUseTime': game.totalTime,
        }

        this._actor._data.items[name] = newItems;
    }

    /**
     * This method is used to update the number of stackable props.
     * @param bagItems Current backpack information.
     */
    public stackItem (bagItems: BagItem) {
        bagItems.count++;
        bagItems.bulletCount += bagItems.data.bullet_count;
    }

}


// The bag item data interface.
export interface BagItem {
    fov: number;
    name: string,
    actor: Actor,
    stackable: boolean,
    count: number,
    bulletClipCount: number
    bulletCount: number,
    data: any,
    lastUseTime: number,
}
