// controller for interacting with school portal and perform default actions. 
const crypto = require('crypto');
const shasum = crypto.createHash('sha256');
const fs = require('fs');

const PuppetController = require('../core/puppetController');

//TODO: make report of products added and removed or out of stock.
//TODO: store a master list of products for import on start. 
//TODO: send message for notification.
class CulturaController extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		this.items = new Map();
		this.master = new Map();
		this.fingerprints = new Map();
		this.lastHash = null;
		
		this.defaultRefreshTime = 10000
		this.refreshTime = typeof this.args[0] == 'number' ? this.defaultRefreshTime : this.args[0];
		this.scanCount = -1;
		this.noChangeStreak = 0;
		
		if(typeof this.args[0] == 'number') {
			this.defaultRefreshTime = this.args[0];
		}
		
		(async () => {
			await this.initialConnection();
			await this.run();
		})();
		
	}
	
	// run the loop that continues to check. 
	async run() {
		
		await this.scanInventory();
		await this.checkHash(this.createFingerprint());
		// TODO compare changes if any..
		// log changes.
		
		await this.page.waitForTimeout(this.refreshTime);
		await this.refresh();
		
		this.run();
		
	}
	
	// collect inventory information. 
	async scanInventory() {
		
		// inventory class: li product-list-grid-item [data-hook]
		// inventory name: h3 product-item-name [data-hook]
		// out of stock: span product-item-out-of-stock [data-hook]
		// price to pay: span product-item-price-to-pay [data-hook]
		
		this.log('InventoryScan', 'Running...');
		
		// scrap result from the page. 
		let raw = await this.page.evaluate(
			() => Array.from(document.querySelectorAll('li[data-hook="product-list-grid-item"]'), element => element.textContent)
		);
		
		// convert the result for processing.
		let items = this.processSourceData(raw);
		
		if(this.items.size < raw.length) {
			this.log('InventoryDuplication', 'duplicate invetory found');
		}
		
		this.log('InventoryScan', 'Completed');
		
		this.scanCount += 1;
		
		return this.items;
		
	}
	
	processSourceData(source) {
		
		// clean up the collected data from the products.
		for(var i=0; i < source.length; i++) {
			source[i] = source[i].replace('Quick View', '')
				//.replace(/\(.{0,100}\)/g, '')
				.replace('$', ' @ $')
				.replace('Price', '')
				.replace('Out of stock', ' @ '+CulturaController.OutOfStock)
				.replace('  ', ' ');
		}
		
		// split string into an array for easier handling.
		for(var i=0; i < source.length; i++) {
			source[i] = source[i].split('@');
			source[i][0] = source[i][0].trim();
			source[i][1] = source[i][1].trim();
		}
		
		this.items.clear();
		
		// convert the array into a map for easier comparison.
		for(var i=0; i < source.length; i++) {
			
			let mapData = {
				price: source[i][1],
				time: Date.now(),
			};
			
			this.items.set(source[i][0], mapData);
			
			this.checkMasterList(source[i][0], mapData);
			
		}
		
		return source;
		
	}
	
	checkMasterList(item, mapData) {
		
		// check if item has already been seen.
		if(this.master.has(item)) {
			
			// check for price difference from last scan. 
			if(this.master.get(item)[0].price == this.items.get(item).price) {
				
				// nothing to be done. no change in item.
				
			} else {
				
				// log to change history.
				// add updaed price value and timestamp
				let update = this.master.get(item)
				update.unshift(mapData);
				this.master.set(item, update);
				
				//TODO update change log here.
				this.log('MasterList', 'PriceChange: ', item);
				
			}
			
		} else {
			
			this.master.set(item, new Array(mapData));
			
			//TODO update change log here.
			this.log('MasterList', 'ItemAdded: ', item);
			
		}
		
	}
	
	// compare the hashes to determine what has happened to the inventory.
	checkHash(hash, data) {
		
		this.log('InventoryCheck', 
			this.items.size.toString(), '/',
			this.items.size-this.countOutOfStock(),
			' (items/instock)');
		
		if(this.fingerprints.has(hash) && this.lastHash == hash) {
			
			// do nothing... no change...
			this.log('InventoryChange', 
				'NoChange',
				'x'+this.noChangeStreak,
				'(', this.scanCount, ')');
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
	
	// create a unique string for the hash. 
	nameMash() {
		
		// Make a string of all the first letters of products. 
		let namemash = '';
		
		this.items.forEach((value, key, map)=> 
			namemash = namemash.concat(key.substring(0, 1)));
		
		
		// add stock levels in to seed string.
		namemash = this.items.size.toString() + '-'
			+ this.countOutOfStock() + '-'
			+ namemash;
		
		return namemash;
		
	}
	
	// count the number of out of stock items. 
	countOutOfStock() {
		
		let oos = 0;
		
		this.items.forEach(function(value, key, map) {
			if(value.price == CulturaController.OutOfStock) {
				oos++;
			} 
		});
		
		return oos
		
	}
	
	// create a hash of the results.
	createFingerprint() {
		
		return this.createHash(this.nameMash());
		
	}
	
	// create a SHA256 hash from an input string.
	createHash(namemash) {
		return crypto.createHash("sha256").update(namemash)
			.digest().toString('hex');
	}
	
}
CulturaController.OutOfStock = 'OutOfStock';
CulturaController.itemContainer = 'li[data-hook="product-list-grid-item"]';
CulturaController.itemName = 'h3[data-hook="product-item-name"]';
CulturaController.itemOutOfStock = 'span[data-hook="product-item-out-of-stock"]';

var watcher = new CulturaController('CulturaWatcher', 'https://www.culturaenturopa.store/shop?page=10');