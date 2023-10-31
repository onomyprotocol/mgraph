import { cosmos } from "@graphprotocol/graph-ts";
import { Order, HistoricalFrame, BookBin, BookIncrement, OrderBook } from "../generated/schema";
import {BigInt, BigDecimal, store} from "@graphprotocol/graph-ts";
import {Frame, FrameType} from "./Frame";
import {ceiling, join, offset, removeId, truncate, split} from "./utils";

export function handleTx(data: cosmos.TransactionData): void {
	data.tx.result.events.forEach(event => {
		if (event.eventType == "order") {
			let order = Order.load(`${event.eventType}-${event.getAttributeValue("uid")}`)
			let rateString = event.getAttributeValue("rate");
			// If order == null, then the indexer hasn't seen this order
			// If it is a limit / stop order then we add liquidity to the indexed books
			// If it is a market order, we adjust the book price and bins if needed
			if (order == null) {
				order = new Order(`${event.eventType}-${event.getAttributeValue("uid")}`);
				
				order.owner = event.getAttributeValue("owner")
				order.orderType = event.getAttributeValue("order_type");	
				order.denomAsk = event.getAttributeValue("denom_ask");
				order.denomBid = event.getAttributeValue("denom_bid");
				order.amount = BigInt.fromString(event.getAttributeValue("amount"));
				
				let rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
				let rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
				order.rate = rateNumerator.div(rateDenominator)

				rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
				rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
					
				let inverseRate = rateNumerator.div(rateDenominator)
				let inverseAmount = (order.amount.times(BigInt.fromString(rateString.split(",")[1]))).div(BigInt.fromString(rateString.split(",")[0]))

				order.inverseRate = inverseRate
				order.inverseAmount = inverseAmount

				order.begTime = BigInt.fromString(event.getAttributeValue("begin-time"));
				order.status = event.getAttributeValue("status");
				
				if (order.orderType == "limit") {
					
					addOrder(order.id, order.amount, order.denomBid, order.denomAsk, "sell", order.rate)
					
					rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
					rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
					
					let inverseRate = rateNumerator.div(rateDenominator)
					let inverseAmount = (order.amount.times(BigInt.fromString(rateString.split(",")[1]))).div(BigInt.fromString(rateString.split(",")[0]))
					
					addOrder(order.id, inverseAmount, order.denomAsk, order.denomBid, "buy", inverseRate)
					
				}
					
				if (order.orderType == "market") {
					
					updateBook(order.denomBid, order.denomAsk, "sell", order.rate)
					updateBook(order.denomBid, order.denomAsk, "buy", order.rate)
					
					rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
					rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
					let inverseRate = rateNumerator.div(rateDenominator)
				
					updateBook(order.denomAsk, order.denomBid, "buy", inverseRate)
					updateBook(order.denomAsk, order.denomBid, "sell", inverseRate)
					
				}
			}

			order.amount = BigInt.fromString(event.getAttributeValue("amount"));
			order.updTime = BigInt.fromString(event.getAttributeValue("update-time"));
			let prevStatus = order.status
			order.status = event.getAttributeValue("status");
			order.save();
			
			if (event.getAttributeValue("status") == "filled" && prevStatus != "filled") {

				updateHistoricalFrame(order, event)

				if (event.getAttributeValue("order_type") == "limit") {
					subOrder(order.id, order.amount, order.denomBid, order.denomAsk, "sell", order.rate)

					let rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
					let rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
					
					let inverseRate = rateNumerator.div(rateDenominator)
					let inverseAmount = (order.amount.times(BigInt.fromString(rateString.split(",")[1]))).div(BigInt.fromString(rateString.split(",")[0]))
					

					subOrder(order.id, inverseAmount, order.denomAsk, order.denomBid, "buy", inverseRate)
				}
			}

			if (event.getAttributeValue("status") == "canceled" && prevStatus != "canceled") {
				if (event.getAttributeValue("order_type") == "limit") {
					subOrder(order.id, order.amount, order.denomBid, order.denomAsk, "sell", order.rate)

					let rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
					let rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
					
					let inverseRate = rateNumerator.div(rateDenominator)
					let inverseAmount = (order.amount.times(BigInt.fromString(rateString.split(",")[1]))).div(BigInt.fromString(rateString.split(",")[0]))
					
					subOrder(order.id, inverseAmount, order.denomAsk, order.denomBid, "buy", inverseRate)
				}
			}
		}
	})
}

