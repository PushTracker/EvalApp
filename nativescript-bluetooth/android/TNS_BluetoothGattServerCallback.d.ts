/// <reference path="../node_modules/tns-platform-declarations/android-27.d.ts" />
import { Bluetooth } from './android_main';
export declare class TNS_BluetoothGattServerCallback extends android.bluetooth.BluetoothGattServerCallback {
    private _owner;
    constructor();
    onInit(owner: WeakRef<Bluetooth>): void;
    /**
     * A remote client has requested to read a local characteristic.
     * @param device [BluetoothDevice] - The remote device that has requested the read operation.
     * @param requestId [number] - The Id of the request.
     * @param offset [number] - Offset into the value of the characteristic
     * @param characteristic [android.bluetooth.BluetoothGattCharacteristic] - Characteristic to be read
     */
    onCharacteristicReadRequest(device: android.bluetooth.BluetoothDevice, requestId: number, offset: number, characteristic: android.bluetooth.BluetoothGattCharacteristic): void;
    /**
     * A remote client has requested to write to a local characteristic.
     * @param device - The remote device that has requested the write operation
     * @param requestId - The Id of the request
     * @param characteristic - Characteristic to be written to.
     * @param preparedWrite - true, if this write operation should be queued for later execution.
     * @param responseNeeded - true, if the remote device requires a response
     * @param offset - The offset given for the value
     * @param value - The value the client wants to assign to the characteristic
     */
    onCharacteristicWriteRequest(device: android.bluetooth.BluetoothDevice, requestId: number, characteristic: android.bluetooth.BluetoothGattCharacteristic, preparedWrite: boolean, responseNeeded: boolean, offset: number, value: any[]): void;
    /**
     * Callback indicating when a remote device has been connected or disconnected.
     * @param device - Remote device that has been connected or disconnected.
     * @param status - Status of the connect or disconnect operation.
     * @param newState - Returns the new connection state. Can be one of STATE_DISCONNECTED or STATE_CONNECTED
     */
    onConnectionStateChange(device: android.bluetooth.BluetoothDevice, status: number, newState: number): void;
    /**
     * A remote client has requested to read a local descriptor.
     * An application must call sendResponse(BluetoothDevice, int, int, int, byte[]) to complete the request.
     * @param device - The remote device that has requested the read operation
     * @param requestId - The Id of the request
     * @param offset - Offset into the value of the characteristic
     * @param descriptor - Descriptor to be read
     */
    onDescriptorReadRequest(device: android.bluetooth.BluetoothDevice, requestId: number, offset: number, descriptor: any): void;
    /**
     * A remote client has requested to write to a local descriptor.
     * An application must call sendResponse(BluetoothDevice, int, int, int, byte[]) to complete the request.
     * @param device - The remote device that has requested the write operation
     * @param requestId - The Id of the request
     * @param descriptor - Descriptor to be written to.
     * @param preparedWrite - true, if this write operation should be queued for later execution.
     * @param responseNeeded - true, if the remote device requires a response
     * @param offset - The offset given for the value
     * @param value - The value the client wants to assign to the descriptor
     */
    onDescriptorWriteRequest(device: any, requestId: any, descriptor: any, preparedWrite: any, responseNeeded: any, offset: any, value: any): void;
    /**
     * Execute all pending write operations for this device.
     * An application must call sendResponse(BluetoothDevice, int, int, int, byte[]) to complete the request.
     * @param device - The remote device that has requested the write operations
     * @param requestId - The Id of the request
     * @param execute - Whether the pending writes should be executed (true) or cancelled (false)
     */
    onExecuteWrite(device: android.bluetooth.BluetoothDevice, requestId: number, execute: boolean): void;
    /**
     * Callback invoked when a notification or indication has been sent to a remote device.
     * When multiple notifications are to be sent, an application must wait for this callback to be received before sending additional notifications.
     * API level 21+
     * @param device - The remote device the notification has been sent to
     * @param status [number] - Returns GATT_SUCCESS if the operation was successful.
     */
    onNotificationSent(device: android.bluetooth.BluetoothDevice, status: number): void;
    /**
     * Indicates whether a local service has been added successfully.
     * @param status [number] - Returns GATT_SUCCESS if the service was added successfully.
     * @param service [android.bluetooth.BluetoothGattService] - The service that has been added.
     */
    onServiceAdded(status: number, service: android.bluetooth.BluetoothGattService): void;
}
