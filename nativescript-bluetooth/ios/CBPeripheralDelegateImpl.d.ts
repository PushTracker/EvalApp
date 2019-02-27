/// <reference path="../node_modules/tns-platform-declarations/ios.d.ts" />
import { Bluetooth } from './ios_main';
/**
 * @link - https://developer.apple.com/documentation/corebluetooth/cbperipheraldelegate
 * The delegate of a CBPeripheral object must adopt the CBPeripheralDelegate protocol.
 * The delegate uses this protocol’s methods to monitor the discovery, exploration, and interaction of a remote peripheral’s services and properties.
 * There are no required methods in this protocol.
 */
export declare class CBPeripheralDelegateImpl extends NSObject implements CBPeripheralDelegate {
    static ObjCProtocols: {
        prototype: CBPeripheralDelegate;
    }[];
    _onWritePromise: any;
    _onWriteReject: any;
    _onWriteTimeout: any;
    _onReadPromise: any;
    _onReadReject: any;
    _onReadTimeout: any;
    _onNotifyCallback: any;
    private _servicesWithCharacteristics;
    private _services;
    private _owner;
    private _callback;
    static new(): CBPeripheralDelegateImpl;
    initWithCallback(owner: WeakRef<Bluetooth>, callback: (result?: any) => void): CBPeripheralDelegateImpl;
    peripheralDidReadRSSIError(peripheral: CBPeripheral, RSSI: number, error: NSError): void;
    /**
     * Invoked when you discover the peripheral’s available services.
     * This method is invoked when your app calls the discoverServices(_:) method.
     * If the services of the peripheral are successfully discovered, you can access them through the peripheral’s services property.
     * If successful, the error parameter is nil.
     * If unsuccessful, the error parameter returns the cause of the failure.
     * @param peripheral [CBPeripheral] - The peripheral that the services belong to.
     * @param error [NSError] - If an error occurred, the cause of the failure.
     */
    peripheralDidDiscoverServices(peripheral: CBPeripheral, error?: NSError): void;
    /**
     * Invoked when you discover the included services of a specified service.
     * @param peripheral [CBPeripheral] - The peripheral providing this information.
     * @param service [CBService] - The CBService object containing the included service.
     * @param error [NSError] - If an error occurred, the cause of the failure.
     */
    peripheralDidDiscoverIncludedServicesForServiceError(peripheral: CBPeripheral, service: CBService, error?: NSError): void;
    /**
     * Invoked when you discover the characteristics of a specified service.
     * @param peripheral [CBPeripheral] - The peripheral providing this information.
     * @param service [CBService] - The CBService object containing the included service.
     * @param error [NSError] - If an error occurred, the cause of the failure.
     */
    peripheralDidDiscoverCharacteristicsForServiceError(peripheral: CBPeripheral, service: CBService, error?: NSError): void;
    /**
     * Invoked when you discover the descriptors of a specified characteristic.
     * @param peripheral [CBPeripheral] - The peripheral providing this information.
     * @param characteristic [CBCharacteristic] - The characteristic that the characteristic descriptors belong to.
     * @param error [NSError] - If an error occurred, the cause of the failure.
     */
    peripheralDidDiscoverDescriptorsForCharacteristicError(peripheral: CBPeripheral, characteristic: CBCharacteristic, error?: NSError): void;
    /**
     * Invoked when you retrieve a specified characteristic’s value, or when
     * the peripheral device notifies your app that the characteristic’s
     * value has changed.
     */
    peripheralDidUpdateValueForCharacteristicError(peripheral: CBPeripheral, characteristic: CBCharacteristic, error?: NSError): void;
    /**
     * Invoked when you retrieve a specified characteristic descriptor’s value.
     */
    peripheralDidUpdateValueForDescriptorError(peripheral: CBPeripheral, descriptor: CBDescriptor, error?: NSError): void;
    /**
     * Invoked when you write data to a characteristic’s value.
     */
    peripheralDidWriteValueForCharacteristicError(peripheral: CBPeripheral, characteristic: CBCharacteristic, error?: NSError): void;
    /**
     * Invoked when the peripheral receives a request to start or stop
     * providing notifications for a specified characteristic’s value.
     */
    peripheralDidUpdateNotificationStateForCharacteristicError(peripheral: CBPeripheral, characteristic: CBCharacteristic, error?: NSError): void;
    /**
     * IInvoked when you write data to a characteristic descriptor’s value.
     */
    peripheralDidWriteValueForDescriptorError(peripheral: CBPeripheral, descriptor: CBDescriptor, error?: NSError): void;
    private _getProperties;
    private _getDescriptors;
}
