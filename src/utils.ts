import { BigDecimal } from "@graphprotocol/graph-ts";

export function join(args: Array<string>): string {
	return args.join('-');
}

export function sigFigs(n: number, sig: number) {
	var mult = Math.pow(10, sig - Math.floor(Math.log(n) / Math.LN10) - 1);
	return Math.round(n * mult) / mult;
}

export function placeCeiling(rate: BigDecimal) {
  var ceiling = BigDecimal.fromString(".000000001")

	while (ceiling.lt(rate)) {
		ceiling.times(BigDecimal.fromString("10"))
	}

  return ceiling
}

function removeId(arr: string[], value: string) {
	var index = arr.indexOf(value);
	if (index > -1) {
		arr.splice(index, 1);
	}
	return arr;
}