// nativescript
import { Observable, EventData } from 'tns-core-modules/data/observable';

export class Trial extends Observable {
  // STATIC:
  public static timeToString(seconds: number): string {
    let t = new Date(null);
    t.setSeconds(seconds);
    return t.toISOString().substr(11, 8);
  }

  // NON STATIC:
  public name: string = '';
  // questionnaire
  public flat: boolean = false;
  public ramap: boolean = false;
  public inclines: boolean = false;
  public other: boolean = false;
  // settings
  public max_speed: number = 0.7;
  public acceleration: number = 0.3;
  // state
  public startedWith: boolean = false;
  public startedWithout: boolean = false;
  public finishedWith: boolean = false;
  public finishedWithout: boolean = false;
  // metrics
  public distance: number = 0;
  // with SD
  public with_pushes: number = 0;
  public with_coast: number = 0;
  public with_distance: number = 0;
  public with_start: Date;
  public with_end: Date;
  public with_elapsed: number = 0;
  // without SD
  public without_pushes: number = 0;
  public without_coast: number = 0;
  public without_distance: number = 0;
  public without_start: Date;
  public without_end: Date;
  public without_elapsed: number = 0;

  constructor() {
    super();
  }
}