function updateBook(base: string, quote: string, direction: string, rate: BigDecimal): void {

	var binId: string
	var bin: BookBin | null
	var orderId: string
	var orderExisting: Order | null
	var sigPrice: BigDecimal
	var incrementId: string
	var increment: BookIncrement | null
	var incrementOrders: string[]

	let orderBookId = join([base, quote, direction])
	
	let book = OrderBook.load(orderBookId)

	var bins: string[]
	bins = []

	var orders: string[]
	orders = []

	if (book == null) {
		book = new OrderBook(orderBookId)
		book.base = base
		book.quote = quote
		book.direction = direction
		book.total = BigInt.zero()
		
		book.orders = orders
		book.ceiling = ceiling(rate)
		
		let place = book.ceiling.div(BigDecimal.fromString("10"))
		
		for (let i = 1; i < 6; i++) {
			binId =  join([base, quote, direction, place.toString()])
			bins.push(binId)

			// Create bin
			bin = new BookBin(binId)
			bin.increments = []
			bin.save()
			
			place = place.div(BigDecimal.fromString("10"))
		}
		book.bins = bins
	}
	
	book.rate = rate
	
	let orderCeiling = ceiling(rate)

	if (book.ceiling == orderCeiling) {
		book.save()
		return
	}

	orders = book.orders
	bins = book.bins
	
	// Before we move book.ceiling, calculate bookPlace
	// These will be used to re-org book bins
	let bookPlace = book.ceiling.div(BigDecimal.fromString("10"))
	let orderPlace = orderCeiling.div(BigDecimal.fromString("10"))

	// Book offset is the number of orders of magnitude to move
	// the order books based on the current market order price
	let bookOffset = offset(bookPlace, orderPlace)
	
	let newPlace = BigDecimal.zero()
	var stalePlace: BigDecimal
	
	if (bookOffset < 0) {
		newPlace = bookPlace.div(BigDecimal.fromString("10000"))
	} 
	
	if (bookOffset > 0) {
		newPlace = bookPlace
	}

	if (bookOffset != 0) {
		let absOffset = abs(bookOffset)
		for (let i = 0; i < absOffset; i++) {
			if (bookOffset < 0) {
				// Remove bin from top
				stalePlace = newPlace.times(BigDecimal.fromString("10000"))
	
				// Each round add a bin to bottom
				newPlace = newPlace.div(BigDecimal.fromString("10"))
			} else {
				// Remove bin from bottom
				stalePlace = newPlace.div(BigDecimal.fromString("10000"))
	
				// Each round add on a bin to top
				newPlace = newPlace.times(BigDecimal.fromString("10"))
			}

			// Get Bin that will be removed
			binId =  join([base, quote, direction, stalePlace.toString()])
			
			// Remove stale bin from order-book bin array
			bins = removeId(bins, binId);

			// Load stale bin
			bin = BookBin.load(binId)
			
			var increments: string[]
			
			// Remove stale increments from storage
			if (bin != null) {
				for (let i = 0; i < bin.increments.length; ++i) {
					store.remove("BookIncrement", bin.increments[i])
				}
				increments = []
				bin.increments = increments
				bin.save()
			}

			// Remove BookBin
			store.remove("BookBin", binId)
			
			// Create new bin based on current book decimal place
			binId =  join([base, quote, direction, newPlace.toString()])

			// Add new bin to Order Book entity
			bins.push(binId)

			bin = new BookBin(binId)
			
			increments = []
			bin.increments = increments
			
			if (book.orders.length > 0) {
				var orderAmount: BigInt
				var orderRate: BigDecimal
				

				for (let i = 0, k = book.orders.length; i < k; ++i) {
					orderId = book.orders[i]
					orderExisting = Order.load(orderId)
					
					if (orderExisting != null) {
						if (direction == "sell") {
							orderAmount = orderExisting.amount
							orderRate = orderExisting.rate 
						}
						else { 
							orderAmount = orderExisting.inverseAmount
							orderRate = orderExisting.inverseRate
						}

						if (newPlace.gt(orderRate)) {
							sigPrice = newPlace
						} else {
							sigPrice = truncate(orderRate, newPlace)
						}
	
						incrementId = join([base, quote, direction, newPlace.toString(), sigPrice.toString()])
						increment = BookIncrement.load(incrementId)
						incrementOrders = []
						
						if (increment == null) {
							increment = new BookIncrement(incrementId)
							increment.book = book.id
							increment.bin = bin.id
							increment.place = newPlace.toString()
							increment.amount = BigInt.zero()
							increments.push(increment.id)
						} else {
							incrementOrders = increment.orders
						}
				
						increment.amount = increment.amount.plus(orderAmount)
						incrementOrders.push(orderExisting.id)
						increment.orders = incrementOrders
						increment.save()
					}
				}
			}
			bin.increments = increments
			bin.save()

			if (bookOffset < 0) {
				bookOffset++
			} else {
				bookOffset--
			}
		}
	}

	book.ceiling = orderCeiling
	book.bins = bins
	book.orders = orders
	book.save()
}

