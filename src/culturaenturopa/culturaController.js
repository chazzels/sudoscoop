// controller for interacting with school portal and perform default actions. 
const PuppetController = require('../core/puppetController');
const InventoryTracker = require('../core/inventoryTracker.js');
var tracker;

//TODO: send message for notification.
class CulturaController extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		// set up the invetory trackers. 
		tracker = new InventoryTracker(name);
		
		// configure the refresh timeout.
		this.refreshTime = 10000;
		if(typeof this.args[0] == 'number') {
			this.refreshTime = this.args[0]*1000;
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
		
		await tracker.check(this.nameMash());
		
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
		
		this.scanCount += 1;
		
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
				//.replace(/\(.{0,100}\)/g, '')
				.replace('$', ' @ $')
				.replace('Price', '')
				.replace('Out of stock', ' @ '+CulturaController.OutOfStock)
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
			
			let mapData = {
				price: source[i][1],
				time: Date.now(),
			};
			
			tracker.itemSet(source[i][0], mapData);
			
		}
		
	}
	
	
	// create a unique string for the hash. 
	nameMash() {
		
		// Make a string of all the first letters of products. 
		let namemash = '';
		
		tracker.items.forEach((value, key, map)=> 
			namemash = namemash.concat(key.substring(0, 1)));
		
		
		// add stock levels in to seed string.
		namemash = tracker.items.size.toString() + '-'
			+ this.countOutOfStock() + '-'
			+ namemash;
		
		return namemash;
		
	}
	
	// count the number of out of stock items. 
	countOutOfStock() {
		
		let oos = 0;
		
		tracker.items.forEach(function(value, key, map) {
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