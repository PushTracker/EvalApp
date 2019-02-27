/// <reference path="../node_modules/tns-platform-declarations/ios.d.ts" />
import { Bluetooth } from './ios_main';
/**
 * @link - https://developer.apple.com/documentation/corebluetooth/cbperipheralmanagerdelegate
 * The delegate of a CBPeripheralManager object must adopt the CBPeripheralManagerDelegate protocol, a protocol consisting of numerous optional methods and one required method.
 * The protocol’s optional methods are used by the delegate to verify publishing and advertising, and to monitor read, write, and subscription requests from remote central devices.
 * The protocol’s required method, which indicates whether the peripheral manager is available, is called when the peripheral manager’s state is updated.
 */
export declare class CBPeripheralManagerDelegateImpl extends NSObject implements CBPeripheralManagerDelegate {
    static ObjCProtocols: {
        prototype: CBPeripheralManagerDelegate;
    }[];
    private _owner;
    private _central?;
    private _isConnected;
    private _otaInProgress;
    private _lastObservedPeripheralState?;
    private _subscribedCharacteristics;
    private _forceUpdate;
    private _isWakeSupportCheck;
    private _bandSupportsWake;
    private _isSendingTime;
    static new(): CBPeripheralManagerDelegateImpl;
    initWithOwner(owner: WeakRef<Bluetooth>): CBPeripheralManagerDelegateImpl;
    initWithCallback(owner: WeakRef<Bluetooth>, callback: (result?: any) => void): CBPeripheralManagerDelegateImpl;
    /**
     * Invoked when the peripheral manager's state is updated.
     * @param mgr [CBPeripheralManager] - The peripheral manager whose state has changed.
     */
    peripheralManagerDidUpdateState(mgr: CBPeripheralManager): void;
    /**
     * Invoked when the peripheral manager is about to be restored by the system.
     * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
     * @param dict [NSDictionary<string, any>] - A dictionary containing information about the peripheral manager that was preserved by the system at the time the app was terminated. For the available keys to this dictionary.
     * @link - Peripheral Manager State Restoration Options @ https://developer.apple.com/documentation/corebluetooth/cbperipheralmanagerdelegate/peripheral_manager_state_restoration_options.
     */
    peripheralManagerWillRestoreState(peripheral: CBPeripheralManager, dict?: NSDictionary<string, any>): void;
    /**
     * Invoked when you publish a service, and any of its associated characteristics and characteristic descriptors, to the local Generic Attribute Profile (GATT) database.
     * This method is invoked when your app calls the add(_:) method to publish a service to the local peripheral’s GATT database.
     * If the service is successfully published to the local database, the error parameter is nil.
     * If unsuccessful, the error parameter returns the cause of the failure.
     * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
     * @param service [CBService] - The service that was added to the local GATT database.
     * @param error? [NSError] - If an error occurred, the cause of the failure.
     */
    peripheralManagerDidAddError(peripheral: CBPeripheralManager, service: CBService, error?: NSError): void;
    /**
     * Invoked when you start advertising the local peripheral device’s data.
     * @param peripheralMgr [CBPeripheralManager] - The peripheral manager providing this information.
     * @param error? [NSError] - If an error occurred, the cause of the failure.
     */
    peripheralManagerDidStartAdvertisingError(peripheralMgr: CBPeripheralManager, error?: NSError): void;
    /**
     * Invoked when a remote central device subscribes to a characteristic’s value.
     * This method is invoked when a remote central device subscribes to the value of one of the local peripheral’s characteristics, by enabling notifications or indications on the characteristic’s value.
     * You should use the invocation of this method as a cue to start sending the subscribed central updates as the characteristic’s value changes.
     * To send updated characteristic values to subscribed centrals, use the updateValue(_:for:onSubscribedCentrals:) method of the CBPeripheralManager class.
     * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
     * @param central [CBCentral] - The remote central device that subscribed to the characteristic’s value.
     * @param characteristic [CBCharacteristic] - The characteristic whose value has been subscribed to.
     */
    peripheralManagerCentralDidSubscribeToCharacteristic(peripheral: CBPeripheralManager, central: CBCentral, characteristic: CBCharacteristic): void;
    /**
     * Invoked when a remote central device unsubscribes from a characteristic’s value.
     * This method is invoked when a remote central device unsubscribes from the value of one of the local peripheral’s characteristics, by disabling notifications or indications on the characteristic’s value.
     * You should use the invocation of this method as a cue to stop sending the subscribed central updates as the characteristic’s value changes.
     * @param peripheral [CBPeripheralManager] -The peripheral manager providing this information.
     * @param central [CBCentral] - The remote central device that subscribed to the characteristic’s value.
     * @param characteristic [CBCharacteristic] - The characteristic whose value has been unsubscribed from.
     */
    peripheralManagerCentralDidUnsubscribeFromCharacteristic(peripheral: CBPeripheralManager, central: CBCentral, characteristic: CBCharacteristic): void;
    /**
     * This method is invoked when your app calls the addService: method to publish a service to the local peripheral’s
     * GATT database. If the service is successfully published to the local database, the error parameter is nil.
     * If unsuccessful, the error parameter returns the cause of the failure.
     * @param peripheral - The peripheral manager providing this information.
     * @param service - The service that was added to the local GATT database.
     * @param error - If an error occurred, the cause of the failure.
     */
    peripheralManagerDidAddServiceError(peripheral: CBPeripheralManager, service: CBService, error: NSError): void;
    /**
     * Invoked when a local peripheral device is again ready to send characteristic value updates.
     * When a call to the updateValue(_:for:onSubscribedCentrals:) method fails because the underlying queue used to transmit the updated characteristic value is full, the peripheralManagerIsReady(toUpdateSubscribers:) method is invoked when more space in the transmit queue becomes available.
     * You can then implement this delegate method to resend the value.
     * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
     */
    peripheralManagerIsReadyToUpdateSubscribers(peripheral: CBPeripheralManager): void;
    /**
     * Invoked when a local peripheral device receives an Attribute Protocol (ATT) read request for a characteristic that has a dynamic value.
     * Each time this method is invoked, you call the respond(to:withResult:) method of the CBPeripheralManager class exactly once to respond to the read request.
     * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
     * @param request [CBATTRequest] - A CBATTRequest object that represents a request to read a characteristic’s value.
     */
    peripheralManagerDidReceiveReadRequest(peripheral: CBPeripheralManager, request: CBATTRequest): void;
    /**
     * Invoked when a local peripheral device receives an Attribute Protocol (ATT) write request for a characteristic that has a dynamic value.
     * In the same way that you respond to a read request, each time this method is invoked, you call the respond(to:withResult:) method of the CBPeripheralManager class exactly once.
     * If the requests parameter contains multiple requests, treat them as you would a single request—if any individual request cannot be fulfilled, you should not fulfill any of them.
     * Instead, call the respond(to:withResult:) method immediately, and provide a result that indicates the cause of the failure.
     * When you respond to a write request, note that the first parameter of the respond(to:withResult:) method expects a single CBATTRequest object, even though you received an array of them from the peripheralManager(_:didReceiveWrite:) method.
     * To respond properly, pass in the first request of the requests array.
     * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
     * @param requests CBATTRequest[] - A list of one or more CBATTRequest objects, each representing a request to write the value of a characteristic.
     */
    peripheralManagerDidReceiveWriteRequests(peripheral: CBPeripheralManager, requests: any): void;
}