function addOrder(id: string, amount: BigInt, base: string, quote: string, direction: string, rate: BigDecimal): void {
	
	let orderBookId = join([base, quote, direction])
	
	let book = OrderBook.load(orderBookId)

	var bin: BookBin | null
	var bins: string[]
	bins = []

	var binId: string

	var orders: string[]
	orders = []

	if (book == null) {
		book = new OrderBook(orderBookId)
		book.base = base
		book.quote = quote
		book.direction = direction
		book.total = BigInt.zero()
		
		book.orders = orders
		book.ceiling = ceiling(rate)
		
		let place = book.ceiling.div(BigDecimal.fromString("10"))

		for (let i = 1; i < 6; i++) {
			binId =  join([base, quote, direction, place.toString()])
			bins.push(binId)

			// Create bin
			bin = new BookBin(binId)
			bin.increments = []
			bin.save()
			
			place = place.div(BigDecimal.fromString("10"))
		}

		bins
		book.bins = bins
	}
	
	book.rate = rate
	book.total = book.total.plus(amount)
	
	orders = book.orders

	// Add order to orders temporary variable
	orders.push(id)
	orders = orders
	book.orders = orders

	// Done editing book
	book.save()

	var increments: string[]
	
	var incrementId: string
	var increment: BookIncrement | null
	var incrementOrders: string[]
	
	var place: BigDecimal
	var sigPrice: BigDecimal
	
	for (let i = 0, k = book.bins.length; i < k; ++i) {
		binId = book.bins[i]
		place = BigDecimal.fromString(split(binId)[3])

		bin = BookBin.load(binId)
		increments = []
		if (bin == null) {
			bin = new BookBin(binId)
			bin.increments = increments
		}

		increments = bin.increments

		if (place.gt(rate)) {
			sigPrice = place
		} else {
			sigPrice = truncate(rate, place)
		}
		
		incrementId = join([base, quote, direction, place.toString(), sigPrice.toString()])
		increment = BookIncrement.load(incrementId)
		
		if (increment == null) {
			increment = new BookIncrement(incrementId)
			increment.book = book.id
			increment.bin = bin.id
			increment.place = place.toString()
			increment.amount = BigInt.zero()
			increment.orders = []
			increments.push(increment.id)
		}

		increment.amount = increment.amount.plus(amount)
		
		incrementOrders = increment.orders
		incrementOrders.push(id)
		incrementOrders = incrementOrders
		increment.orders = incrementOrders

		increment.save()
		
		increments = increments
		bin.increments = increments
		bin.save()
	}
}

