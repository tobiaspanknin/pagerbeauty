// ------- ContactMethod --------------------------------------------------------------

export class ContactMethod {
  constructor({
    type,
    summary,
    address,
    label,
  }) {
    this.type = type;
    this.summary = summary;
    this.address = address;
    this.label = label;
  }

  serialize() {
    return {
      type: this.type,
      summary: this.summary,
      address: this.address,
      label: this.label,
    };
  }

  toString() {
    return JSON.stringify(this.serialize());
  }

  static fromApiRecord(record) {
    const attributes = {
      type: record.type,
      summary: record.summary,
      address: record.address,
      label: record.label,
    };
    if (record.type.match(/^(phone|sms)/)) {
      attributes.address = `+${record.country_code}${record.address}`;
    }
    return new ContactMethod(attributes);
  }
  // ------- Class end  --------------------------------------------------------
}

// ------- End -----------------------------------------------------------------
