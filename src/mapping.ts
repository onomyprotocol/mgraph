import { cosmos } from "@graphprotocol/graph-ts";
import { Order, HistoricalFrame, BookBin, BookIncrement, OrderBook } from "../generated/schema";
import {BigInt, BigDecimal, store} from "@graphprotocol/graph-ts";
import {Frame, FrameType} from "./Frame";
import {sigFigs, join, ceiling, removeId, offset} from "./utils";

export function handleTx(data: cosmos.TransactionData): void {
	data.tx.result.events.forEach(event => {
		if (event.eventType == "order") {
			let order = Order.load(`${event.eventType}-${event.getAttributeValue("uid")}`)
			
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
				let rateString = event.getAttributeValue("rate");
				let rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
				let rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
				order.rate = rateNumerator.div(rateDenominator)
				order.begTime = BigInt.fromString(event.getAttributeValue("begin-time"));
				/*
				if (order.orderType == "limit") {
					addLiquidity(order)
				}
				*/			
				if (order.orderType == "market") {
					updateBook(order, "sell", order.rate)
					/*
					rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
					rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
					let buyRate = rateNumerator.div(rateDenominator)
				
					updateBook(order, "buy", buyRate)
					*/
				}
				
			}

			order.amount = BigInt.fromString(event.getAttributeValue("amount"));
			order.status = event.getAttributeValue("status");
			order.updTime = BigInt.fromString(event.getAttributeValue("update-time"));
			
			order.save();

			if (event.getAttributeValue("status") == "filled") {
				updateHistoricalFrame(order, event)
				/*
				if (event.getAttributeValue("limit")) {
					removeLiquidity(order)
				}
				*/
			}
			
			if (event.getAttributeValue("status") == "cancelled") {
				/*
				if (event.getAttributeValue("limit")) {
					removeLiquidity(order)
				}
				*/
			}
		}
	})
}

