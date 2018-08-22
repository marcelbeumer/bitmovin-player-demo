/**
 * Class to Wrap the bitmovin player and take care of SMPTE <-> time conversions
 */

class SmtpeController {

  /**
   * Wrapped instance of the bitmovin player
   */
  private player: any;
  /**
   * Description of the loaded asset
   */
  private assetDescription: AssetDescription;

  /**
   * Flag needed to detect playing -> pause transitions
   */
  private hasBeenPlaying: boolean;

  constructor(player: any, assetDescription: AssetDescription) {
    this.player = player;
    this.assetDescription = assetDescription;
    player.addEventHandler('onPaused', this.playPauseHandler);
    player.addEventHandler('onPlaying', this.playPauseHandler);
    this.load(assetDescription);
  }

  /**
   * In Firefox we have the fun behaviour, that play + pause leads to an incorrect video.currentTime (off by 1 frame
   * most of the time). To reproduce try play + pause at some point in the video. Then save the current Time, seek
   * somewhere else and then back to the previous current time ... you will see a different Frame.
   * In order to avoid this mess, when we encounter play + pause we seek to the calculated SMPTE, quite the dirty hack
   * but necessary.
   */
  private playPauseHandler = (event: any) => {
    if (event.type === 'onPlaying') {
      this.hasBeenPlaying = true;
    } else if (this.hasBeenPlaying) {
      this.hasBeenPlaying = false;
      this.seekToSMPTE(this.getCurrentSmpte());
    }
  };

  /**
   * Calls load on the player with asset.sourceConfig and updates the internal asset description
   */
  public load(asset: AssetDescription): Promise<void> {
    return this.player.load(asset.sourceConfig).then(() => {
      this.assetDescription = asset;
      this.hasBeenPlaying = false;
    }).catch((error) => {
      console.error('Could not load asset: ' + JSON.stringify(asset.sourceConfig));
      throw error;
    });
  }

  /**
   * Converts the given SMTPE timestamp to a time and calls seek on the wrapped player to the calculated time
   * @param {string} smpteString a string in the form of HH:MM:SS:FF
   * @throws {string} an error if the given SMPTE was invalid
   */
  public seekToSMPTE(smpteString: string): void {
    try {
      const smpte = new SmpteTimestamp(smpteString, this.assetDescription);
      const debugSmpte = smpte.toString();
      const targetTime = smpte.toAdjustedTime();
      console.debug('Seeking to SMTPE: ' + debugSmpte + ', calculated Time: ' + targetTime);
      this.player.seek(targetTime);
    }
    catch (error) {
      console.error('Error during converting smtpe to time: ' + error);
      throw error;
    }
  }

  /**
   * Queries the time of the wrapped player and converts it to the SMPTE format
   */
  public getCurrentSmpte(): string {
    const currentTime = this.player.getCurrentTime();
    return SmpteTimestamp.fromTimeWithAdjustments(currentTime, this.assetDescription).toString();
  }

  /**
   * Advances `stepSize` frames in the current video
   * @param {number} stepSize number of frames to step, if negative will step to previous frames
   */
  public step(stepSize: number): void {
    const smpte = new SmpteTimestamp(this.getCurrentSmpte(), this.assetDescription);
    if (smpte.minutes % 10 !== 0 && smpte.seconds === 0) {
      //  in the case of being around the dropped frame at step start we have to ignore the frameHoles
      smpte.addFrame(stepSize, false);
    } else {
      smpte.addFrame(stepSize, true);
    }
    this.seekToSMPTE(smpte.toString());
  }
}

/**
 * Information about the current asset needed for SMPTE adjustments
 */
class AssetDescription {

  /**
   * Name of the test asset
   */
  public name: string;
  /**
   * Source config to be loaded by the player
   */
  public sourceConfig: SourceConfig;
  /**
   * Number of frames per second
   */
  public framesPerSecond: number;
  /**
   * If the video has a non-integer frame number this value will be used to adjust the time, should be something
   * around 1001/1000 in the non-integer case
   */
  public adjustmentFactor: number;
  /**
   * A video with 29.97 frames skips 2 frames at each minute which is not a muliple of 10, if frames are skipped
   * this value should be non zero
   */
  public framesDroppedAtFullMinute: number;
  /**
   * Duration of a single frame in seconds
   */
  public frameDuration: number;
  /**
   * Adjustment to seek into the middle of the frame to not get stuck on the previous ones
   */
  public offsetToMidFrame: number;

