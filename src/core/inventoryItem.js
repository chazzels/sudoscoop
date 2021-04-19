class InventoryItem {
	
	constructor(sku, price, stock) {
		
		if(typeof sku == 'undefined') { sku = 1 }
		if(typeof price == 'undefined') { price = null }
		if(typeof stock == 'undefined') { stock = false }
		
		let data = {
			sku: sku,
			price: price,
			stock: stock,
			date: Date.now(),
		}
		
		return data;
		
	}
	
}

module.exports = InventoryItem;