function updateBook(order: Order, direction: string, rate: BigDecimal): void {
	let base = order.denomBid
	let quote = order.denomAsk
	
	if (direction = "buy") {
		base = order.denomAsk
		quote = order.denomBid
	}
	
	let orderBookId = join([base, quote, direction])
	
	let book = OrderBook.load(orderBookId)

	if (book == null) {
		book = new OrderBook(orderBookId)
		book.base = base
		book.quote = quote
		book.direction = direction
		book.total = BigInt.zero()
		book.bins = []
		book.orders = []
		book.ceiling = ceiling(order.rate)
	}
	
	book.rate = rate
	let orderCeiling = ceiling(rate)

	if (book.ceiling == orderCeiling) {
		book.save()
		return
	}

	// Before we move book.ceiling, calculate bookPlace
	// These will be used to re-org book bins
	let bookPlace = book.ceiling.div(BigDecimal.fromString("10"))
	let orderPlace = orderCeiling.div(BigDecimal.fromString("10"))

	// Book offset is the number of orders of magnitude to move
	// the order books based on the current market order price
	let bookOffset = offset(bookPlace, orderPlace)
	
	/*
	var stalePlace: string
	var binId: string
	var bin: BookBin | null
	
	while (bookOffset != 0) {
		if (bookOffset < 0) {
			// Remove bin from top
			stalePlace = bookPlace.times(BigDecimal.fromString("10000")).toString()

			// Each round add a bin to bottom
			bookPlace = bookPlace.div(BigDecimal.fromString("10"))
		} else {
			// Remove bin from bottom
			stalePlace = bookPlace.div(BigDecimal.fromString("10000")).toString()

			// Each round add on a bin to top
			bookPlace = bookPlace.times(BigDecimal.fromString("10"))
		}

		// Get Bin that will be removed
		binId =  join([base, quote, direction, stalePlace])
		bin = BookBin.load(binId)
		
		// Remove stale bin from order-book bin array
		book.bins = removeId(book.bins, binId);

		// Remove stale increments from storage
		if (bin != null) {
			bin.book.forEach(incrementId => {
				store.remove("BookIncrement", incrementId)
			});
		}

		// Remove BookBin
		store.remove("BookBin", binId)

		// Create new bin based on current book decimal place
		binId =  join([base, quote, direction, bookPlace.toString()])
		bin = new BookBin(binId)
		bin.book = []

		// Add new bin to Order Book entity
		book.bins.push(binId)
		
		var sigPrice: number
		var incrementId: string
		var orderId: string
		var orderExisting: Order | null
		var orderExistingPlace: BigDecimal
		var orderOffset: number
		var increment: BookIncrement | null

		for (let i = 0, k = book.orders.length; i < k; ++i) {
			orderId = book.orders[i]
			orderExisting = Order.load(orderId)
			orderOffset = 0
			
			// All orders should not be null, but need this because
			// load function may return null
			if (orderExisting != null) {
				
				orderExistingPlace = ceiling(orderExisting.rate).div(BigDecimal.fromString("10")) 
				
				while (orderExistingPlace.gt(bookPlace)) {
					orderOffset++
					orderExistingPlace = orderExistingPlace.div(BigDecimal.fromString("10"))
				}
				
				
				if (orderExistingPlace.lt(bookPlace)) {
					while (orderExistingPlace.lt(bookPlace)) {
						orderOffset--
						orderExistingPlace = orderExistingPlace.times(BigDecimal.fromString("10"))
					}
				}
				
				if (orderOffset < 0) {
					sigPrice = parseFloat(bookPlace.toString())
				} else {
					sigPrice = sigFigs(parseFloat(order.rate.toString()), 1+orderOffset)
				}
				
				incrementId = join([base, quote, direction, bookPlace.toString(), sigPrice.toString()])
				increment = BookIncrement.load(incrementId)
				
				if (increment == null) {
					increment = new BookIncrement(incrementId)
					increment.place = bookPlace.toString()
					increment.amount = BigInt.zero()
					increment.orders = []
				}
		
				increment.amount = increment.amount.plus(order.amount)
				increment.orders.push(order.id)
				
				if (bin != null) {
					bin.book.push(increment.id)
				}

				increment.save()
				
			}
			
		}
		
		bin.save()
		
		if (bookOffset < 0) {
			bookOffset++
		} else {
			bookOffset--
		}
	}
	book.save()
	*/
}

// Add liquidity to books
function addLiquidity(order: Order): void {
	addOrder(order, "sell")
	addOrder(order, "buy")
}

function addOrder(order: Order, direction: string): void {
	let base = order.denomBid
	let quote = order.denomAsk
	
	if (direction = "buy") {
		base = order.denomAsk
		quote = order.denomBid
	}
	
	let orderBookId = join([base, quote, direction])
	
	let book = OrderBook.load(orderBookId)
	
	if (book == null) {
		book = new OrderBook(orderBookId)
		book.base = base
		book.quote = quote
		book.direction = direction
		book.total = BigInt.zero()
		book.bins = []
		book.orders = []

		if (direction == "sell") {
			book.rate = order.rate
			book.ceiling = ceiling(order.rate)
		} else {
			book.rate = BigDecimal.fromString("1").div(order.rate)
			book.ceiling = ceiling(BigDecimal.fromString("1").div(order.rate))
		}
	}

	book.total = book.total.plus(order.amount)
	book.orders.push(order.id)

	var binId: string
	var bin: BookBin | null
	let offset = 0
	var orderCeiling: BigDecimal
	
	if (direction == "sell") {
		orderCeiling = ceiling(order.rate)
	} else {
		orderCeiling = ceiling(BigDecimal.fromString("1").div(order.rate))
	}
	
	if (orderCeiling.gt(book.ceiling)) {
		while (orderCeiling.gt(book.ceiling)) {
			offset++
			orderCeiling.div(BigDecimal.fromString("10"))
		}
	}

	if (orderCeiling.lt(book.ceiling)) {
		while (orderCeiling.gt(book.ceiling)) {
			offset--
			orderCeiling.times(BigDecimal.fromString("10"))
		}
	}
	
	let place = book.ceiling.div(BigDecimal.fromString("10"))

	var sigPrice: number
	var incrementId: string
	var incrementEntity: BookIncrement | null
	
	for (let i = 1; i < 6; i++) {
		
		binId =  join([base, quote, direction, place.toString()])
		bin = BookBin.load(binId)

		if (bin == null) {
			bin = new BookBin(binId)
			bin.book = []
			book.bins.push(binId)
		}

		if (place.gt(order.rate)) {
			sigPrice = parseFloat(place.toString())
		} else {
			sigPrice = sigFigs(parseFloat(order.rate.toString()), i+offset)
		}
		
		incrementId = join([base, quote, direction, place.toString(), sigPrice.toString()])
		incrementEntity = BookIncrement.load(incrementId)
		
		if (incrementEntity == null) {
			incrementEntity = new BookIncrement(incrementId)
			incrementEntity.place = place.toString()
			incrementEntity.amount = BigInt.zero()
			incrementEntity.orders = []
		}

		incrementEntity.amount = incrementEntity.amount.plus(order.amount)
		
		incrementEntity.orders.push(order.id)
		incrementEntity.save()
		
		bin.book.push(incrementEntity.id)
		bin.save()
		
		place = place.div(BigDecimal.fromString("10"))
	}
	
	book.save()
}