function subOrder(id: string, amount: BigInt, base: string, quote: string, direction: string, rate: BigDecimal): void {
	
	let orderBookId = join([base, quote, direction])
	
	let book = OrderBook.load(orderBookId)
	
	// Book shouldn't be null ever, but if it is lets skip
	if (book != null) {
		book.total = book.total.minus(amount)
		book.orders = removeId(book.orders, id)
		book.save()

		var binId: string
		var bin: BookBin | null
		var place: BigDecimal

		var sigPrice: BigDecimal
		var incrementId: string
		var increment: BookIncrement | null
		var orders: string[]
		var increments: string[]
	
		for (let i = 0; i < book.bins.length; i++) {
			
			binId =  book.bins[i]
			place = BigDecimal.fromString(binId.split("-")[3])
			bin = BookBin.load(binId)

			if (bin != null) {
				if (place.gt(rate)) {
					sigPrice = place
				} else {
					sigPrice = truncate(rate, place)
				}
				
				incrementId = join([base, quote, direction, place.toString(), sigPrice.toString()])
				increment = BookIncrement.load(incrementId)
				
				if (increment === null) { throw new Error('Missing Increment: ' + incrementId + ' Order: ' + id + ' Bin Increments: ' + join(bin.increments)); }
				
				// Increment shouldn't be null but if it is skip
				if (increment != null) {
					orders = increment.orders
					orders = removeId(orders, id)

					if (orders.length == 0) {
						increment.orders = []
						increment.amount = BigInt.zero()
						increment.save()
						store.remove("BookIncrement", incrementId)
						
						increments = bin.increments
						increments = removeId(increments, incrementId)
						increments
						bin.increments = increments
						bin.save()
					} else {
						increment.orders = orders
						increment.amount = increment.amount.minus(amount)
						if (increment.amount.lt(BigInt.zero())) {
							throw new Error("increment negative: " + incrementId + " amount: " + increment.amount.toString())
						}
						increment.save()
					}
				}
			}
		}
	}
}

// updateExecutionHistoricalFrame aggregates trade execution prices into frames
function updateHistoricalFrame(order: Order, event: cosmos.Event): void {
  let timeStamp = order.updTime;
  let frameTypes = FrameType.all()
  
	for (let i = 0; i < frameTypes.length; i++) {
    let frameType = frameTypes[i]
			
    // First Bid -> Base Ask -> Quote
		let frame = new Frame(order.denomBid, order.denomAsk, timeStamp, frameType)

		let id = frame.getID();
		let frameEntity = HistoricalFrame.load(id)

	if (frameEntity == null) {
		frameEntity = new HistoricalFrame(id)
		frameEntity.type = frameType
		frameEntity.base = frame.base
		frameEntity.quote = frame.quote
		frameEntity.startTime = frame.startTime
		frameEntity.startPrice = order.rate
		frameEntity.endTime = frame.endTime
		frameEntity.minPrice = frameEntity.startPrice
		frameEntity.maxPrice = frameEntity.startPrice
		frameEntity.volume = BigInt.zero()
		frameEntity.transactionsCount = BigInt.zero()
	}
			
	frameEntity.transactionsCount = frameEntity.transactionsCount.plus(BigInt.fromI32(1))
	frameEntity.updateTime = timeStamp
	frameEntity.endPrice = order.rate

      
	if (frameEntity.minPrice.gt(order.rate)) {
		frameEntity.minPrice = order.rate
	}
	
	if (frameEntity.maxPrice.lt(order.rate)) {
		frameEntity.maxPrice = order.rate
	}

	frameEntity.volume = frameEntity.volume.plus(order.amount)

	frameEntity.save();
			
	// Then Ask -> Base Bid -> Quote
	frame = new Frame(order.denomAsk, order.denomBid, timeStamp, frameType)
	id = frame.getID();
	frameEntity = HistoricalFrame.load(id)

	let rateString = event.getAttributeValue("rate");
	let rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
	let rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
	let reversePrice = rateNumerator.div(rateDenominator)
	let reverseAmount = (order.amount.times(BigInt.fromString(rateString.split(",")[0]))).div(BigInt.fromString(rateString.split(",")[1]))

	if (frameEntity == null) {
		frameEntity = new HistoricalFrame(id);
		frameEntity.type = frameType;
		frameEntity.base = frame.base
		frameEntity.quote = frame.quote
		frameEntity.startTime = frame.startTime
		frameEntity.startPrice = reversePrice
		frameEntity.endTime = frame.endTime
		frameEntity.minPrice = reversePrice
		frameEntity.maxPrice = reversePrice
		frameEntity.volume = BigInt.zero()
		frameEntity.transactionsCount = BigInt.zero()
	}

	frameEntity.transactionsCount = frameEntity.transactionsCount.plus(BigInt.fromI32(1))
	frameEntity.updateTime = timeStamp
	frameEntity.endPrice = reversePrice

      
	if (frameEntity.minPrice.gt(reversePrice)) {
		frameEntity.minPrice = reversePrice
	}
	
	if (frameEntity.maxPrice.lt(reversePrice)) {
		frameEntity.maxPrice = reversePrice
	}

	frameEntity.volume = frameEntity.volume.plus(reverseAmount)

	frameEntity.save();	
  }
}