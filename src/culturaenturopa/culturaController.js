// controller for interacting with school portal and perform default actions. 
const puppeteer = require('puppeteer');
const crypto = require('crypto')
const shasum = crypto.createHash('sha256')
const PuppetController = require('../core/puppetController');

//TODO: collect information about current products. 
//TODO: price track
//TODO: make report of products added and removed or out of stock.
//TODO: send message for notification.
class CulturaController extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		this.items = new Array();
		this.names = new Array();
		this.oos = new Array();
		
		this.fingerprints = new Map();
		this.lastHash = null;
		
		this.scanCount = -1;
		this.noChangeStreak = 0;
		
		(async () => {
			await this.initialConnection();
			await this.run();
		})();
		
	}
	
	
	// run the loop that continues to check. 
	async run() {
		
		let scanData = await this.scanInventory();
		console.log(scanData);
		await this.checkHash(this.createFingerprint(this.names, this.oos));
		// save data..
		// compare changes if any..
		// log changes.
		
		await this.page.waitForTimeout(10000);
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
		
		this.items = await this.page.evaluate(
			() => Array.from(document.querySelectorAll('li[data-hook="product-list-grid-item"]'), element => element.textContent)
		);
		
		// clean up the collected data from the products.
		for(var i=0; i < this.items.length; i++) {
			this.items[i] = this.items[i].replace('Quick View', '')
				.replace(/\(.{0,100}\)/g, '')
				.replace('$', ' @ $')
				.replace('Out of stock', ' @ OutOfStock')
				.replace('  ', ' ');
		}
		
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
	
	// compare the hashes to determine what has happened to the inventory.
	async checkHash(hash) {
		
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
			this.fingerprints.set(hash, {});
			this.noChangeStreak += 1;
			
		} else {
			
			// new hash
			this.log('MapCheck', 'New Hash');
			this.log('InventoryChange', 'A CHANGE HAS BEEN DETECTED!!!');
			this.fingerprints.set(hash, {});
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
	nameMash(names, namecheck, oos, namemash) {
		
		return names.length.toString() + '-' + namecheck.size.toString() 
			+ '-' + oos.length.toString()
			+ namemash;
			
	}
	
	// create a hash of the results.
	createFingerprint(names, oos) {
		
		let namecheck = new Map();
		names.forEach(element => namecheck.set(element, 1));
		
		// Make a string of all the first letters of products. 
		let namemash = '';
		names.forEach(element => namemash = namemash.concat(element.substring(0, 1)));
		
		// add more information to the string.
		namemash = this.nameMash(names, namecheck, oos, namemash);
		
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