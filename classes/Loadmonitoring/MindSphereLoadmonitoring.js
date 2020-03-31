const Storage = require("../Storage/Storage");
const { exists } = require("../../utilities/utilities");
const Loadmonitoring = require("./Loadmonitoring");

class MindSphereLoadmonitoring extends Loadmonitoring {
  // #region Properties

  // #endregion Properties

  // #region PublicMethods

  /**
   * @description Class for loadmonitoring mechanism for MindSphere
   * @param {Storage} storage Storage for storing loadmonitoring data
   */
  constructor(storage) {
    super(storage);
  }

  // #endregion PublicMethods

  // #region PrivateMethods

  // #endregion PrivateMethods

  // #region Virtual

  /**
   * @description Method for generating Payload of loadmonitoring
   */
  vGeneratePayload() {
    return super.vGeneratePayload();
  }

  /**
   * @description Method for generating Payload of storing loadmonitoring
   */
  vGenerateStoragePayload() {
    return super.vGenerateStoragePayload();
  }

  /**
   * @description Method invoked on initializing loadmonitoring
   */
  async vOnInit() {}

  /**
   * @description Method invoked when period changes to new one
   * @param {Boolean} oldPeriodValid was old period closed properly
   * @param {Date} oldPeriodBeginDate date of the begining of old period
   * @param {Date} oldPeriodEndDate  date of the ending of old period
   * @param {Date} newPeriodBeginDate date of the begining of new period
   * @param {Date} newPeriodEndDate date of the ending of new period
   */
  async vOnPeriodChange(
    oldPeriodValid,
    oldPeriodBeginDate,
    oldPeriodEndDate,
    newPeriodBeginDate,
    newPeriodEndDate
  ) {}

  /**
   * @description Method invoked when period has been closed properly
   * @param {Date} periodBeginDate Date of begining of the period
   * @param {Date} periodEndDate Date of ending of the period
   * @param {Number} averagePower Average power of closed period
   */
  async vOnValidPeriodClose(periodBeginDate, periodEndDate, averagePower) {}

  /**
   * @description Method invoked when step changes to new one
   * @param {Date} oldStepBeginDate date of the begining of old step
   * @param {Date} oldStepEndDate date of the ending of old step
   * @param {Date} newStepBeginDate date of the begining of new step
   * @param {Date} newStepEndDate date of the ending of new step
   */
  async vOnStepChange(
    oldStepBeginDate,
    oldStepEndDate,
    newStepBeginDate,
    newStepEndDate
  ) {}

  /**
   * @description Method invoked when alert is activated
   * @param {Number} alertLimit Limit of an alert
   * @param {Number} predictedPower value of 15-min precited active power
   */
  async vOnAlertActivation(alertLimit, predictedPower) {}

  /**
   * @description Method invoked when alert is deactivated
   * @param {Number} alertLimit Limit of an alert
   * @param {Number} predictedPower value of 15-min precited active power
   */
  async vOnAlertDeactivation(alertLimit, predictedPower) {}

  /**
   * @description Method invoked when warning is activated
   * @param {Number} warningLimit Limit of an warning
   * @param {Number} predictedPower value of 15-min precited active power
   */
  async vOnWarningActivation(warningLimit, predictedPower) {}

  /**
   * @description Method invoked when warning is deactivated
   * @param {Number} warningLimit Limit of an warning
   * @param {Number} predictedPower value of 15-min precited active power
   */
  async vOnWarningDeactivation(warningLimit, predictedPower) {}

  /**
   * @description Method invoked when transgression came
   * @param {Date} periodBeginDate Date of the begining of the current period
   * @param {Date} periodEndDate Date of the ending of the current period
   * @param {Date} alertLimit Value of alert limit
   * @param {Date} predictedPower Value of 15-min precited active power
   */
  async vOnTransgression(
    periodBeginDate,
    periodEndDate,
    alertLimit,
    predictedPower
  ) {}

  // #endregion Virtual

  // #region Abstract

  /**
   * @description Method for gathering data of historical energy counter value - with 1 minute intervals!
   * @param {Number} periodBeginDate Unix time of the begining of current
   * @param {Number} periodEndDate Unix time of the ending of current
   */
  async aGetLoadmonitoringData(periodBeginDate, periodEndDate) {
    //Get data from MindSphere here!!
    //Method should return valid payload like:
    /*
      {
          initialCounterValue : 1234567,
          
          counters : {
            12345670 : 0,
            12345671 : 10,
            12345672 : 20,
            12345673 : 30,
            12345674 : 40,
            12345675 : 50,
            12345676 : 60,
            12345677 : 70,
            ...
          }
      } 
     */
  }

  // #endregion
}

module.exports = Loadmonitoring;
