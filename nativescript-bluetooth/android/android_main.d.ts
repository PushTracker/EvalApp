/// <reference path="../node_modules/tns-platform-declarations/android-27.d.ts" />
import { Central, Peripheral, BluetoothCommon, StopNotifyingOptions, StartNotifyingOptions, ConnectOptions, StartScanningOptions, StartAdvertisingOptions, DisconnectOptions, WriteOptions, ReadOptions, MakeServiceOptions, MakeCharacteristicOptions } from '../common';
import { TNS_AdvertiseCallback } from './TNS_AdvertiseCallback';
import { TNS_BroadcastReceiver } from './TNS_BroadcastReceiver';
import { TNS_BluetoothGattCallback } from './TNS_BluetoothGattCallback';
import { TNS_BluetoothGattServerCallback } from './TNS_BluetoothGattServerCallback';
import { TNS_LeScanCallback } from './TNS_LeScanCallback';
import { TNS_ScanCallback } from './TNS_ScanCallback';
export declare function deviceToCentral(dev: android.bluetooth.BluetoothDevice): Central;
export declare function deviceToPeripheral(dev: android.bluetooth.BluetoothDevice): Peripheral;
export { Central, Peripheral, BondState, ConnectionState } from '../common';
export declare class Bluetooth extends BluetoothCommon {
    bluetoothManager: android.bluetooth.BluetoothManager;
    adapter: android.bluetooth.BluetoothAdapter;
    gattServer: android.bluetooth.BluetoothGattServer;
    bluetoothGattServerCallback: TNS_BluetoothGattServerCallback;
    bluetoothGattCallback: TNS_BluetoothGattCallback;
    advertiseCallback: TNS_AdvertiseCallback;
    scanCallback: TNS_ScanCallback;
    LeScanCallback: TNS_LeScanCallback;
    broadcastReceiver: TNS_BroadcastReceiver;
    /**
     * Connections are stored as key-val pairs of UUID-Connection.
     * So something like this:
     * [{
     *   34343-2434-5454: {
     *     state: 'connected',
     *     discoveredState: '',
     *     operationConnect: someCallbackFunction
     *   },
     *   1323213-21321323: {
     *     ..
     *   }
     * }, ..]
     */
    connections: {};
    readonly enabled: boolean;
    constructor();
    coarseLocationPermissionGranted(): boolean;
    requestCoarseLocationPermission(): Promise<boolean>;
    /**
     * https://developer.android.com/reference/android/bluetooth/BluetoothAdapter.html#enable()
     * Turn on the local Bluetooth adapter—do not use without explicit user action to turn on Bluetooth.
     * This powers on the underlying Bluetooth hardware, and starts all Bluetooth system services.
     */
    enable(): Promise<boolean>;
    /**
     * https://developer.android.com/reference/android/bluetooth/BluetoothAdapter.html#disable()
     * Turn off the local Bluetooth adapter—do not use without explicit user action to turn off Bluetooth.
     * This gracefully shuts down all Bluetooth connections, stops Bluetooth system services, and powers down the underlying Bluetooth hardware.
     */
    disable(): Promise<{}>;
    isBluetoothEnabled(): Promise<{}>;
    startScanning(arg: StartScanningOptions): Promise<{}>;
    stopScanning(): Promise<{}>;
    connect(arg: ConnectOptions): Promise<{}>;
    disconnect(arg: DisconnectOptions): Promise<{}>;
    read(arg: ReadOptions): Promise<{}>;
    write(arg: WriteOptions): Promise<{}>;
    writeWithoutResponse(arg: WriteOptions): Promise<{}>;
    startNotifying(arg: StartNotifyingOptions): Promise<{}>;
    stopNotifying(arg: StopNotifyingOptions): Promise<{}>;
    getAdapter(): globalAndroid.bluetooth.BluetoothAdapter;
    removeBond(device: any): any;
    /**
     * Perform a service discovery on the remote device to get the UUIDs supported.
     */
    fetchUuidsWithSdp(device: any): any;
    /**
     * Close the GATT server instance.
     */
    stopGattServer(): void;
    /**
     * Open a GATT Server The callback is used to deliver results to Caller, such as connection status as well as the results of any other GATT server operations.
     * The method returns a BluetoothGattServer instance. You can use BluetoothGattServer to conduct GATT server operations.
     */
    startGattServer(): void;
    /**
     * Send a notification or indication that a local characteristic has been updated.
     * A notification or indication is sent to the remote device to signal that the characteristic has been updated.
     * This function should be invoked for every client that requests notifications/indications by writing to the "Client Configuration" descriptor for the given characteristic.
     * https://developer.android.com/reference/android/bluetooth/BluetoothGattServer.html#notifyCharacteristicChanged(android.bluetooth.BluetoothDevice,%20android.bluetooth.BluetoothGattCharacteristic,%20boolean)
     */
    notifyCentrals(value: any, characteristic: android.bluetooth.BluetoothGattCharacteristic, devices: any): any;
    /**
     * Show a system activity that requests discoverable mode. This activity will also request the user to turn on Bluetooth if it is not currently enabled.
     * TODO: finish implementing, not actually firing right now.
     */
    setDiscoverable(): Promise<{}>;
    getAdvertiser(): globalAndroid.bluetooth.le.BluetoothLeAdvertiser;
    makeService(opts: MakeServiceOptions): globalAndroid.bluetooth.BluetoothGattService;
    makeCharacteristic(opts: MakeCharacteristicOptions): globalAndroid.bluetooth.BluetoothGattCharacteristic;
    makeDescriptor(opts: any): globalAndroid.bluetooth.BluetoothGattDescriptor;
    addService(service: any): void;
    getServerService(uuidString: any): globalAndroid.bluetooth.BluetoothGattService;
    offersService(uuidString: any): boolean;
    clearServices(): void;
    cancelServerConnection(device: any): void;
    /**
     * Get connected devices for this specific profile.
     * Return the set of devices which are in state STATE_CONNECTED
     * Requires the BLUETOOTH permission.
     * @returns - List of Bluetooth devices. The list will be empty on error.
     */
    getConnectedDevices(): java.util.List<globalAndroid.bluetooth.BluetoothDevice>;
    /**
     * Get the current connection state of the profile.
     * @param device [android.bluetooth.BluetoothDevice] - Remote bluetooth device.
     */
    getConnectedDeviceState(device: android.bluetooth.BluetoothDevice): number;
    /**
     * Get a list of devices that match any of the given connection states.
     * @param states - Array of states. States can be one of:
     * android.bluetooth.BluetoothProfile.STATE_CONNECTED,
     * android.bluetooth.BluetoothProfile.STATE_CONNECTING,
     * android.bluetooth.BluetoothProfile.STATE_DISCONNECTED,
     * android.bluetooth.BluetoothProfile.STATE_DISCONNECTING,
     * @link - https://developer.android.com/reference/android/bluetooth/BluetoothManager.html#getDevicesMatchingConnectionStates(int,%20int[])
     */
    getConnectedDevicesMatchingState(states: any): java.util.List<globalAndroid.bluetooth.BluetoothDevice>;
    /**
     * Get connected devices for this specific profile.
     * Return the set of devices which are in state STATE_CONNECTED
     * Requires the BLUETOOTH permission.
     * @returns - List of Bluetooth devices. The list will be empty on error.
     */
    getServerConnectedDevices(): java.util.List<globalAndroid.bluetooth.BluetoothDevice>;
    /**
     * Get the current connection state of the profile.
     * @param device [android.bluetooth.BluetoothDevice] - Remote bluetooth device.
     */
    getServerConnectedDeviceState(device: android.bluetooth.BluetoothDevice): number;
    /**
     * Get a list of devices that match any of the given connection states.
     * @param states - Array of states. States can be one of:
     * android.bluetooth.BluetoothProfile.STATE_CONNECTED,
     * android.bluetooth.BluetoothProfile.STATE_CONNECTING,
     * android.bluetooth.BluetoothProfile.STATE_DISCONNECTED,
     * android.bluetooth.BluetoothProfile.STATE_DISCONNECTING,
     * @link - https://developer.android.com/reference/android/bluetooth/BluetoothManager.html#getDevicesMatchingConnectionStates(int,%20int[])
     */
    getServerConnectedDevicesMatchingState(states: any): java.util.List<globalAndroid.bluetooth.BluetoothDevice>;
    startAdvertising(opts: StartAdvertisingOptions): Promise<{}>;
    stopAdvertising(): Promise<{}>;
    isPeripheralModeSupported(): Promise<{}>;
    gattDisconnect(gatt: android.bluetooth.BluetoothGatt): void;
    uuidToString(uuid: any): any;
    encodeValue(val: any): any;
    decodeValue(value: any): ArrayBuffer;
    stringToUuid(uuidStr: any): java.util.UUID;
    extractManufacturerRawData(scanRecord: any): ArrayBuffer;
    private _findNotifyCharacteristic;
    private _findCharacteristicOfType;
    private _getWrapper;
    private _isEnabled;
    private _getContext;
    private _getActivity;
}
