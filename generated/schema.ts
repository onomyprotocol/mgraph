// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";

export class Order extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Order entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Order must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Order", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Order | null {
    return changetype<Order | null>(store.get_in_block("Order", id));
  }

  static load(id: string): Order | null {
    return changetype<Order | null>(store.get("Order", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get owner(): string {
    let value = this.get("owner");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }

  get status(): string {
    let value = this.get("status");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set status(value: string) {
    this.set("status", Value.fromString(value));
  }

  get orderType(): string {
    let value = this.get("orderType");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set orderType(value: string) {
    this.set("orderType", Value.fromString(value));
  }

  get denomAsk(): string {
    let value = this.get("denomAsk");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set denomAsk(value: string) {
    this.set("denomAsk", Value.fromString(value));
  }

  get denomBid(): string {
    let value = this.get("denomBid");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set denomBid(value: string) {
    this.set("denomBid", Value.fromString(value));
  }

  get amount(): BigInt {
    let value = this.get("amount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }

  get inverseAmount(): BigInt {
    let value = this.get("inverseAmount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set inverseAmount(value: BigInt) {
    this.set("inverseAmount", Value.fromBigInt(value));
  }

  get rate(): BigDecimal {
    let value = this.get("rate");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set rate(value: BigDecimal) {
    this.set("rate", Value.fromBigDecimal(value));
  }

  get inverseRate(): BigDecimal {
    let value = this.get("inverseRate");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set inverseRate(value: BigDecimal) {
    this.set("inverseRate", Value.fromBigDecimal(value));
  }

  get begTime(): BigInt {
    let value = this.get("begTime");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set begTime(value: BigInt) {
    this.set("begTime", Value.fromBigInt(value));
  }

  get updTime(): BigInt {
    let value = this.get("updTime");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set updTime(value: BigInt) {
    this.set("updTime", Value.fromBigInt(value));
  }
}

export class HistoricalFrame extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save HistoricalFrame entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type HistoricalFrame must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("HistoricalFrame", id.toString(), this);
    }
  }

  static loadInBlock(id: string): HistoricalFrame | null {
    return changetype<HistoricalFrame | null>(
      store.get_in_block("HistoricalFrame", id),
    );
  }

  static load(id: string): HistoricalFrame | null {
    return changetype<HistoricalFrame | null>(store.get("HistoricalFrame", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get type(): string {
    let value = this.get("type");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set type(value: string) {
    this.set("type", Value.fromString(value));
  }

  get base(): string {
    let value = this.get("base");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set base(value: string) {
    this.set("base", Value.fromString(value));
  }

  get quote(): string {
    let value = this.get("quote");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set quote(value: string) {
    this.set("quote", Value.fromString(value));
  }

  get updateTime(): BigInt {
    let value = this.get("updateTime");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set updateTime(value: BigInt) {
    this.set("updateTime", Value.fromBigInt(value));
  }

  get startTime(): BigInt {
    let value = this.get("startTime");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set startTime(value: BigInt) {
    this.set("startTime", Value.fromBigInt(value));
  }

  get startPrice(): BigDecimal {
    let value = this.get("startPrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set startPrice(value: BigDecimal) {
    this.set("startPrice", Value.fromBigDecimal(value));
  }

  get endTime(): BigInt {
    let value = this.get("endTime");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set endTime(value: BigInt) {
    this.set("endTime", Value.fromBigInt(value));
  }

  get endPrice(): BigDecimal {
    let value = this.get("endPrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set endPrice(value: BigDecimal) {
    this.set("endPrice", Value.fromBigDecimal(value));
  }

  get minPrice(): BigDecimal {
    let value = this.get("minPrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set minPrice(value: BigDecimal) {
    this.set("minPrice", Value.fromBigDecimal(value));
  }

  get maxPrice(): BigDecimal {
    let value = this.get("maxPrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set maxPrice(value: BigDecimal) {
    this.set("maxPrice", Value.fromBigDecimal(value));
  }

  get volume(): BigInt {
    let value = this.get("volume");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set volume(value: BigInt) {
    this.set("volume", Value.fromBigInt(value));
  }

  get transactionsCount(): BigInt {
    let value = this.get("transactionsCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set transactionsCount(value: BigInt) {
    this.set("transactionsCount", Value.fromBigInt(value));
  }
}

export class BookIncrement extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save BookIncrement entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type BookIncrement must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("BookIncrement", id.toString(), this);
    }
  }

  static loadInBlock(id: string): BookIncrement | null {
    return changetype<BookIncrement | null>(
      store.get_in_block("BookIncrement", id),
    );
  }

  static load(id: string): BookIncrement | null {
    return changetype<BookIncrement | null>(store.get("BookIncrement", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get book(): string {
    let value = this.get("book");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set book(value: string) {
    this.set("book", Value.fromString(value));
  }

  get bin(): string {
    let value = this.get("bin");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set bin(value: string) {
    this.set("bin", Value.fromString(value));
  }

  get place(): BigDecimal {
    let value = this.get("place");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set place(value: BigDecimal) {
    this.set("place", Value.fromBigDecimal(value));
  }

  get amount(): BigInt {
    let value = this.get("amount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }

  get orders(): Array<string> {
    let value = this.get("orders");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toStringArray();
    }
  }

  set orders(value: Array<string>) {
    this.set("orders", Value.fromStringArray(value));
  }
}

export class BookBin extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save BookBin entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type BookBin must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("BookBin", id.toString(), this);
    }
  }

  static loadInBlock(id: string): BookBin | null {
    return changetype<BookBin | null>(store.get_in_block("BookBin", id));
  }

  static load(id: string): BookBin | null {
    return changetype<BookBin | null>(store.get("BookBin", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get increments(): Array<string> {
    let value = this.get("increments");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toStringArray();
    }
  }

  set increments(value: Array<string>) {
    this.set("increments", Value.fromStringArray(value));
  }
}

export class OrderBook extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save OrderBook entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type OrderBook must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("OrderBook", id.toString(), this);
    }
  }

  static loadInBlock(id: string): OrderBook | null {
    return changetype<OrderBook | null>(store.get_in_block("OrderBook", id));
  }

  static load(id: string): OrderBook | null {
    return changetype<OrderBook | null>(store.get("OrderBook", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get base(): string {
    let value = this.get("base");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set base(value: string) {
    this.set("base", Value.fromString(value));
  }

  get quote(): string {
    let value = this.get("quote");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set quote(value: string) {
    this.set("quote", Value.fromString(value));
  }

  get direction(): string {
    let value = this.get("direction");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set direction(value: string) {
    this.set("direction", Value.fromString(value));
  }

  get rate(): BigDecimal {
    let value = this.get("rate");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set rate(value: BigDecimal) {
    this.set("rate", Value.fromBigDecimal(value));
  }

  get total(): BigInt {
    let value = this.get("total");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set total(value: BigInt) {
    this.set("total", Value.fromBigInt(value));
  }

  get ceiling(): BigDecimal {
    let value = this.get("ceiling");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set ceiling(value: BigDecimal) {
    this.set("ceiling", Value.fromBigDecimal(value));
  }

  get orders(): Array<string> {
    let value = this.get("orders");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toStringArray();
    }
  }

  set orders(value: Array<string>) {
    this.set("orders", Value.fromStringArray(value));
  }

  get bins(): Array<string> {
    let value = this.get("bins");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toStringArray();
    }
  }

  set bins(value: Array<string>) {
    this.set("bins", Value.fromStringArray(value));
  }
}
