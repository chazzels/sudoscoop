const crypto = require('crypto');
const shasum = crypto.createHash('sha256');
const fs = require('fs');
const PuppetController = require('../core/puppetController');

//TODO: make report of products added and removed or out of stock.
//TODO: store a master list of products for import on start. 
class InventoryTracker extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		// for development. remove when done.
		this.debugLogs = true;
		
		this.items = new Map();
		this.master = new Map();
		this.fingerprints = new Map();
		this.lastHash = null;
		this.scanCount = -1;
		this.noChangeStreak = 0;
		
	}
	
	
	// check if the source seed provided by the controller is different from the last one.
	// then check if the item map is different from master for price changes.
	check(seed) {
		
		let self = this;
		
		this.checkHash(this.createHash(seed));
		
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
					self.debug('MasterList', 'PriceChange: ', item);
					
				}
				
			} else {
				
				self.master.set(item, new Array(mapData));
				
				//TODO update change log here.
				self.debug('MasterList', 'ItemAdded: ', item);
				
			}
			
		});
		
	}
	
	// compare the hashes to determine what has happened to the inventory.
	checkHash(hash, data) {
		
		if(this.fingerprints.has(hash) && this.lastHash == hash) {
			
			// do nothing... no change...
			this.log('InventoryChange', 
				'NoChange',
				' x'+this.noChangeStreak,
				' (', this.scanCount, ')');
			this.noChangeStreak += 1;
			
		} else if(this.fingerprints.has(hash)) { 
			
			// old hash match
			this.log('MapCheck', 'OldHash');
			this.log('InventoryChange', 'OldState?');
			this.noChangeStreak = 0;
			
		} else if(this.lastHash == null) { 
			
			// first hash
			this.log('MapCheck', 'FirstHash');
			this.fingerprints.set(hash, data);
			this.noChangeStreak += 1;
			
		} else {
			
			// new hash
			this.log('MapCheck', 'NewHash');
			this.log('InventoryChange', 'A CHANGE HAS BEEN DETECTED!!!');
			this.fingerprints.set(hash, data);
			this.noChangeStreak = 0;
			
		}
		
		this.lastHash = hash;
		
	}
	
	// create a SHA256 hash from an input string.
	createHash(seed) {
		
		this.debug('HashInput:', seed);
		
		let hex = crypto.createHash("sha256").update(String(seed)).digest().toString('hex');
		
		this.debug('HashOutput', hex);
		
		return hex;
	}
	
}

module.exports = InventoryTracker;