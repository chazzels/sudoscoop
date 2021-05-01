// controller for interacting with school portal and perform default actions. 
const PuppetController = require('../../src/core/puppetController');
const InventoryTracker = require('../../src/core/inventoryTracker.js');
var tracker;

//TODO send message for notification.
//TODO update to work with new inventory systems.
class CulturaWatcher extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		// set up the invetory trackers. 
		tracker = new InventoryTracker(name);
		
		// configure the refresh timeout.
		this.refreshTime = 10000;
		let argRefreshTime = Number(this.args[0]);
		if(typeof argRefreshTime == 'number' && !isNaN(argRefreshTime)) {
			this.refreshTime = argRefreshTime*1000;
			this.debug('RefreshTime:', argRefreshTime);
		}
		
		// run the main program.
		(async () => {
			await this.initialConnection();
			await this.run();
		})();
		
	}
	
	// run the loop that continues to check. 
	async run() {
		
		await this.scanInventory();
		
		await tracker.check();
		
		await this.wait(this.refreshTime);
		
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
			() => Array.from(
				document.querySelectorAll('li[data-hook="product-list-grid-item"]'), 
				element => element.textContent
			)
		);
		
		// convert the result for processing.
		let items = this.processSourceData(raw);
		
		this.log('InventoryScan', 'Completed');
		
		this.log('InventoryCheck', 
			tracker.items.size.toString(), '/',
			tracker.items.size-this.countOutOfStock(),
			'(items/instock)');
		
		return items;
		
	}
	
	processSourceData(source) {
		
		// clean up the collected data from the products.
		for(var i=0; i < source.length; i++) {
			source[i] = source[i].replace('Quick View', '')
				.replace('$', ' @ $')
				.replace('Price', '')
				.replace('Out of stock', ' @ '+CulturaWatcher.OutOfStock)
				.replace('SIZE', '')
				.replace('( ', '(')
				.replace(' )', ')')
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
			
			// deafult the price if none set. 
			let price = typeof source[i][1] == CulturaWatcher.OutOfStock ? '$0.00' : source[i][1];
			
			// determine stock for the sku. 
			let stock = source[i][1] == CulturaWatcher.OutOfStock ? false : true;
			
			// add the sku to the trackers map.
			tracker.addItem(source[i][0], source[i][0], source[i][0], source[i][1], stock)
			
		}
		
	}
	
	// count the number of out of stock items. 
	countOutOfStock() {
		
		let oos = 0;
		
		tracker.items.forEach(function(value, key, map) {
			console.log(value.get(key).price, CulturaWatcher.OutOfStock);
			if(value.get(key).price == CulturaWatcher.OutOfStock) {
				oos++;
			} 
		});
		
		return oos
		
	}
	
}
CulturaWatcher.OutOfStock = 'OutOfStock';
CulturaWatcher.itemContainer = 'li[data-hook="product-list-grid-item"]';
CulturaWatcher.itemName = 'h3[data-hook="product-item-name"]';
CulturaWatcher.itemOutOfStock = 'span[data-hook="product-item-out-of-stock"]';

var watcher = new CulturaWatcher('CulturaWatcher', 'https://www.culturaenturopa.store/shop?page=10');