/// <reference path="../node_modules/tns-platform-declarations/ios.d.ts" />

import { CLog, CLogTypes } from '../common';
import { Bluetooth } from './ios_main';

/**
 * @link - https://developer.apple.com/documentation/corebluetooth/cbperipheralmanagerdelegate
 * The delegate of a CBPeripheralManager object must adopt the CBPeripheralManagerDelegate protocol, a protocol consisting of numerous optional methods and one required method.
 * The protocol’s optional methods are used by the delegate to verify publishing and advertising, and to monitor read, write, and subscription requests from remote central devices.
 * The protocol’s required method, which indicates whether the peripheral manager is available, is called when the peripheral manager’s state is updated.
 */
export class CBPeripheralManagerDelegateImpl extends NSObject implements CBPeripheralManagerDelegate {
  public static ObjCProtocols = [CBPeripheralManagerDelegate];
  private _owner: WeakRef<Bluetooth>;
  private _central?: CBCentral;
  private _isConnected = false;
  private _otaInProgress = false;
  private _lastObservedPeripheralState?: CBManagerState;
  private _subscribedCharacteristics = new Set<CBUUID>();
  private _forceUpdate = false;
  private _isWakeSupportCheck = false;
  private _bandSupportsWake = false;
  private _isSendingTime = false;

  static new(): CBPeripheralManagerDelegateImpl {
    return <CBPeripheralManagerDelegateImpl>super.new();
  }

  public initWithOwner(owner: WeakRef<Bluetooth>): CBPeripheralManagerDelegateImpl {
    this._owner = owner;
    CLog(CLogTypes.info, `CBPeripheralManagerDelegateImpl.initWithCallback ---- this._owner: ${this._owner}`);
    return this;
  }

  public initWithCallback(owner: WeakRef<Bluetooth>, callback: (result?) => void): CBPeripheralManagerDelegateImpl {
    this._owner = owner;
    CLog(CLogTypes.info, `CBPeripheralManagerDelegateImpl.initWithCallback ---- this._owner: ${this._owner}`);
    return this;
  }

  /**
   * Invoked when the peripheral manager's state is updated.
   * @param mgr [CBPeripheralManager] - The peripheral manager whose state has changed.
   */
  public peripheralManagerDidUpdateState(mgr: CBPeripheralManager) {
    CLog(CLogTypes.info, 'peripheralManagerDidUpdateState');

    const owner = this._owner.get();
    if (!owner) {
      return;
    }

    this._lastObservedPeripheralState = mgr.state;

    const state = owner._getManagerStateString(mgr.state);
    CLog(CLogTypes.info, `current peripheral manager state = ${state}`);

    owner.sendEvent(Bluetooth.peripheralmanager_update_state_event, { manager: mgr, state });
  }

  /**
   * Invoked when the peripheral manager is about to be restored by the system.
   * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
   * @param dict [NSDictionary<string, any>] - A dictionary containing information about the peripheral manager that was preserved by the system at the time the app was terminated. For the available keys to this dictionary.
   * @link - Peripheral Manager State Restoration Options @ https://developer.apple.com/documentation/corebluetooth/cbperipheralmanagerdelegate/peripheral_manager_state_restoration_options.
   */
  public peripheralManagerWillRestoreState(peripheral: CBPeripheralManager, dict?: NSDictionary<string, any>) {
    CLog(CLogTypes.info, 'CBPeripheralManagerDelegateImpl.peripheralManagerWillRestoreState ---- ', dict);

    const owner = this._owner.get();
    if (!owner) {
      return;
    }
    owner.sendEvent(Bluetooth.peripheralmanager_restore_state_event, { manager: peripheral, dict: dict });
  }

  /**
   * Invoked when you publish a service, and any of its associated characteristics and characteristic descriptors, to the local Generic Attribute Profile (GATT) database.
   * This method is invoked when your app calls the add(_:) method to publish a service to the local peripheral’s GATT database.
   * If the service is successfully published to the local database, the error parameter is nil.
   * If unsuccessful, the error parameter returns the cause of the failure.
   * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
   * @param service [CBService] - The service that was added to the local GATT database.
   * @param error? [NSError] - If an error occurred, the cause of the failure.
   */
  public peripheralManagerDidAddError(peripheral: CBPeripheralManager, service: CBService, error?: NSError) {
    CLog(CLogTypes.info, 'CBPeripheralManagerDelegateImpl.peripheralManagerDidAddError ---- ', error);

    alert('Peripheral Manager Did Add Error');
    console.log(peripheral, service, error);

    const owner = this._owner.get();
    if (!owner) {
      return;
    }
    owner.sendEvent(Bluetooth.peripheralmanager_did_add_event, {
      manager: peripheral,
      service: service,
      error: error
    });
  }