  /**
   *
   * @param {string} name the name of the asset
   * @param {SourceConfig} sourceConfig the source for the player to load
   * @param {number} framesPerSecond number of frames in a second
   * @param {number} adjustmentFactor should be 1 for integer frame numbers, otherwise Math.ceil(fps)/fps. Needed for
   * adjustment of the player time
   * @param {number} framesDroppedAtFullMinute default: 0, in 29.98fps videos 2 frames are dopped each minute
   */
  constructor(name: string, sourceConfig: SourceConfig, framesPerSecond: number, adjustmentFactor?: number,
              framesDroppedAtFullMinute?: number) {
    this.name = name;
    this.sourceConfig = sourceConfig;
    this.framesPerSecond = framesPerSecond;
    this.adjustmentFactor = adjustmentFactor;
    this.framesDroppedAtFullMinute = framesDroppedAtFullMinute;

    if (adjustmentFactor == null) {
      this.adjustmentFactor = Math.ceil(framesPerSecond) / framesPerSecond;
    }
    if (framesDroppedAtFullMinute == null) {
      if (framesPerSecond === 29.97 || framesPerSecond === 29.98) {
        this.framesDroppedAtFullMinute = 2;
      }
      else {
        this.framesDroppedAtFullMinute = 0;
      }
    }
    this.frameDuration = 1 / this.framesPerSecond;
    // needed to not seek to the end of the previous frame but rather to the middle of the desired one
    this.offsetToMidFrame = (this.frameDuration / 2) / this.adjustmentFactor;
  }
}

interface SourceConfig {
  dash?: string;
  hls?: string;
  progressive?: string;
  smooth?: string;
}

class SmpteTimestamp {
  public frame: number;
  public seconds: number;
  public minutes: number;
  public hours: number;
  private assetDescription: AssetDescription;

  constructor(smtpeTimestamp: string | number, assetDescription: AssetDescription) {
    this.assetDescription = assetDescription;
    if (smtpeTimestamp && isFinite(smtpeTimestamp as number)) {
      let smpteValue: number = smtpeTimestamp as number;
      this.frame = smpteValue % 100;
      smpteValue = Math.floor(smpteValue / 100);
      this.seconds = smpteValue % 100;
      smpteValue = Math.floor(smpteValue / 100);
      this.minutes = smpteValue % 100;
      this.hours = Math.floor(smpteValue / 100);
    } else if (smtpeTimestamp && SmpteTimestamp.validateTimeStamp(smtpeTimestamp as string, assetDescription.framesPerSecond)) {
      const parts: string[] = (smtpeTimestamp as string).split(':');
      this.hours = Number(parts[0]);
      this.minutes = Number(parts[1]);
      this.seconds = Number(parts[2]);
      this.frame = Number(parts[3]);
    } else {
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.frame = 0;
    }
  }

  public static validateTimeStamp(smtpeTimestamp: string, framesPerSecond: number): boolean {
    // validate SMTPE timecode
    let isValidSMPTETimeCode = new RegExp(/(^(?:(?:[0-1][0-9]|[0-2][0-3]):)(?:[0-5][0-9]:){2}(?:[0-6][0-9])$)/);
    if (!isValidSMPTETimeCode.test(smtpeTimestamp)) {
      // invalid format
      throw smtpeTimestamp + ' does not match a SMPTE timecode HH:MM:SS:FF';
    }
    if (Number(smtpeTimestamp.split(':')[3]) >= framesPerSecond) {
      // frame portion of the input is higher than the FPS
      throw 'Frame Number in SMPTE is higher than FPS: ' + smtpeTimestamp;
    }
    return true;
  }

  private static padNum(num: number): string {
    if (num < 10) {
      return '0' + num;
    } else {
      return String(num);
    }
  }

  public toString(): string {
    return SmpteTimestamp.padNum(this.hours) + ':' + SmpteTimestamp.padNum(this.minutes) + ':' +
      SmpteTimestamp.padNum(this.seconds) + ':' + SmpteTimestamp.padNum(this.frame);
  }

  public toTime(): number {
    let timeInSeconds = this.hours * 3600 + this.minutes * 60 + this.seconds;

    // convert frame number to time and add it
    timeInSeconds += this.frame * this.assetDescription.frameDuration;

    return timeInSeconds;
  }

