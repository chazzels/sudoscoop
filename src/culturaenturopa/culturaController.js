// controller for interacting with school portal and perform default actions. 
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const shasum = crypto.createHash('sha256');

const PuppetController = require('../core/puppetController');

//TODO: collect information about current products. 
//TODO: price track.
//TODO: make report of products added and removed or out of stock.
//TODO: store a master list of products for import on start. 
//TODO: send message for notification.
class CulturaController extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		this.items = new Map();
		this.master = new Map();
		
		// not needed please remove.
		// TODO: remove when fingerprinting is updated. 
		this.names = new Array();
		this.oos = new Array();
		
		this.fingerprints = new Map();
		this.lastHash = null;
		
		this.defaultRefreshTime = 10000
		this.refreshTime = typeof this.args[0] == 'number' ? this.defaultRefreshTime : this.args[0];
		this.scanCount = -1;
		this.noChangeStreak = 0;
		
		if(typeof this.args[0] == 'number') {
			this.defaultRefreshTime = this.args[0];
		}
		console.log(this.refreshTime);
		
		(async () => {
			await this.initialConnection();
			await this.run();
		})();
		
	}
	
	
	// run the loop that continues to check. 
	async run() {
		
		let scanData = await this.scanInventory();
		await this.checkHash(this.createFingerprint(this.names, this.oos));
		// compare changes if any..
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
		
		
		// TODO: remove after the fingerprint process has been updated.
		this.names = await this.page.evaluate(
			() => Array.from(document.querySelectorAll('h3[data-hook="product-item-name"]'), element => element.textContent)
		);
		this.oos = await this.page.evaluate(
			() => Array.from(document.querySelectorAll('span[data-hook="product-item-out-of-stock"]'), element => element.textContent)
		);
		
		
		this.log('InventoryScan', 'Completed');
		
		this.scanCount += 1;
		
		return this.items;
		
	}
	
	processSourceData(source) {
		
		// clean up the collected data from the products.
		for(var i=0; i < source.length; i++) {
			source[i] = source[i].replace('Quick View', '')
				.replace(/\(.{0,100}\)/g, '')
				.replace('$', ' @ $')
				.replace('Out of stock', ' @ OutOfStock')
				.replace('  ', ' ');
		}
		
		// split string into an array for easier handling.
		for(var i=0; i < source.length; i++) {
			source[i] = source[i].split('@');
			source[i][0] = source[i][0].trim();
			source[i][1] = source[i][1].trim();
		}
		
		
		// convert the array into a map for easier comparison.
		for(var i=0; i < source.length; i++) {
			
			let mapData = {
				price: source[i][1],
				time: Date.now(),
			};
			
			this.items.set(source[i][0], mapData);
			
			// check if item has already been seen.
			if(this.master.has(source[i][0])) {
				
				// check for price difference from last scan. 
				if(this.master.get(source[i][0]).price == this.items.get(source[i][0]).price) {
					
					//console.log('match');
					
				} else {
					
					//console.log('change');
					
				}
				
			} else {
				
				this.log('MasterList', 'Item Added: '+source[i][0])
				this.master.set(source[i][0], mapData);
				
			}
			
		}
		
		return source;
		
	}
	
	// compare the hashes to determine what has happened to the inventory.
	async checkHash(hash, data) {
		
		if(this.fingerprints.has(hash) && this.lastHash == hash) {
			
			// do nothing... no change...
			this.log('InventoryChange', 'No Change x'+this.noChangeStreak+' ('+this.scanCount+')');
			this.noChangeStreak += 1;
			
		} else if(this.fingerprints.has(hash)) { 
			
			// old hash match
			this.log('MapCheck', 'Old Hash');
			this.log('InventoryChange', 'Old State???');
			this.noChangeStreak = 0;
			
		} else if(this.lastHash == null) { 
			
			// first hash
			this.log('MapCheck', 'First Hash');
			this.fingerprints.set(hash, data);
			this.noChangeStreak += 1;
			
		} else {
			
			// new hash
			this.log('MapCheck', 'New Hash');
			this.log('InventoryChange', 'A CHANGE HAS BEEN DETECTED!!!');
			this.fingerprints.set(hash, data);
			this.noChangeStreak = 0;
			
		}
		
		this.lastHash = hash;
		
	}
	
	// check that there are no duplicate names.
	// TODO: actually compare the values.
	nameCheck(names) {
		
		let namecheck = new Map();
		
		names.forEach(element => namecheck.set(element, 1));
		
		if(namecheck.size != names.length) {
			this.log('ProductNames', 'Possible duplicate product names');
		}
		
		return namecheck;
		
	}
	
	
	// create a unique string for the hash. 
	// TODO: need to updat to use the new map function. 
	nameMash(names, namecheck, oos) {
		
		// Make a string of all the first letters of products. 
		let namemash = '';
		names.forEach(element => namemash = namemash.concat(element.substring(0, 1)));
		
		return names.length.toString() + '-' + namecheck.size.toString() 
			+ '-' + oos.length.toString()
			+ namemash;
			
	}
	
	// create a hash of the results.
	// TODO: update to use the map object. 
	createFingerprint(names, oos) {
		
		let namecheck = this.nameCheck(names);
		
		// add more information to the string.
		let namemash = this.nameMash(names, namecheck, oos);
		
		this.log('InventoryCheck', names.length.toString()+'/'+(names.length-oos.length)
			+' (items/instock)');
		
		return this.createHash(namemash);
		
	}
	
	// create a SHA256 hash from an input string.
	createHash(namemash) {
		return crypto.createHash("sha256").update(namemash).digest().toString('hex');
	}
	
}
CulturaController.itemContainer = 'li[data-hook="product-list-grid-item"]';
CulturaController.itemName = 'h3[data-hook="product-item-name"]';
CulturaController.itemOutOfStock = 'span[data-hook="product-item-out-of-stock"]';

var watcher = new CulturaController('CulturaWatcher', 'https://www.culturaenturopa.store/shop?page=10');