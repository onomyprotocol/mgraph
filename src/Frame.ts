// FrameType namespace provides constants and method for enum FrameType.
// This the hint to let assemblyscript compile the enum operations.
import {join} from "./utils";
import {BigInt, BigDecimal} from "@graphprotocol/graph-ts";

const min = 60
const hour = 60 * 60
const day = 60 * 60 * 24

export namespace FrameType {
    export const Minute = "Minute",
        FiveMinute = "FiveMinute",
        QuarterHour = "QuarterHour",
        Hour = "Hour",
        QuarterDay = "QuarterDay",
        Day = "Day",
        Week = "Week"

    export function all(): string[] {
        return [
            Minute,
            FiveMinute,
            QuarterHour,
            Hour,
            QuarterDay,
            Day,
            Week
        ]
    }
}

export type FrameType = string

// Frame holds the logic of time framing for supported types.
export class Frame {
    base: string;
    quote: string;
    type: FrameType;
    startTime: BigInt
    endTime: BigInt

    // create frame based on timestamp and FrameType scale.
    constructor(base: string, quote: string, timestamp: BigInt, type: FrameType) {
        let scale = 0

        if (type == FrameType.Minute) {
            scale = min
        }
        if (type == FrameType.FiveMinute) {
            scale = min * 5
        }
        if (type == FrameType.QuarterHour) {
            scale = min * 15
        }
        if (type == FrameType.Hour) {
            scale = hour
        }
        if (type == FrameType.QuarterDay) {
            scale = hour * 6
        }
        if (type == FrameType.Day) {
            scale = day
        }

				let shift = BigInt.zero()
				
        if (type == FrameType.Week) {
            scale = day
            let dayOfWeek = getUTCDay(timestamp)
            // handler UTC sunday
            if (dayOfWeek.equals(BigInt.zero())) {
                dayOfWeek = BigInt.fromI64(7)
            }
            shift = (BigInt.fromI64(1).minus(dayOfWeek)).times(BigInt.fromI64(day))
        }

        if (scale == 0) {
            throw new Error(`Unexpected HistoricalFrameType ${type}`);
        }

				this.base = base
				this.quote = quote
        this.type = type
				let bigScale = BigInt.fromI64(scale)
        this.startTime = ((timestamp.div(bigScale)).times(bigScale)).plus(shift)
        this.endTime = this.startTime.plus(bigScale).minus(BigInt.fromI64(1))
    }

    getID(): string {
        return join([this.base, "-", this.quote, "-", this.type, "-", this.startTime.toString()])
    }
}

function getUTCDay(timestamp: BigInt): BigInt {
    let dayFromThursday = (timestamp.div(BigInt.fromI64(day))).mod(BigInt.fromI64(7))
    if (dayFromThursday.lt(BigInt.fromI64(3))) {
        return dayFromThursday.plus(BigInt.fromI64(4))
    }
    return dayFromThursday.minus(BigInt.fromI64(3))
}
