export function join(args: Array<string>): string {
    return args.join('-');
}

export function sigFigs(n: number, sig: number) {
    var mult = Math.pow(10, sig - Math.floor(Math.log(n) / Math.LN10) - 1);
    return Math.round(n * mult) / mult;
}