  /**
   * Invoked when you start advertising the local peripheral device’s data.
   * @param peripheralMgr [CBPeripheralManager] - The peripheral manager providing this information.
   * @param error? [NSError] - If an error occurred, the cause of the failure.
   */
  public peripheralManagerDidStartAdvertisingError(peripheralMgr: CBPeripheralManager, error?: NSError) {
    CLog(CLogTypes.info, 'CBPeripheralManagerDelegateImpl.peripheralManagerDidStartAdvertisingError ----', error);
    const owner = this._owner.get();
    if (!owner) {
      return;
    }

    if (error) {
      CLog(CLogTypes.warning, 'TODO: we may need to parse out the error value here for parity with Android.');
      this._owner.get().sendEvent(Bluetooth.bluetooth_advertise_failure_event, { error: error });
      return;
    }

    this._owner.get().sendEvent(Bluetooth.bluetooth_advertise_success_event);
  }

  /**
   * Invoked when a remote central device subscribes to a characteristic’s value.
   * This method is invoked when a remote central device subscribes to the value of one of the local peripheral’s characteristics, by enabling notifications or indications on the characteristic’s value.
   * You should use the invocation of this method as a cue to start sending the subscribed central updates as the characteristic’s value changes.
   * To send updated characteristic values to subscribed centrals, use the updateValue(_:for:onSubscribedCentrals:) method of the CBPeripheralManager class.
   * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
   * @param central [CBCentral] - The remote central device that subscribed to the characteristic’s value.
   * @param characteristic [CBCharacteristic] - The characteristic whose value has been subscribed to.
   */
  public peripheralManagerCentralDidSubscribeToCharacteristic(
    peripheral: CBPeripheralManager,
    central: CBCentral,
    characteristic: CBCharacteristic
  ) {
    CLog(
      CLogTypes.info,
      'CBPeripheralManagerDelegateImpl.peripheralManagerCentralDidSubscribeToCharacteristic ----',
      characteristic
    );

    console.log('characteristic.uuid', characteristic.UUID);
    console.log('central.identifer', central.identifier);

    let isNewCentral = false;

    const oldCentral = this._central;
    if (!oldCentral || !oldCentral.identifier) {
      console.log('oldCentral is null');
    }

    if (oldCentral && oldCentral.identifier && oldCentral === this._central) {
      console.log(`oldCentral.identifier = ${oldCentral.identifier}`, 'central.identifier', central.identifier);
      if (oldCentral.identifier !== central.identifier) {
        console.log(
          `changing central from ${oldCentral.identifier} to ${
            central.identifier
          } and clearing characteristic subscriptions.`
        );
        isNewCentral = true;
      } else if (oldCentral !== central) {
        console.log(`New central but same identifier. Clearing characteristic subscriptions.`);
        isNewCentral = true;
      }
    } else {
      isNewCentral = true;
    }

    if (isNewCentral) {
      this._central = central;
      this._subscribedCharacteristics = new Set<CBUUID>();
    }

    this._isConnected = true;
    console.log(`this._isConnected = ${this._isConnected}`);

    this._subscribedCharacteristics.add(characteristic.UUID);

    // peripheral.stopAdvertising();
    // //         setHasPairedToWristband(true)

    // const x = CBUUID.UUIDWithString('68208ebf-f655-4a2d-98f4-20d7d860c471');
    // if (x === characteristic.UUID) {
    //   this.sendSetTime();

    //   console.log('sent the set time event');

    //   this.checkIfBandSupportsWake();
    // }

    const owner = this._owner.get();
    if (!owner) {
      return;
    }

    owner.sendEvent(Bluetooth.server_connection_state_changed_event, {
      manager: peripheral,
      central: central,
      characteristic: characteristic
    });
  }

  private sendSetTime() {
    console.log('send set time');
    this._isSendingTime = true;

    // let date = Date()
    // let calendar = Calendar.current

    // let year = UInt16(calendar.component(.year, from: date))
    // let month = UInt8(calendar.component(.month, from: date))
    // let day = UInt8(calendar.component(.day, from: date))
    // let hours = UInt8(calendar.component(.hour, from: date))
    // let minutes = UInt8(calendar.component(.minute, from: date))
    // let seconds = UInt8(calendar.component(.second, from: date))

    // let time = PushTrackerPacketTimeInfo(year: year, month: month, day: day, hours: hours, minutes: minutes, seconds: seconds)
    // let packet = PushTrackerPacket.command(subtype: .setTime(time: time))

    // if sendPacket(packet) {
    //     isSendingTime = false
    // }
  }

  private checkIfBandSupportsWake() {
    if (this._bandSupportsWake) {
      this.startWakePolling();
      return;
    }

    this._isWakeSupportCheck = true;

    console.log('checkIfBandSupportsWake isWakeSupportCheck', this._isWakeSupportCheck);

    // DispatchQueue.main.asyncAfter(deadline: .now() + 1.0, execute: {
    //     self.checkForConnection(completionCallback: { supported in
    //         self.isWakeSupportCheck = false
    //         self.bandSupportsWake = supported

    //         if supported {
    //             self.startWakePolling()
    //         }
    //     })
    // })
  }

