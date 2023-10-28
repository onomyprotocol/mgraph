import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Protobuf } from "as-proto";

export function join(args: Array<string>): string {
	return args.join('-');
}

export function split(args: string): Array<string> {
	return args.split('-');
}

export function truncate(rate: BigDecimal, place: BigDecimal): BigDecimal {
	let rateOffset = offset(place, rate)
	
	let digitsString = rate.digits.toString()
	let digitsLength = digitsString.length
	let digitsSlice = digitsString.slice(0, 1+rateOffset)
	
	let difference = digitsLength - digitsSlice.length
	let sliceExp = rate.exp.toI32() + difference
	
	let rounds = abs(sliceExp)
  	let sliceDec = BigDecimal.fromString(digitsSlice)

	for (let i = 0; i < rounds; i++) {
		if (sliceExp > 0) {
			sliceDec = sliceDec.times(BigDecimal.fromString("10"))
		} else {
			sliceDec = sliceDec.div(BigDecimal.fromString("10"))
		}
	}
	
	return sliceDec
}

export function ceiling(rate: BigDecimal): BigDecimal {
	let sigLength = rate.digits.toString().length
	let exponent = parseInt(rate.exp.toString())
	
	let power = sigLength+exponent
	
	let ceiling = BigDecimal.fromString("1")
	if (power == 0) return ceiling
	
	let rounds = abs(power)

	for (let i = 0; i < rounds; i++) {
		if (power < 0) {
			ceiling = ceiling.div(BigDecimal.fromString("10"))
		}
		if (power > 0) {
			ceiling = ceiling.times(BigDecimal.fromString("10"))
		}
	}
	
	return ceiling
}

export function offset(rate1: BigDecimal, rate2: BigDecimal): i32 {
	let sigLength1 = BigInt.fromString(rate1.digits.toString().length.toString())
	let exponent1 = rate1.exp
	let place1 = sigLength1.plus(exponent1)

	let sigLength2 = BigInt.fromString(rate2.digits.toString().length.toString())
	let exponent2 = rate2.exp
	let place2 = sigLength2.plus(exponent2)

	return (place2.minus(place1)).toI32()
}

export function removeId(ids: string[], id: string): string[] {
	var filteredIds: string[]
	filteredIds = [];
	for (let i= 0; i<ids.length; i++) {
			if (ids[i] != id) {
				filteredIds.push(ids[i]);
			}
	}
	return filteredIds
}