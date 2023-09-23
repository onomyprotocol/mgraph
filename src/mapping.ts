import { cosmos } from "@graphprotocol/graph-ts";
import { Execution } from "../generated/schema";

export function handleExecution(data: cosmos.EventData): void {
  if (data.event.eventType == "execute-order") {
    const exec = new Execution(`${data.event.eventType}-${data.event.getAttributeValue("uid")}`);
    exec.time = data.event.getAttributeValue("time");
    exec.type = data.event.getAttributeValue("order_type");
    exec.denomAsk = data.event.getAttributeValue("denom_ask");
    exec.denomBid = data.event.getAttributeValue("denom_bid");
    exec.amountAsk = data.event.getAttributeValue("amount_ask");
    exec.amountBid = data.event.getAttributeValue("amount_bid");
    exec.save();
  }
}