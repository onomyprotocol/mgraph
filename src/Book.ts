// FrameType namespace provides constants and method for enum FrameType.
// This the hint to let assemblyscript compile the enum operations.
import {join} from "./utils";

export type BookType = string

// Frame holds the logic of book framing for supported types.
export class Book {
    base: string;
    quote: string;
    direction: string;
    type: string;

    // create frame based on timestamp and FrameType scale.
    constructor(base: string, quote: string, type: BookType) {
        this.base = base
        this.quote = quote
        this.type = type
    }

    getID(): string {
        return join([this.base, "-", this.quote, "-", this.direction, "-", this.type])
    }
}

// Frame holds the logic of book framing for supported types.
export class Increment {
	base: string;
	quote: string;
	direction: string;
	type: string;
	price: number;

	// create frame based on timestamp and FrameType scale.
	constructor(base: string, quote: string, direction: string, price: number) {
			this.base = base
			this.quote = quote
			this.direction = direction
			this.price = price
	}

	getID(): string {
			return join([this.base, "-", this.quote, "-", this.direction, "-", this.type, "-", this.price.toString()])
	}
}