// Remove liquidity from books 
function removeLiquidity(order: Order): void {
	subOrder(order, "sell")
	subOrder(order, "buy")
}

function subOrder(order: Order, direction: string): void {
	let base = order.denomBid
	let quote = order.denomAsk
	
	if (direction = "buy") {
		base = order.denomAsk
		quote = order.denomBid
	}
	
	let orderBookId = join([base, quote, direction])
	
	let book = OrderBook.load(orderBookId)
	
	// Book shouldn't be null ever, but if it is lets skip
	if (book != null) {
		book.total = book.total.minus(order.amount)
		book.orders = removeId(book.orders, order.id)
		book.save()

		var binId: string
		var bin: BookBin | null
		let offset = 0
		var orderCeiling: BigDecimal
		if (direction == "sell") {
			orderCeiling = ceiling(order.rate)
		} else {
			orderCeiling = ceiling(BigDecimal.fromString("1").div(order.rate))
		}
	
		if (orderCeiling.gt(book.ceiling)) {
			while (orderCeiling.gt(book.ceiling)) {
				offset++
				orderCeiling.div(BigDecimal.fromString("10"))
			}
		}

		if (orderCeiling.lt(book.ceiling)) {
			while (orderCeiling.gt(book.ceiling)) {
				offset--
				orderCeiling.times(BigDecimal.fromString("10"))
			}
		}

		let place = book.ceiling.div(BigDecimal.fromString("10"))

		var sigPrice: number
		var incrementId: string
		var increment: BookIncrement | null
	
		for (let i = 1; i < 6; i++) {
			
			binId =  join([base, quote, direction, place.toString()])
			bin = BookBin.load(binId)

			// Bin shouldn't be null but if it is
			if (bin != null) {
				if (place.gt(order.rate)) {
					sigPrice = parseFloat(place.toString())
				} else {
					sigPrice = sigFigs(parseFloat(order.rate.toString()), i+offset)
				}
				
				incrementId = join([base, quote, direction, place.toString(), sigPrice.toString()])
				increment = BookIncrement.load(incrementId)
				
				// Increment shouldn't be null but if it is skip
				if (increment != null) {
					increment.orders = removeId(increment.orders, order.id)

					if (increment.orders.length == 0) {
						store.remove("BookIncrement", incrementId)
						bin.book = removeId(bin.book, incrementId)
						bin.save()
					} else {
						increment.amount = increment.amount.minus(order.amount)
						increment.save()
					}
				}
			}

			place = place.div(BigDecimal.fromString("10"))
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