  public toAdjustedTime(): number {
    // take dropped frames around every full minute (except for every 10minutes) into account
    if (this.assetDescription.framesDroppedAtFullMinute > 0) {
      const totalMinutes = this.hours * 60 + this.minutes;
      let framesToAdd = totalMinutes - Math.floor(totalMinutes / 10);
      framesToAdd *= this.assetDescription.framesDroppedAtFullMinute;
      this.addFrame(-framesToAdd, false);
    }

    let targetTime = this.toTime() * this.assetDescription.adjustmentFactor;
    targetTime += this.assetDescription.offsetToMidFrame;
    targetTime = Math.floor(targetTime * 1000) / 1000;
    return targetTime;
  }

  public static fromString(smtpeTimestamp: string, assetDescription: AssetDescription): SmpteTimestamp {
    return new SmpteTimestamp(smtpeTimestamp, assetDescription);
  }

  public static fromTime(timestamp: number, assetDesc: AssetDescription): SmpteTimestamp {
    // to get to the start of the actual frame... use this
    let tmp = timestamp;

    const retVal = new SmpteTimestamp(null, assetDesc);
    retVal.hours = Math.floor(tmp / 3600);
    tmp -= retVal.hours * 3600;

    retVal.minutes = Math.floor(tmp / 60);
    tmp -= retVal.minutes * 60;

    retVal.seconds = Math.floor(tmp);
    tmp -= retVal.seconds;

    retVal.frame = Math.floor(tmp / assetDesc.frameDuration);

    return retVal;
  }

  public static fromTimeWithAdjustments(timestamp: number, assetDesc: AssetDescription): SmpteTimestamp {
    let time = timestamp / assetDesc.adjustmentFactor;
    const smtpe = SmpteTimestamp.fromTime(time, assetDesc);

    if (assetDesc.framesDroppedAtFullMinute > 0) {
      let numMinutesWithDroppedFrames: number = smtpe.minutes + (smtpe.hours * 60);
      // no frames dropped at every 10 minutes
      numMinutesWithDroppedFrames -= Math.floor(numMinutesWithDroppedFrames / 10);

      let framesToAdd = numMinutesWithDroppedFrames * assetDesc.framesDroppedAtFullMinute;

      const minutesBefore = smtpe.minutes;
      smtpe.addFrame(framesToAdd, false);
      if (smtpe.minutes % 10 !== 0 && minutesBefore !== smtpe.minutes) {
        smtpe.addFrame(assetDesc.framesDroppedAtFullMinute, false);
      }
    }

    return smtpe;
  }

  public addFrame(framesToAdd: number, fixFrameHoles: boolean = true): void {
    this.frame += framesToAdd;
    let overflow;
    [this.frame, overflow] = SmpteTimestamp.fitIntoRange(this.frame, Math.ceil(this.assetDescription.framesPerSecond));

    if (overflow !== 0) {
      this.addSeconds(overflow);
    }

    // make sure we dont step into a frame hole
    if (fixFrameHoles && this.assetDescription.framesDroppedAtFullMinute > 0 && this.minutes % 10 !== 0) {
      if (framesToAdd > 0 && this.seconds === 0) {
        this.addFrame(this.assetDescription.framesDroppedAtFullMinute, false);
      }
    }
  }

  public addSeconds(secondsToAdd: number): void {
    this.seconds += secondsToAdd;
    let overflow;
    [this.seconds, overflow] = SmpteTimestamp.fitIntoRange(this.seconds, 60);
    if (overflow !== 0) {
      this.addMinute(overflow);
    }
  }

  public addMinute(minutesToAdd: number): void {
    this.minutes += minutesToAdd;
    let overflow;
    [this.minutes, overflow] = SmpteTimestamp.fitIntoRange(this.minutes, 60);
    if (overflow !== 0) {
      this.addHour(overflow);
    }
  }

  public addHour(hoursToAdd: number): void {
    this.hours += hoursToAdd;
    if (this.hours < 0) {
      console.log('Cannot go further back');
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.frame = 0;
    }
  }

  private static fitIntoRange(toFit: number, range: number): [number, number] {
    let overflow = 0;
    if (toFit < 0) {
      while (toFit < 0) {
        overflow--;
        toFit += range;
      }
    } else if (toFit >= range) {
      while (toFit >= range) {
        overflow ++;
        toFit -= range;
      }
    }

    return [toFit, overflow];
  }
}