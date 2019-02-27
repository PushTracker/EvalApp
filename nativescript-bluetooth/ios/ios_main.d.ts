/// <reference path="../node_modules/tns-platform-declarations/ios.d.ts" />
import { BluetoothCommon, Central, ConnectOptions, MakeCharacteristicOptions, MakeServiceOptions, Peripheral, StartAdvertisingOptions, StartNotifyingOptions, StartScanningOptions, StopNotifyingOptions } from '../common';
export declare function deviceToCentral(dev: CBCentral): Central;
export declare function deviceToPeripheral(dev: CBPeripheral): Peripheral;
export { BondState, Central, ConnectionState, Peripheral } from '../common';
export declare class Bluetooth extends BluetoothCommon {
    private readonly _centralDelegate;
    private readonly _centralPeripheralMgrDelegate;
    private readonly _centralManager;
    private readonly _peripheralManager;
    private _data_service;
    _connectCallbacks: {};
    _disconnectCallbacks: {};
    _onDiscovered: any;
    constructor(options?: any);
    readonly enabled: boolean;
    removePeripheral(peripheral: any): void;
    addPeripheral(peripheral: any): void;
    _getState(state: CBPeripheralState): "connected" | "disconnected" | "connecting";
    isBluetoothEnabled(): Promise<{}>;
    startScanning(arg: StartScanningOptions): Promise<{}>;
    toArrayBuffer(value: any): ArrayBuffer;
    removeBond(device: any): void;
    fetchUuidsWithSdp(device: any): void;
    stopGattServer(): void;
    startGattServer(): void;
    setDiscoverable(): Promise<{}>;
    getAdvertiser(): any;
    makeService(opts: MakeServiceOptions): CBMutableService;
    makeCharacteristic(opts: MakeCharacteristicOptions): CBMutableCharacteristic;
    makeDescriptor(options: any): any;
    /**
     * https://developer.apple.com/documentation/corebluetooth/cbperipheralmanager/1393255-addservice
     */
    addService(service: any): void;
    getServerService(uuidString: any): any;
    offersService(uuidString: any): boolean;
    clearServices(): void;
    cancelServerConnection(device: any): void;
    /**
     * https://developer.apple.com/documentation/corebluetooth/cbperipheralmanager/1393281-updatevalue?changes=_2&language=objc
     */
    notifyCentrals(value: any, characteristic: any, centrals: any): Promise<{}>;
    /**
     * Get connected devices for this specific profile.
     * Return the set of devices which are in state STATE_CONNECTED
     * Requires the BLUETOOTH permission.
     * @returns - List of Bluetooth devices. The list will be empty on error.
     */
    getConnectedDevices(): any;
    getServerConnectedDevices(): any;
    getServerConnectedDeviceState(device: any): void;
    getServerConnectedDevicesMatchingState(state: any): void;
    /**
     * https://developer.apple.com/documentation/corebluetooth/cbperipheralmanager/1393252-startadvertising?language=objc
     */
    startAdvertising(args: StartAdvertisingOptions): Promise<{}>;
    /**
     * https://developer.apple.com/documentation/corebluetooth/cbperipheralmanager/1393275-stopadvertising?language=objc
     */
    stopAdvertising(): Promise<{}>;
    isPeripheralModeSupported(): Promise<{}>;
    enable(): Promise<{}>;
    /**
     * Disabled Bluetooth on iOS is only available via a private API which will get any app rejected.
     * So the plugin is not going to be exposing such functionality.
     */
    disable(): Promise<{}>;
    stopScanning(arg: any): Promise<{}>;
    connect(args: ConnectOptions): Promise<{}>;
    disconnect(arg: any): Promise<{}>;
    isConnected(arg: any): Promise<{}>;
    findPeripheral(UUID: any): CBPeripheral;
    read(arg: any): Promise<{}>;
    write(arg: any): Promise<{}>;
    writeWithoutResponse(arg: any): Promise<{}>;
    startNotifying(args: StartNotifyingOptions): Promise<{}>;
    stopNotifying(args: StopNotifyingOptions): Promise<{}>;
    private _mapCharacteristicProps;
    private _isEnabled;
    private _stringToUuid;
    private _findService;
    private _findCharacteristic;
    private _getWrapper;
    /**
     * Value must be a Uint8Array or Uint16Array or
     * a string like '0x01' or '0x007F' or '0x01,0x02', or '0x007F,'0x006F''
     */
    private _encodeValue;
    _getManagerStateString(state: CBManagerState): string;
}
