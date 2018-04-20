const Binding = require('./packet_bindings');
const Buffer = require('buffer').Buffer;

export function bindingTypeToString(bindingType, bindingValue) {
  let valueName = null;
  if (bindingType === null || bindingType === undefined || bindingValue === null || bindingValue === undefined) {
    return valueName;
  }
  const names = Object.keys(Binding[bindingType]).filter(key => {
    if (Binding[bindingType][key] === bindingValue) {
      return true;
    }
  });
  if (names.length === 1) {
    valueName = names[0];
  }

  return valueName;
}

export class Packet {
  private instance: any;
  private _bytes: any;

  // lifecycle
  public initialize(bytes?: any) {
    this.destroy();
    this.instance = new Binding.Packet();
    this.instance.newPacket();

    this._bytes = bytes;

    if (bytes) {
      this.instance.processPacket(bytes);
    }
  }

  public destroy() {
    if (this.instance) {
      this.instance.delete();
    }
  }

  public toBuffer() {
    let output = null;
    if (this.instance) {
      output = bufferToHex(this.writableBuffer());
    }

    return output;
  }

  public toString() {
    return toString(this.toBuffer());
  }

  public toUint8Array() {
    return toUint8Array(this.writableBuffer());
  }

  // BINDING WRAPPING

  public makePacket(_type, subType, key, data) {
    if (this.instance === undefined || this.instance === null) {
      this.initialize();
    }
    this.instance.Type = Binding.PacketType[_type];
    this.instance[_type] = Binding[`Packet${_type}Type`][subType];
    if (key && data) {
      this.instance[key] = data;
    }
  }

  public send(characteristic, _type, subType, key, data, length) {
    if (characteristic) {
      if (_type && subType) {
        this.makePacket(_type, subType, key, data);
      }
      if (length) {
        this.instance.length = length;
      }
      const output = this.writableBuffer();
      if (output) {
        //console.log(output);
        characteristic.write(output, false); // withoutResponse = false
        //console.log("Sent: " + this.Type() + "::" + this.SubType());
      }
    }
  }

  public writableBuffer() {
    let output = null;

    if (this.instance) {
      let vectorOut = new Binding.VectorInt();
      vectorOut = this.instance.format();
      const len = vectorOut.size();
      output = Buffer.alloc(len);
      for (let i = 0; i < vectorOut.size(); i++) {
        output[i] = vectorOut.get(i);
      }
      vectorOut.delete();
    }

    return output;
  }

  // ACCESSING FUNCTIONS

  public Type(newType?: any) {
    if (this.instance !== null && this.instance !== undefined) {
      if (newType) {
        this.instance.Type = Binding.PacketType[newType];
      } else {
        return bindingTypeToString('PacketType', this.instance.Type);
      }
    } else {
      return null;
    }
  }

  public SubType(newSubType?: any) {
    if (this.instance !== null && this.instance !== undefined) {
      const _type = this.Type();
      const bindingKey = `Packet${_type}Type`;
      if (_type && bindingKey && newSubType) {
        this.instance[_type] = Binding[bindingKey][newSubType];
      } else if (bindingKey && _type) {
        return bindingTypeToString(bindingKey, this.instance[_type]);
      }
    } else {
      return null;
    }
  }

  public data(key: string, value?: any) {
    if (this.instance) {
      if (value) {
        this.instance[key] = value;
      } else {
        return this.instance[key];
      }
    }

    return null;
  }

  public getPayload() {}

  public parse() {}

  public parseData(data) {}

  public parseCommand(command) {}

  public parseError(error) {}

  public parseOTA(ota) {}
}

// Utility functions:

function decimalToHex(d) {
  const hex = Number(d).toString(16);
  const hexStr = '00'.substring(0, 2 - hex.length) + hex;

  return hexStr.toUpperCase();
}

function toString(data) {
  let dataStr = '';
  data.map(d => {
    dataStr += ` ${decimalToHex(d)}`;
  });
  const str = `${dataStr.trim()}`;

  return str;
}

function toUint8Array(data) {
  return Uint8Array.from(data);
}

function makePacketData(_type, subtype, key, data) {
  const p = new Packet();
  p.makePacket(_type, subtype, key, data);
  const dataBuffer = p.writableBuffer();
  p.destroy();

  return bufferToHex(dataBuffer);
}

function bufferToHex(dataArray) {
  const str = dataArray.map(d => {
    return `0x${d.toString(16).toUpperCase()}`;
  });

  return str;
}
