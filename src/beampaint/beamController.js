// controller for interacting with school portal and perform default actions. 
const PuppetController = require('../core/puppetController');
const InventoryTracker = require('../core/inventoryTracker.js');
var tracker;

//TODO: send message for notification.
class BeamWatcher extends PuppetController {
	
	constructor(name, startPage) {
		
		super(name, startPage);
		
		this.debugLogs = true;
		
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
		
		// #AddToCart
		
		await this.scanInventory();
		
		await tracker.check(this.nameMash());
		
		await this.wait(this.refreshTime);
		
		await this.refresh();
		
		this.run();
		
	}
	
	// collect inventory information. 
	async scanInventory() {
		
		let self = this;
		
		this.log('InventoryScan', 'Running...');
		
		// scrap result from the page. 
		let raw = await this.page.evaluate(
			() => Array.from(
				document.querySelectorAll('#ProductSelect-product-template-option-0 option'), 
				element => element.getAttribute('value')
			)
		);
		
		for(var i=0; i < raw.length; i++) {
			
			await self.page.select('#ProductSelect-product-template-option-0', raw[i]);
			
			//await self.wait(1000);
			
			let data = await self.page.url().split('?')[1].split('=')[1];
			
			tracker.items.set(raw[i], data);
			
		}
		
		this.log('InventoryScan', 'Completed');
		
		this.scanCount += 1;
		
	}
	
	nameMash() {
		
		let namemash = tracker.items.size.toString() + '-';
		
		tracker.items.forEach((value, key)=> 
			namemash = namemash.concat(key.substring(0, 2).toUpperCase()) + value );
		
		return namemash;
		
	}
	
}
BeamWatcher.ColorSelect = '#ProductSelect-product-template-option-0';
BeamWatcher.ColorOption = 'option';

var watcher = new BeamWatcher('BeamWatcher', 'https://beampaints.myshopify.com/collections/reclaimed-cedar-palettes/products/birch-mini-cookie-palette');