import { cosmos } from "@graphprotocol/graph-ts";
import { Order, HistoricalFrame } from "../generated/schema";
import {BigInt, BigDecimal} from "@graphprotocol/graph-ts";
import {Frame, FrameType} from "./Frame";

export function handleOrder(data: cosmos.EventData): void {
	let order = Order.load(`${data.event.eventType}-${data.event.getAttributeValue("uid")}`)
	
	if (order == null) {
		order = new Order(`${data.event.eventType}-${data.event.getAttributeValue("uid")}`);
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
	}
}



// updateExecutionHistoricalFrame aggregates trade execution prices into frames
export function updateHistoricalFrame(order: Order, data: cosmos.EventData): void {
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