  private startWakePolling() {
    if (!this._isConnected && !this._bandSupportsWake) {
      return;
    }

    // const x = NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(30.0, this, )

    // this.wakePollingTimer = Timer.scheduledTimer(timeInterval: 30.0, target: self, selector: #selector(wake), userInfo: nil, repeats: true)
  }

  /**
   * Invoked when a remote central device unsubscribes from a characteristic’s value.
   * This method is invoked when a remote central device unsubscribes from the value of one of the local peripheral’s characteristics, by disabling notifications or indications on the characteristic’s value.
   * You should use the invocation of this method as a cue to stop sending the subscribed central updates as the characteristic’s value changes.
   * @param peripheral [CBPeripheralManager] -The peripheral manager providing this information.
   * @param central [CBCentral] - The remote central device that subscribed to the characteristic’s value.
   * @param characteristic [CBCharacteristic] - The characteristic whose value has been unsubscribed from.
   */
  public peripheralManagerCentralDidUnsubscribeFromCharacteristic(
    peripheral: CBPeripheralManager,
    central: CBCentral,
    characteristic: CBCharacteristic
  ) {
    CLog(
      CLogTypes.info,
      'CBPeripheralManagerDelegateImpl.peripheralManagerCentralDidUnsubscribeFromCharacteristic ----',
      central,
      characteristic
    );

    this._subscribedCharacteristics.delete(characteristic.UUID);

    if (this._subscribedCharacteristics.size <= 0) {
      this._isConnected = false;
      console.log(`this._isConnected = ${this._isConnected}`);
      // start advertising again ...?
    }

    const owner = this._owner.get();
    if (!owner) {
      return;
    }
    owner.sendEvent(Bluetooth.peripheralmanager_unsubscribe_characteristic_event, {
      manager: peripheral,
      central: central,
      characteristic: characteristic
    });
  }

  /**
   * This method is invoked when your app calls the addService: method to publish a service to the local peripheral’s
   * GATT database. If the service is successfully published to the local database, the error parameter is nil.
   * If unsuccessful, the error parameter returns the cause of the failure.
   * @param peripheral - The peripheral manager providing this information.
   * @param service - The service that was added to the local GATT database.
   * @param error - If an error occurred, the cause of the failure.
   */
  public peripheralManagerDidAddServiceError(peripheral: CBPeripheralManager, service: CBService, error: NSError) {
    CLog(
      CLogTypes.info,
      'CBPeripheralManagerDelegateImpl.peripheralManagerDidAddServiceError ----',
      peripheral,
      service,
      `error: ${error}`
    );
  }

  /**
   * Invoked when a local peripheral device is again ready to send characteristic value updates.
   * When a call to the updateValue(_:for:onSubscribedCentrals:) method fails because the underlying queue used to transmit the updated characteristic value is full, the peripheralManagerIsReady(toUpdateSubscribers:) method is invoked when more space in the transmit queue becomes available.
   * You can then implement this delegate method to resend the value.
   * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
   */
  public peripheralManagerIsReadyToUpdateSubscribers(peripheral: CBPeripheralManager) {
    CLog(
      CLogTypes.info,
      'CBPeripheralManagerDelegateImpl.peripheralManagerIsReadyToUpdateSubscribers ----',
      peripheral
    );

    const owner = this._owner.get();
    if (!owner) {
      return;
    }
    owner.sendEvent(Bluetooth.peripheralmanager_ready_update_subscribers_event, {
      manager: peripheral
    });
  }

  /**
   * Invoked when a local peripheral device receives an Attribute Protocol (ATT) read request for a characteristic that has a dynamic value.
   * Each time this method is invoked, you call the respond(to:withResult:) method of the CBPeripheralManager class exactly once to respond to the read request.
   * @param peripheral [CBPeripheralManager] - The peripheral manager providing this information.
   * @param request [CBATTRequest] - A CBATTRequest object that represents a request to read a characteristic’s value.
   */
  public peripheralManagerDidReceiveReadRequest(peripheral: CBPeripheralManager, request: CBATTRequest) {
    CLog(
      CLogTypes.info,
      'CBPeripheralManagerDelegateImpl.peripheralManagerDidReceiveReadRequest ----',
      peripheral,
      request
    );

    const owner = this._owner.get();
    if (!owner) {
      return;
    }
    owner.sendEvent(Bluetooth.peripheralmanager_read_request_event, {
      manager: peripheral,
      request: request
    });
  }

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
  public peripheralManagerDidReceiveWriteRequests(peripheral: CBPeripheralManager, requests) {
    CLog(
      CLogTypes.info,
      'CBPeripheralManagerDelegateImpl.peripheralManagerDidReceiveWriteRequests ----',
      peripheral,
      requests
    );

    const owner = this._owner.get();
    if (!owner) {
      return;
    }
    owner.sendEvent(Bluetooth.peripheralmanager_write_request_event, {
      manager: peripheral,
      requests: requests
    });
  }
}
