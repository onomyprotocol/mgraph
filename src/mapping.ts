import { cosmos } from "@graphprotocol/graph-ts";
import { Order, HistoricalFrame, BookBin, BookIncrement, OrderBook } from "../generated/schema";
import {BigInt, BigDecimal, store} from "@graphprotocol/graph-ts";
import {Frame, FrameType} from "./Frame";
import {sigFigs, join, placeCeiling, removeId} from "./utils";

export function handleTx(data: cosmos.TransactionData): void {
	data.tx.result.events.forEach(event => {
		if (event.eventType == "order") {
			let order = Order.load(`${event.eventType}-${event.getAttributeValue("uid")}`)
	
			// If order == null, then the indexer hasn't seen this order
			// If it is a limit / stop order then we add liquidity to the indexed books
			// If it is a market order, we adjust the book price and bins if needed
			if (order == null) {
				order = new Order(`${event.eventType}-${event.getAttributeValue("uid")}`);

				if (order.orderType == "limit") {
					addLiquidity(order)
				}
				
				if (order.orderType == "market") {
					updateBook(order, "sell")
					updateBook(order, "buy")
				}
			}

			order.owner = event.getAttributeValue("owner")
			order.status = event.getAttributeValue("status")
			order.orderType = event.getAttributeValue("order_type");	
			order.denomAsk = event.getAttributeValue("denom_ask");
			order.denomBid = event.getAttributeValue("denom_bid");
			order.amount = BigInt.fromString(event.getAttributeValue("amount"));
			let rateString = event.getAttributeValue("rate");
			let rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
			let rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
			order.rate = rateNumerator.div(rateDenominator)
			order.begTime = BigInt.fromString(event.getAttributeValue("begin-time"));
			order.updTime = BigInt.fromString(event.getAttributeValue("update-time"));
			order.save();

			if (event.getAttributeValue("status") == "filled") {
				updateHistoricalFrame(order, data)
				
				if (event.getAttributeValue("limit")) {
					removeLiquidity(order)
				}
			}

			if (event.getAttributeValue("status") == "cancelled") {
				if (event.getAttributeValue("limit")) {
					removeLiquidity(order)
				}
			}
		}
	})
}

function updateBook(order: Order, direction: string) {
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
		book.total = BigInt.zero()

		if (direction == "sell") {
			book.rate = order.rate
			book.ceiling = placeCeiling(order.rate)
		} else {
			book.rate = BigDecimal.fromString("1").div(order.rate)
			orderCeiling = placeCeiling(BigDecimal.fromString("1").div(order.rate))
		}
	}

	var orderCeiling: BigDecimal

	if (direction == "sell") {
		orderCeiling = placeCeiling(order.rate)
		book.rate = order.rate
	} else {
		orderCeiling = placeCeiling(BigDecimal.fromString("1").div(order.rate))
		book.rate = BigDecimal.fromString("1").div(order.rate)
	}

	if (book.ceiling == orderCeiling) return

	
	// Book offset is the number of orders of magnitude to move
	// the order books based on the current market order price
	let bookOffset = 0

	if (orderCeiling.gt(book.ceiling)) {
		while (book.ceiling.lt(orderCeiling)) {
			bookOffset++
			book.ceiling = book.ceiling.times(BigDecimal.fromString("10"))
		}
	}

	if (orderCeiling.lt(book.ceiling)) {
		while (book.ceiling.gt(orderCeiling)) {
			bookOffset--
			book.ceiling = book.ceiling.div(BigDecimal.fromString("10"))
		}
	}

	var binId: string
	var bin: BookBin | null
	let orderPlace = orderCeiling.div(BigDecimal.fromString("10"))
	let bookPlace = book.ceiling.div(BigDecimal.fromString("10"))
	
	
	
	// Collect all orders if BookOffset is not zero
	var orders: string[]
	orders = []
	
	var increment: BookIncrement | null
	
	if (bookOffset != 0) {
		binId =  join([base, quote, direction, bookPlace.toString()])
		bin = BookBin.load(binId)
		if (bin != null) {
			bin.book.forEach(incrementId => {
				increment = BookIncrement.load(incrementId)
				if (increment != null) {
					increment.orders.forEach(orderId => {
						orders.push(orderId)
					})
				}
			});
		}
	}

	// If bookOffset less than zero, then add bins below
	if (bookOffset < 0) {
		orderPlace = orderPlace.div(BigDecimal.fromString("10000"))
		bookPlace = bookPlace.div(BigDecimal.fromString("10000"))
	}

	var sigPrice: number
	var incrementId: string
	var stalePlace: string

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
			bookPlace = bookPlace.div(BigDecimal.fromString("10"))
		}
		
		// Remove stale place from order-book bin array
		book.bins = book.bins.filter(function(bin) {
			return bin != stalePlace;
		});

		// Get Bin that will be removed
		binId =  join([base, quote, direction, stalePlace])
		bin = BookBin.load(binId)
		
		// Remove increments from storage
		if (bin != null) {
			bin.book.forEach(incrementId => {
				store.remove("BookIncrement", incrementId)
			});
		}

		// Remove BookBin
		store.remove("BookBin", binId)

		// First create bin based on decimal place of the order
		binId =  join([base, quote, direction, bookPlace.toString()])
		bin = new BookBin(binId)

		// Add new bin to Order Book entity
		book.bins.push(binId)

		var orderExisting: Order | null
		var orderExistingPlace: BigDecimal
		var orderOffset: number

		orders.forEach(orderId => {
			orderExisting = Order.load(orderId)
			if (orderExisting != null) {
				
				orderExistingPlace = placeCeiling(orderExisting.rate).div(BigDecimal.fromString("10")) 

				if (orderExistingPlace.gt(bookPlace)) {
					while (orderExistingPlace.gt(bookPlace)) {
						orderOffset++
						orderExistingPlace.div(BigDecimal.fromString("10"))
					}
				}
			
				if (orderExistingPlace.lt(bookPlace)) {
					while (orderExistingPlace.gt(bookPlace)) {
						orderOffset--
						orderExistingPlace.times(BigDecimal.fromString("10"))
					}
				}
				
				if (bookPlace.gt(orderExistingPlace)) {
					sigPrice = parseFloat(bookPlace.toString())
				} else {
					sigPrice = sigFigs(parseFloat(order.rate.toString()), 1+orderOffset)
				}
				
				incrementId = join([base, quote, direction, place.toString(), sigPrice.toString()])
				increment = BookIncrement.load(incrementId)
				
				if (increment == null) {
					increment = new BookIncrement(incrementId)
					increment.amount = BigInt.zero()
				}
		
				increment.amount = increment.amount.plus(order.amount)
				increment.orders.push(order.id)
				if (bin != null) {
					bin.book.push(increment.id)
				}
			}
		})
	}
}

