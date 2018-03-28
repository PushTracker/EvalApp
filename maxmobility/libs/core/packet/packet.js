const Binding = require("./packet_bindings");
const Buffer = require("buffer").Buffer;

function bindingTypeToString(bindingType, bindingValue) {
    let valueName = null;
    if (bindingType === null || bindingType === undefined ||
        bindingValue === null || bindingValue === undefined) {
        return valueName;
    }
    const names = Object.keys(Binding[bindingType]).filter((key) => {
        if (Binding[bindingType][key] === bindingValue) {
            return true;
        }
    });
    if (names.length === 1) {
        valueName = names[0];
    }

    return valueName;
}

function decimalToHex(d) {
    const hex = Number(d).toString(16);
    const hexStr = "00".substring(0, 2 - hex.length) + hex;

    return hexStr.toUpperCase();
}

function toString(data) {
    let dataStr = "";
    data.map((d) => {
        dataStr += ` ${decimalToHex(d)}`;
    });
    const str = `${dataStr.trim()}`;

    return str;
}

function toUint8Array(data) {
    return Uint8Array.from(data);
}

function makePacketData(type, subtype, key, data) {
  const p = new Packet();
  p.makePacket(type, subtype, key, data);
  const dataBuffer = p.writableBuffer();
  p.destroy();

  return bufferToHex(dataBuffer);
}

function bufferToHex(dataArray) {
  const str = dataArray.map((d) => {
    return `0x${d.toString(16).toUpperCase()}`;
  });

  return str;
}

function Packet(bytes) {
    this.initialize(bytes);
}

// LIFECYCLE

Packet.prototype.initialize = function(bytes) {
    this.destroy();
    this.instance = new Binding.Packet();
    this.instance.newPacket();

    this._bytes = bytes;

    if (bytes) {
        this.instance.processPacket(bytes);
    }
};

Packet.prototype.destroy = function() {
    if (this.instance) {
        this.instance.delete();
    }
};

Packet.prototype.toBuffer = function() {
    let output = null;
    if (this.instance) {
        output = bufferToHex(this.writableBuffer());
    }

    return output;
};

Packet.prototype.toString = function() {
    return toString(this.toBuffer());
};

Packet.prototype.toUint8Array = function() {
    return toUint8Array(this.writableBuffer());
};

// BINDING WRAPPING

Packet.prototype.makePacket = function(type, subType, key, data) {
    if (this.instance === undefined || this.instance === null) {
        this.initialize();
    }
    this.instance.Type = Binding.PacketType[type];
    this.instance[type] = Binding[`Packet${type}Type`][subType];
    if (key && data) {
        this.instance[key] = data;
    }
};

Packet.prototype.send = function(characteristic, type, subType, key, data, length) {
    if (characteristic) {
        if (type && subType) {
            this.makePacket(type, subType, key, data);
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
};

Packet.prototype.writableBuffer = function() {
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
};

// ACCESSING FUNCTIONS

Packet.prototype.Type = function(newType) {
    if (this.instance !== null && this.instance !== undefined) {
        if (newType) {
            this.instance.Type = Binding.PacketType[newType];
        }
        else {
            return bindingTypeToString("PacketType", this.instance.Type);
        }
    }
    else {
        return null;
    }
};

Packet.prototype.SubType = function(newSubType) {
    if (this.instance !== null && this.instance !== undefined) {
        const type = this.Type();
        const bindingKey = `Packet${type}Type`;
        if (type && bindingKey && newSubType) {
            this.instance[type] = Binding[bindingKey][newSubType];
        }
        else if (bindingKey && type) {
            return bindingTypeToString(bindingKey, this.instance[type]);
        }
    }
    else {
        return null;
    }
};

Packet.prototype.data = function(key, value) {
    if (this.instance) {
        if (value) {
            this.instance[key] = value;
        }
        else {
            return this.instance[key];
        }
    }

    return null;
};

Packet.prototype.getPayload = function() {
};

Packet.prototype.parse = function() {
};

Packet.prototype.parseData = function(data) {
};

Packet.prototype.parseCommand = function(command) {
};

Packet.prototype.parseError = function(error) {
};

Packet.prototype.parseOTA = function(ota) {
};

// export packet
module.exports.Packet = function(bytes) {
    return new Packet(bytes);
};
module.exports.bindingTypeToString = bindingTypeToString;