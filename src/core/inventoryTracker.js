const crypto = require('crypto');
const shasum = crypto.createHash('sha256');
const fs = require('fs');
const Logger = require('./logger');
const InventoryItem = require('./inventoryItem');

//TODO: make report of products added and removed or out of stock.
//TODO: store a master list of products for import on start. 
class InventoryTracker extends Logger {
	
	constructor(name) {
		
		super(name);
		
		this.items = new Map();
		this.master = new Map();
		this.fingerprints = new Map();
		this.lastHash = null;
		this.scanCount = 0;
		this.noChangeStreak = 0;
		
		// for development. remove when done.
		this.debugLogs = true;
		
	}
	
	// check if the source seed provided by the controller is different from the last one.
	// then check if the item map is different from master for price changes.
	check(seed) {
		
		let self = this;
		
		this.checkHash(this.createHash(seed), this.items);
		
		this.checkMasterList();
		
		this.items.clear();
		
	}
	
	// check the items map against the master map.
	checkMasterList() {
		
		let self = this;
		
		self.items.forEach(function masterListEachItem(data, item) {
			
			data.forEach(function masterListEachSku(info, skuName) {
				
				// item has already been seen by the scanner.
				if(self.master.has(item)) {
					
					// skuName is in the item map.
					// add entry to the new map and set an empty array.
					if(self.master.get(item).has(skuName)) {
						
						// check for price difference from last scan. 
						if(typeof self.master.get(item).get(skuName) != "undefined" 
							&& self.master.get(item).get(skuName)[0].price == self.items.get(item).get(skuName).price) {
							
							// TODO check for stock change.
							// nothing to be done. no change in item or sku.
							
						} else {
						// sku price has changed
							
							self.updateMasterSku(item, skuName, info);
							
							//TODO update change log here.
							
							self.debug('InventoryTracker', 'PriceChange:', item, skuName);
							
						}
						
					} else {
					// if sku is not already in the master map.
						
						self.newMasterSku(item, skuName);
						
						self.updateMasterSku(item, skuName, info);
						
						self.debug('InventoryTracker', 'NewSku:', item, skuName)
					}
					
					
				} else {
				// item and sku are new to the master list.
					
					self.newMasterItem(item);
					
					self.newMasterSku(item, skuName);
					
					self.updateMasterSku(item, skuName, info);
					
					//TODO update change log here.
					
					self.debug('InventoryTracker', 'ItemAdded:', item, skuName);
					
				}
				
			});
			
		});
		
	}
	
	// create an new entry for the 
	newMasterItem(item) {
		
		this.master.set(item, new Map());
		
	}
	
	// create new sku on an item on the master map. 
	newMasterSku(item, skuName) {
		
		this.master.get(item).set(skuName, new Array());
		
	}
	
	// update an sku entry on the master map.
	updateMasterSku(item, skuName, info) {
		
		let source = this.master.get(item).get(skuName);
		
		let update = this.updateMasterSkuArray(source, info);
		
		this.master.get(item).set(skuName, update);
		
	}
	
	// add new entry to a sku entery 
	// by adding the updated value to the start of the array. 
	updateMasterSkuArray(source, add) {
		
		source.unshift(add);
		
		return source;
		
	}
	
	// compare the hashes to determine what has happened to the inventory.
	checkHash(hash, data) {
		
		if(this.fingerprints.has(hash) && this.lastHash == hash) {
			
			// do nothing... no change...
			this.log('InventoryTracker', 
				'NoChange',
				'x'+this.noChangeStreak,
				'('+this.scanCount+')');
				
			this.noChangeStreak += 1;
			
		} else if(this.fingerprints.has(hash)) { 
			
			// old hash match
			this.log('MapCheck', 'OldHash');
			this.log('InventoryTracker', 'OldState?');
			this.noChangeStreak = 0;
			
		} else if(this.lastHash == null) { 
			
			// first hash
			this.log('MapCheck', 'FirstHash');
			this.fingerprints.set(hash, data);
			this.noChangeStreak += 1;
			
		} else {
			
			// new hash
			this.log('MapCheck', 'NewHash');
			this.log('InventoryTracker', 'A CHANGE HAS BEEN DETECTED!!!');
			this.fingerprints.set(hash, data);
			this.noChangeStreak = 0;
			
		}
		
		this.lastHash = hash;
		
		this.scanCount++;
		
	}
	
	// create a SHA256 hash from an input string.
	createHash(seed) {
		
		this.debug('InventoryHashIn', seed);
		
		let hex = crypto.createHash("sha256").update(String(seed)).digest().toString('hex');
		
		this.debug('InventoryHashOut', hex);
		
		return hex;
		
	}
	
	addItem(productName, skuName, sku, price, stock) {
		
		// check productname for existing entry.
		if(this.items.has(productName) && this.items.get(productName).has(skuName)) {
			
			// update an exsisting entry
			this.items.get(productName).set(skuName, new InventoryItem(sku, price, stock));
			
		} else {
			
			// create a new product in the item list. 
			if(!this.items.has(productName)) {
				this.items.set(productName, new Map());
			}
			
			// add a new entry by the sku name.
			// add information about it the current state of the item.
			this.items.get(productName).set(skuName, new InventoryItem(sku, price, stock));
			
		}
		
	}
	
}

module.exports = InventoryTracker;