// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Execution extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Execution entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Execution must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Execution", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Execution | null {
    return changetype<Execution | null>(store.get_in_block("Execution", id));
  }

  static load(id: string): Execution | null {
    return changetype<Execution | null>(store.get("Execution", id));
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

  get time(): string | null {
    let value = this.get("time");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set time(value: string | null) {
    if (!value) {
      this.unset("time");
    } else {
      this.set("time", Value.fromString(<string>value));
    }
  }

  get type(): string | null {
    let value = this.get("type");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set type(value: string | null) {
    if (!value) {
      this.unset("type");
    } else {
      this.set("type", Value.fromString(<string>value));
    }
  }

  get denomAsk(): string | null {
    let value = this.get("denomAsk");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set denomAsk(value: string | null) {
    if (!value) {
      this.unset("denomAsk");
    } else {
      this.set("denomAsk", Value.fromString(<string>value));
    }
  }

  get denomBid(): string | null {
    let value = this.get("denomBid");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set denomBid(value: string | null) {
    if (!value) {
      this.unset("denomBid");
    } else {
      this.set("denomBid", Value.fromString(<string>value));
    }
  }

  get amountAsk(): string | null {
    let value = this.get("amountAsk");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set amountAsk(value: string | null) {
    if (!value) {
      this.unset("amountAsk");
    } else {
      this.set("amountAsk", Value.fromString(<string>value));
    }
  }

  get amountBid(): string | null {
    let value = this.get("amountBid");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set amountBid(value: string | null) {
    if (!value) {
      this.unset("amountBid");
    } else {
      this.set("amountBid", Value.fromString(<string>value));
    }
  }
}
