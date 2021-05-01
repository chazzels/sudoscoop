// controller for interacting with school portal and perform default actions. 
const PuppetController = require('../../src/core/puppetController');
const InventoryTracker = require('../../src/core/inventoryTracker.js');
var tracker;

//TODO: send message for notification.
class BeamWatcher extends PuppetController {
	
	constructor(name, startPage, targets) {
		
		super(name, startPage);
		
		this.targets = targets;
		this.debugLogs = true;
		
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
		
		for(var i=0; i<this.targets.length; i++) {
			
			await this.page.goto(this.targets[i]);
			
			await this.scanInventory()
			
		};
		
		await tracker.check(this.nameMash());
		
		await this.wait(this.refreshTime);
		
		await this.refresh();
		
		this.run();
		
	}
	
	// collect inventory information. 
	async scanInventory() {
		
		let self = this;
		let productName; 
		let name;
		
		this.log('InventoryScan', 'Running...');
		
		// get product name.
		productName = await self.page.$('.product-single__title');
		productName = await self.page.evaluate(el => el.textContent, productName)
		
		if(productName != null) {
			
			name = await self.page.evaluate(el => el.textContent, productName);
			
			// scrap options from the page. 
			let raw = await self.page.evaluate(
				() => Array.from(
					document.querySelectorAll('#ProductSelect-product-template-option-0 option'), 
					element => element.getAttribute('value')
				)
			);
			
			let data = new Array();
			
			// get the options for the product.
			for(var i=0; i < raw.length; i++) {
				
				let name = await self.page.select('#ProductSelect-product-template-option-0', raw[i]);
				name = name[0];
				
				let sku = await self.page.url().split('?')[1].split('=')[1];
				
				let price = await self.page.$eval('#ProductPrice .money', el => el.textContent)
				
				let stock = await self.page.evaluate(
					() => Array.from(
						document.querySelectorAll('#AddToCart'), 
						element => element.getAttribute('disabled')
					)
				);
				
				if(stock[0] == '') { 
					stock = false; 
				} else {
					stock = true;
				}
				
				// DEV random price set for change testing.
				if(self.getRandomInt(5) == 2) { price = '$'+self.getRandomInt(20)+'.00'; console.log('change', price);}
				
				tracker.addItem(productName, name, sku, price, stock);
				
			}
			
			self.scanCount += 1;
			
			this.log('InventoryScan', 'Completed');
			
			return true;
			
		} else {
			
			this.log('InventoryScan', 'Failed');
			
			return false;
			
		}
		
	}
	
	nameMash() {
		
		let namemash = tracker.items.size.toString();
		
		tracker.items.forEach(function(value, key) {
			
			namemash += key.substring(0,2).toUpperCase();
			
			value.forEach(function(value, key) {
				
				namemash += key.substring(0,2).toUpperCase() 
					+ value.sku.toString().slice(-6);
				
			});
			
		});
		
		return namemash;
		
	}
	
}
BeamWatcher.ColorSelect = '#ProductSelect-product-template-option-0';
BeamWatcher.ColorOption = 'option';

let targets = [
	'https://beampaints.myshopify.com/collections/reclaimed-cedar-palettes/products/birch-palettes',
	'https://beampaints.myshopify.com/collections/reclaimed-cedar-palettes/products/birch-mini-cookie-palette',
];

var watcher = new BeamWatcher('BeamWatcher', 'https://beampaints.myshopify.com/', targets);