const crypto = require('crypto');
const shasum = crypto.createHash('sha256');
const fs = require('fs');
const Logger = require('./logger');
const InventoryItem = require('./inventoryItem');

//TODO make report of products added and removed or out of stock.
//TODO store a master list of products for import on start. 
//TODO send a message/notification on changes. 
class InventoryTracker extends Logger {
	
	constructor(name) {
		
		super(name);
		
		// track the items from a scanner.
		this.items = new Map();
		
		// track all the items seen and any changes that may have occured,
		this.master = new Map();
		
		// tracks the result hashes after an inventory scan.
		// counts the number of times an hash has been seen.
		this.fingerprints = new Map();
		
		// track the last hash seen by scan.
		this.lastHash = null;
		
		// number of scans checked and hashed.
		this.scanCount = 0;
		
		// running count of many scans have gone unchanged.
		this.noChangeStreak = 0;
		
		// for development. remove when done.
		this.debugLogs = true;
		
	}
	
	// check if the hash is different from the last one.
	// then check if the item map is different from master for price changes.
	check() {
		
		let self = this;
		
		let seed = this.nameMash();
		
		// create and check hashses
		this.checkHash(this.createHash(seed), this.items);
		
		// compare item and master map.
		this.checkMasterList();
		
		// reset the item list for the next scan.
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
	
	// create an new entry for an item on the master map.
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
	
	// add new data point to a sku entry 
	// adds the updated data point to the start of the array. 
	updateMasterSkuArray(source, add) {
		
		source.unshift(add);
		
		return source;
		
	}
	
	// compare the hashes to determine if a change occured.
	//TODO figure out if the data actaully needs to be included in the fingerprint map.
	checkHash(hash, data) {
		
		if(this.fingerprints.has(hash) && this.lastHash == hash) {
			
			// do nothing... no change...
			this.log('InventoryTracker', 
				'NoChange',
				'x'+this.noChangeStreak,
				'('+this.scanCount+')');
				
			this.noChangeStreak += 1;
			
			this.fingerprints.set(hash, this.fingerprints.get(hash)+1);
			
		} else if(this.fingerprints.has(hash)) { 
			
			// old hash match
			this.log('MapCheck', 'OldHash');
			
			this.log('InventoryTracker', 'Change. Old State.');
			
			this.noChangeStreak = 0;
			
			this.fingerprints.set(hash, this.fingerprints.get(hash)+1);
			
		} else if(this.lastHash == null) { 
			
			// first hash
			this.log('MapCheck', 'FirstHash');
			
			this.fingerprints.set(hash, 1);
			
			this.noChangeStreak += 1;
			
		} else {
			
			// new hash
			this.log('MapCheck', 'NewHash');
			
			this.log('InventoryTracker', 'A CHANGE HAS BEEN DETECTED!!!');
			
			this.fingerprints.set(hash, 1);
			
			this.noChangeStreak = 0;
			
		}
		
		this.lastHash = hash;
		
		this.scanCount++;
		
	}
	
	// create a SHA256 hash from an input string.
	createHash(seed) {
		
		this.debug('InventoryHashIn', seed);
		
		let hex = crypto.createHash("sha256")
			.update(String(seed))
			.digest()
			.toString('hex');
		
		this.debug('InventoryHashOut', hex);
		
		return hex;
		
	}
	
	// add an item to the from the current scan. 
	// will be compared to the master map later.
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
	
	// create a unique source string to seed the hash. 
	nameMash() {
		
		let namemash = this.items.size.toString();
		
		this.items.forEach(function(value, key) {
			
			// take the first part of the product name.
			namemash += key.replace(/ /g, '').substring(0,2).toUpperCase();
			
			value.forEach(function(value,key) {
				
				// place the price into the string
				namemash += value.price
					.replace('$', '')
					.replace(/\./g, '')
					.replace(/0/g, '')
					.substring(0,4);
				
				// place the start of the sku name and the end of the sku.
				namemash += key.replace(/ /g, '').substring(0,2).toUpperCase() 
					+ value.sku.toString().replace(/ /g, '').slice(-6);
				
			});
			
		});
		
		return namemash;
		
	}
	
}

module.exports = InventoryTracker;