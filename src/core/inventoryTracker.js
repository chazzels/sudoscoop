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
		
		console.log(this.master);
		
	}
	
	// check the items map against the master map.
	checkMasterList() {
		
		let self = this;
		
		self.items.forEach(function(data, item) {
			
			// check if item has already been seen.
			if(self.master.has(item)) {
				
				// TODO this does not compare the new product structure correctly.
				// check for price difference from last scan. 
				if(self.master.get(item).get == self.items.get(item).price) {
					
					// nothing to be done. no change in item.
					
				} else {
					
					// log to change history.
					// add updaed price value and timestamp
					let update = self.master.get(item)
					update.unshift(data);
					
					self.master.set(item, update);
					
					//TODO update change log here.
					self.debug('InventoryTracker', 'PriceChange:', item);
					
				}
				
			} else {
				
				self.master.set(item, new Array(data));
				
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
	
	addItem(productName, name, sku, price, stock) {
		
		// check productname for existing entry.
		if(this.items.has(productName)) {
			
			// update an exsisting entry wu
			this.items.get(productName).set(name, new InventoryItem(sku, price, stock));
			
		} else {
			
			// create a new product in the item list. 
			this.items.set(productName, new Map());
			
			// add a new entry by the sku name.
			// add information about it the current state of the item.
			this.items.get(productName)
				.set(name, new InventoryItem(sku, price, stock));
			
		}
		
	}
	
}

module.exports = InventoryTracker;