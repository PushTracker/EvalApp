/// <reference path="../node_modules/tns-platform-declarations/android-27.d.ts" />
import { Bluetooth } from './android_main';
export declare class TNS_BluetoothGattCallback extends android.bluetooth.BluetoothGattCallback {
    private _owner;
    constructor();
    onInit(owner: WeakRef<Bluetooth>): void;
    /**
     * Callback indicating when GATT client has connected/disconnected to/from a remote GATT server.
     * @param bluetoothGatt [android.bluetooth.BluetoothGatt] - GATT client
     * @param status [number] - Status of the connect or disconnect operation. GATT_SUCCESS if the operation succeeds.
     * @param newState [number] - Returns the new connection state. Can be one of STATE_DISCONNECTED or STATE_CONNECTED
     */
    onConnectionStateChange(gatt: android.bluetooth.BluetoothGatt, status: number, newState: number): void;
    /**
     * Callback invoked when the list of remote services, characteristics and descriptors for the remote device have been updated, ie new services have been discovered.
     * @param gatt [android.bluetooth.BluetoothGatt] - GATT client invoked discoverServices()
     * @param status [number] - GATT_SUCCESS if the remote device has been explored successfully.
     */
    onServicesDiscovered(gatt: android.bluetooth.BluetoothGatt, status: number): void;
    /**
     * Callback reporting the result of a characteristic read operation.
     * @param gatt [android.bluetooth.BluetoothGatt] - GATT client invoked readCharacteristic(BluetoothGattCharacteristic)
     * @param characteristic - Characteristic that was read from the associated remote device.
     * @param status [number] - GATT_SUCCESS if the read operation was completed successfully.
     */
    onCharacteristicRead(gatt: android.bluetooth.BluetoothGatt, characteristic: android.bluetooth.BluetoothGattCharacteristic, status: number): void;
    /**
     * Callback triggered as a result of a remote characteristic notification.
     * @param gatt [android.bluetooth.BluetoothGatt] - GATT client the characteristic is associated with.
     * @param characteristic [android.bluetooth.BluetoothGattCharacteristic] - Characteristic that has been updated as a result of a remote notification event.
     */
    onCharacteristicChanged(gatt: android.bluetooth.BluetoothGatt, characteristic: android.bluetooth.BluetoothGattCharacteristic): void;
    /**
     * Callback indicating the result of a characteristic write operation.
     * If this callback is invoked while a reliable write transaction is in progress, the value of the characteristic represents the value reported by the remote device.
     * An application should compare this value to the desired value to be written.
     * If the values don't match, the application must abort the reliable write transaction.
     * @param gatt - GATT client invoked writeCharacteristic(BluetoothGattCharacteristic)
     * @param characteristic - Characteristic that was written to the associated remote device.
     * @param status - The result of the write operation GATT_SUCCESS if the operation succeeds.
     */
    onCharacteristicWrite(gatt: android.bluetooth.BluetoothGatt, characteristic: android.bluetooth.BluetoothGattCharacteristic, status: number): void;
    /**
     * Callback reporting the result of a descriptor read operation.
     * @param gatt - GATT client invoked readDescriptor(BluetoothGattDescriptor)
     * @param descriptor - Descriptor that was read from the associated remote device.
     * @param status - GATT_SUCCESS if the read operation was completed successfully
     */
    onDescriptorRead(gatt: android.bluetooth.BluetoothGatt, descriptor: android.bluetooth.BluetoothGattDescriptor, status: number): void;
    /**
     * Callback indicating the result of a descriptor write operation.
     * @param gatt - GATT client invoked writeDescriptor(BluetoothGattDescriptor).
     * @param descriptor - Descriptor that was written to the associated remote device.
     * @param status - The result of the write operation GATT_SUCCESS if the operation succeeds.
     */
    onDescriptorWrite(gatt: android.bluetooth.BluetoothGatt, descriptor: android.bluetooth.BluetoothGattDescriptor, status: number): void;
    /**
     * Callback reporting the RSSI for a remote device connection. This callback is triggered in response to the readRemoteRssi() function.
     * @param gatt - GATT client invoked readRemoteRssi().
     * @param rssi - The RSSI value for the remote device.
     * @param status - GATT_SUCCESS if the RSSI was read successfully.
     */
    onReadRemoteRssi(gatt: android.bluetooth.BluetoothGatt, rssi: number, status: number): void;
    /**
     * Callback indicating the MTU for a given device connection has changed. This callback is triggered in response to the requestMtu(int) function, or in response to a connection event.
     * @param gatt - GATT client invoked requestMtu(int).
     * @param mtu - The new MTU size.
     * @param status - GATT_SUCCESS if the MTU has been changed successfully.
     */
    onMtuChanged(gatt: android.bluetooth.BluetoothGatt, mtu: number, status: number): void;
}
