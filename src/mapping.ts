import { cosmos } from "@graphprotocol/graph-ts";
import { Order, HistoricalFrame, OrderBook, BookIncrement } from "../generated/schema";
import {BigInt, BigDecimal, store} from "@graphprotocol/graph-ts";
import {Frame, FrameType} from "./Frame";
import { Book, BookType, Increment } from "./Book"
import {sigFigs} from "./utils";

export function handleOrder(data: cosmos.EventData): void {
	let order = Order.load(`${data.event.eventType}-${data.event.getAttributeValue("uid")}`)
	
	if (order == null) {
		order = new Order(`${data.event.eventType}-${data.event.getAttributeValue("uid")}`);
		addLiquidity(order, data)
	}

	order.owner = data.event.getAttributeValue("owner")
	order.status = data.event.getAttributeValue("status")
	order.orderType = data.event.getAttributeValue("order_type");	
	order.denomAsk = data.event.getAttributeValue("denom_ask");
	order.denomBid = data.event.getAttributeValue("denom_bid");
	order.amount = BigInt.fromString(data.event.getAttributeValue("amount"));
	let rateString = data.event.getAttributeValue("rate");
	let rateNumerator = new BigDecimal(BigInt.fromString(rateString.split(",")[0]))
	let rateDenominator = new BigDecimal(BigInt.fromString(rateString.split(",")[1]))
	order.rate = rateNumerator.div(rateDenominator)
	order.begTime = BigInt.fromString(data.event.getAttributeValue("begin-time"));
	order.updTime = BigInt.fromString(data.event.getAttributeValue("update-time"));
	order.save();
	
	if (data.event.getAttributeValue("status") == "filled") {
		updateHistoricalFrame(order, data)
		removeLiquidity(order, data)
	}

	if (data.event.getAttributeValue("status") == "filled") {
		removeLiquidity(order, data)
	}
}

// Add liquidity to books
function addLiquidity(order: Order, data: cosmos.EventData): void {
	// We can start this as low as needed
	var placeCeiling = BigDecimal.fromString(".000000001")

	// We do this to find the place of this order
	while (placeCeiling.lt(order.rate)) {
		placeCeiling.times(BigDecimal.fromString("10"))
	}

	let place = placeCeiling.div(BigDecimal.fromString("10"))

	// We do this to find the place of the max order in the books
	book = new Book(order.denomBid, order.denomAsk, place.toString())
	id = book.getID();
	let bookEntity = OrderBook.load(id)
	if (bookEntity != null) {
		placeCeiling = BigDecimal.fromString(".000000001")
		while (placeCeiling.lt(BigDecimal.fromString(bookEntity.max))) {
			placeCeiling.times(BigDecimal.fromString("10"))
		}
	}

	place = placeCeiling.div(BigDecimal.fromString("10"))

	var sigPrice: number
	var book: Book
	var id: string
	// Six bins
	for (let i = 0; i < 6; i++) {
		sigPrice = sigFigs(parseFloat(order.rate.toString()), i+1)

		book = new Book(order.denomBid, order.denomAsk, place.toString())
		id = book.getID();
		bookEntity = OrderBook.load(id)
		if (bookEntity== null) {
			bookEntity = new OrderBook(id)
			bookEntity.base = order.denomBid
			bookEntity.quote = order.denomAsk
			bookEntity.type = place.toString()
			bookEntity.max = sigPrice.toString()
			bookEntity.min = sigPrice.toString()
		} else {
			if (bookEntity.max
		}
		
		if (sigPrice > parseFloat(bookEntity.max)) {
			bookEntity.max = sigPrice.toString()
		}

		if (sigPrice < parseFloat(bookEntity.min)) {
			bookEntity.min = sigPrice.toString()
		}
		
		let increment = new Increment(order.denomBid, order.denomAsk, "sell", sigPrice)
		let incrementEntity = BookIncrement.load(increment.getID())
		
		if (incrementEntity == null) {
			incrementEntity = new BookIncrement(id)
			incrementEntity.bin = sigPrice.toString()
			incrementEntity.amount = BigInt.zero()
			bookEntity.book.push(incrementEntity.id)
		}

		incrementEntity.amount = incrementEntity.amount.plus(order.amount)
		place = place.div(BigDecimal.fromString("10"))
	}

	// Check adjacent bin below and delete if exist
	book = new Book(order.denomBid, order.denomAsk, place.toString())
	id = book.getID();
	bookEntity = OrderBook.load(id)
	
	if (bookEntity != null) {
		bookEntity.book.forEach((inc) => store.remove("BookIncrement", inc))
		store.remove("OrderBook", bookEntity.id)
	}

	// Check adjacent bin above and delete if exist
	book = new Book(order.denomBid, order.denomAsk, placeCeiling.toString())
	id = book.getID();
	bookEntity = OrderBook.load(id)
	
	if (bookEntity != null) {
		bookEntity.book.forEach((inc) => store.remove("BookIncrement", inc))
		store.remove("OrderBook", bookEntity.id)
	}
}

// Remove liquidity from books 
function removeLiquidity(order: Order, data: cosmos.EventData): void {
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

			let rateString = data.event.getAttributeValue("rate");
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