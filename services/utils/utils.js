const randomHex = require('crypto-random-hex');
const axios = require('axios');
const fs = require('fs');
const { buildPoseidon } = require('circomlibjs');
const { IncrementalMerkleTree } = require('@zk-kit/incremental-merkle-tree');

class Utils {
    constructor({ config }) {
        this.logging = config.logging;
        this.trackerApi = config.tracker.api;
        this.partnersFilename = config.partners_filename;

        // Load stored partners data
        try {
            this.partners = JSON.parse(fs.readFileSync(`${this.partnersFilename || 'partners'}.json`, 'utf-8'));
        } catch(err) {
            this.log('Partners file not found, creating new one');
            this.partners = [];
            fs.writeFileSync(`${this.partnersFilename || 'partners'}.json`, JSON.stringify([]));
        }
        this.partnersLoadingTimeout = null;
    }

    log(message) {
        if (this.logging) {
            // eslint-disable-next-line no-console
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }

    unstringifyBigInts(o) {
        if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
            return BigInt(o);
        } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
            return BigInt(o);
        } else if (Array.isArray(o)) {
            return o.map(this.unstringifyBigInts.bind(this));
        } else if (typeof o == "object") {
            if (o===null) return null;
            const res = {};
            const keys = Object.keys(o);
            keys.forEach( (k) => {
                res[k] = this.unstringifyBigInts(o[k]);
            });
            return res;
        } else {
            return o;
        }
    }

    async loadPartners() {
        if (this.partnersLoadingTimeout != null) {
            clearTimeout(this.partnersLoadingTimeout);
            this.partnersLoadingTimeout = null;
        }
        try {
            const res = await axios.get(`${this.trackerApi}/network/partners`);
            this.partners = res.data.data;
            fs.writeFileSync(`${this.partnersFilename || 'partners'}.json`, JSON.stringify(this.partners, null, 2));
        } catch(err) {
            this.log('Failed to load updated list of partners');
        }

        // Load the latest partners table every 3 hours
        this.partnersLoadingTimeout = setTimeout(() => this.loadPartners(), 3 * 3600 * 1000);
    }

    generateId() { return randomHex(32).padStart(64, '0'); }

    findAPI(targetCompanyId, targetDepartmentId) {
        const targetCompany = this.partners.find(company => company.id === targetCompanyId);
        
        if (targetCompany == null) {
            return null;
        }

        const targetDepartment = targetCompany.departments.find(department => department.id === targetDepartmentId);

        if (targetDepartment == null) {
            return null;
        }   

        return targetDepartment.api;
    }

    async generateItemsTree(items) {
        const poseidon = await buildPoseidon();
        const zeroValue = 0;
        const depth = 20;
        const arity = 2;
        const tree = new IncrementalMerkleTree((inputs) => { return BigInt(poseidon.F.toString(poseidon(inputs))) }, depth, zeroValue, arity);

        /**
         * Create leaf for items Merkle tree
         * @param {*} itemId 
         * @param {*} unitCode 
         * @param {*} itemQuantity 
         * @returns {}
         */
        const createLeaf = (itemId, unitCode, itemQuantity) => {
            const itemIdHash = poseidon.F.toString(
                poseidon(
                    [
                        BigInt(
                            `0x${Buffer.from(itemId, 'utf-8').toString('hex')}`, 
                            'hex'
                        )
                    ]
                )
            );
            return { itemIdHash, leaf: BigInt(poseidon.F.toString(poseidon([itemIdHash, unitCode, itemQuantity]))) };
        }

        const leaves = [];
        const itemIdHashes = [];

        for (let i = 0; i < items.length; i += 1) {
            const { itemId, unitCode, itemQuantity } = items[i];
            const { itemIdHash, leaf } = createLeaf(itemId, BigInt('0x' + Buffer.from(unitCode, 'utf-8').toString('hex'), 'hex'), itemQuantity);
            
            tree.insert(leaf);
            leaves.push(leaf);
            itemIdHashes.push(itemIdHash);
        }

        return { tree, leaves, itemIdHashes };
    }

    /**
     * Generate shipment hash
     * @param {*} items 
     * @param {*} shipmentId 
     * @returns 
     */
    async generateShipmentHash(items, shipmentId) {
        const { tree: itemsTree, itemIdHashes, leaves } = await this.generateItemsTree(items);
        const { root: itemsRoot } = itemsTree;

        const poseidon = await buildPoseidon();
        const shipmentHash = poseidon.F.toString(poseidon([BigInt(shipmentId, 'hex'), itemsRoot]));

        return { shipmentHash, itemsRootHash: itemsRoot, itemsTree, itemIdHashes, leaves };
    }

    getPartnerInfo(companyId, departmentId) {
        const company = this.partners.find(partner => partner.id === companyId);
        const department = company.departments.find(department => department.id === departmentId);

        return {
            companyId,
            companyTitle: company.title,
            departmentId,
            departmentTitle: department.title,
            latitude: department.latitude,
            longitude: department.longitude,
        }
    }
}

module.exports = Utils;
