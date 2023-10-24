import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function join(args: Array<string>): string {
	return args.join('-');
}

export function sigFigs(n: number, sig: number): number {
	var mult = Math.pow(10, sig - Math.floor(Math.log(n) / Math.LN10) - 1);
	return Math.round(n * mult) / mult;
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

export function offset(rate1: BigDecimal, rate2: BigDecimal): number {
	let sigLength1 = rate1.digits.toString().length
	let exponent1 = parseInt(rate1.exp.toString())
	let place1 = sigLength1+exponent1

	let sigLength2 = rate2.digits.toString().length
	let exponent2 = parseInt(rate2.exp.toString())
	let place2 = sigLength2+exponent2

	return (place2-place1)
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