// Add liquidity to books
function addLiquidity(order: Order): void {
	addOrder(order, "sell")
	addOrder(order, "buy")
}



function addOrder(order: Order, direction: string) {
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
		if (direction == "sell") {
			book.rate = order.rate
		} else {
			book.rate = BigDecimal.fromString("1").div(order.rate)
		}
		
		book.ceiling = placeCeiling(book.rate)
	}

	book.total = book.total.plus(order.amount)

	book.save()

	var binId: string
	var bin: BookBin | null
	let offset = 0
	var orderCeiling: BigDecimal
	if (direction == "sell") {
		orderCeiling = placeCeiling(order.rate)
	} else {
		orderCeiling = placeCeiling(BigDecimal.fromString("1").div(order.rate))
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
			incrementEntity.amount = BigInt.zero()
		}

		incrementEntity.amount = incrementEntity.amount.plus(order.amount)
		
		incrementEntity.orders.push(order.id)
		incrementEntity.save()
		
		bin.book.push(incrementEntity.id)
		bin.save()
		
		place = place.div(BigDecimal.fromString("10"))
	}
}

// Remove liquidity from books 
function removeLiquidity(order: Order): void {
	subOrder(order, "sell")
	subOrder(order, "buy")
}

function subOrder(order: Order, direction: string) {
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

		book.save()

		var binId: string
		var bin: BookBin | null
		let offset = 0
		var orderCeiling: BigDecimal
		if (direction == "sell") {
			orderCeiling = placeCeiling(order.rate)
		} else {
			orderCeiling = placeCeiling(BigDecimal.fromString("1").div(order.rate))
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

			// Bin shouldn't be null but if it is
			if (bin != null) {
				if (place.gt(order.rate)) {
					sigPrice = parseFloat(place.toString())
				} else {
					sigPrice = sigFigs(parseFloat(order.rate.toString()), i+offset)
				}
				
				incrementId = join([base, quote, direction, place.toString(), sigPrice.toString()])
				incrementEntity = BookIncrement.load(incrementId)
				
				// Increment shouldn't be null but if it is skip
				if (incrementEntity != null) {
					incrementEntity.amount = incrementEntity.amount.minus(order.amount)
					incrementEntity.orders = removeId(incrementEntity.orders, order.id)
					incrementEntity.save()
					place = place.div(BigDecimal.fromString("10"))
				}
			}
		}
	}
}



// updateExecutionHistoricalFrame aggregates trade execution prices into frames
function updateHistoricalFrame(order: Order, data: cosmos.EventData): void {
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