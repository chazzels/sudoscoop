const crypto = require('crypto');
const shasum = crypto.createHash('sha256');
const fs = require('fs');
const Logger = require('./logger');

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
	
	itemSet(key, value) { return this.items.set(key, value); }
	itemGet(key) { return this.items.get(key); }
	itemHas(key) { return this.items.has(key); }
	itemSize() { return this.items.size; }
	
	
	// check if the source seed provided by the controller is different from the last one.
	// then check if the item map is different from master for price changes.
	check(seed) {
		
		let self = this;
		
		this.checkHash(this.createHash(seed), this.items);
		
		this.checkMasterList();
		
	}
	
	// check the items map against the master map.
	checkMasterList() {
		
		let self = this;
		
		this.items.forEach(function(mapData, item, map) {
			
			// check if item has already been seen.
			if(self.master.has(item)) {
				
				// check for price difference from last scan. 
				if(self.master.get(item)[0].price == self.items.get(item).price) {
					
					// nothing to be done. no change in item.
					
				} else {
					
					// log to change history.
					// add updaed price value and timestamp
					let update = self.master.get(item)
					update.unshift(mapData);
					self.master.set(item, update);
					
					//TODO update change log here.
					self.debug('InventoryTracker', 'PriceChange:', item);
					
				}
				
			} else {
				
				self.master.set(item, new Array(mapData));
				
				//TODO update change log here.
				self.debug('InventoryTracker', 'ItemAdded:', item);
				
			}
			
		});
		
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
	
}

module.exports = InventoryTracker;