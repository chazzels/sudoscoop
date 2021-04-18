// controller for interacting with school portal and perform default actions. 
const InvetoryTracker = require('../core/inventoryTracker.js');

//TODO: send message for notification.
class CulturaController extends InvetoryTracker {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		this.defaultRefreshTime = 10000
		this.refreshTime = typeof this.args[0] == 'number' ? this.defaultRefreshTime : this.args[0];
		
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
		
		this.items = await this.scanInventory();
		await this.check(this.nameMash());
		
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
		
		this.log('InventoryScan', 'Completed');
		
		this.scanCount += 1;
		
		this.log('InventoryCheck', 
			this.items.size.toString(), '/',
			this.items.size-this.countOutOfStock(),
			' (items/instock)');
		
		return items;
		
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
		
		let items = new Map();
		
		// convert the array into a map for easier comparison.
		for(var i=0; i < source.length; i++) {
			
			let mapData = {
				price: source[i][1],
				time: Date.now(),
			};
			
			items.set(source[i][0], mapData);
			
		}
		
		return items;
		
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
	
}
CulturaController.OutOfStock = 'OutOfStock';
CulturaController.itemContainer = 'li[data-hook="product-list-grid-item"]';
CulturaController.itemName = 'h3[data-hook="product-item-name"]';
CulturaController.itemOutOfStock = 'span[data-hook="product-item-out-of-stock"]';

var watcher = new CulturaController('CulturaWatcher', 'https://www.culturaenturopa.store/shop?page=10');