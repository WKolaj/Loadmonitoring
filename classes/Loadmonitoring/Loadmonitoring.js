const Storage = require("../Storage/Storage");
const { exists } = require("../../utilities/utilities");

class Loadmonitoring {
  // #region Properties

  /**
   * @description Payload for loadmonitoring
   */
  get Payload() {
    return this.vGeneratePayload();
  }

  /**
   * @description Payload for loadmonitoring to store
   */
  get StoragePayload() {
    return this.vGenerateStoragePayload();
  }

  /**
   * @description Storage for load monitoring
   */
  get Storage() {
    return this._storage;
  }

  /**
   * @description Has Loadmonitoring been initialized
   */
  get Initialized() {
    return this._initialized;
  }

  /**
   * @description Is Loadmonitoring enabled (enabled for calculating but not necessarily started calculating)
   */
  get Enabled() {
    return this._enabled;
  }

  /**
   * @description Is Loadmonitoring active - monitors actual 15-min interval
   */
  get Active() {
    return this._active;
  }

  /**
   * @description Is warning activated
   */
  get Warning() {
    return this._warning;
  }

  /**
   * @description Is alert activated
   */
  get Alert() {
    return this._alert;
  }

  /**
   * @description Begin date of current period
   */
  get CurrentPeriodBeginDate() {
    return this._currentPeriodBeginDate;
  }

  /**
   * @description Begin date of the end of the period
   */
  get CurrentPeriodEndDate() {
    return this._currentPeriodEndDate;
  }

  /**
   * @description Energy value at the begining of the current period
   */
  get CurrentPeriodBeginEnergy() {
    return this._currentPeriodBeginEnergy;
  }

  /**
   * @description Predicted energy value at the end of current period
   */
  get CurrentPeriodEndPredictedEnergy() {
    return this._currentPeriodEndPredictedEnergy;
  }

  /**
   * @description Predicted power value at the end of current period
   */
  get CurrentPeriodEndPredictedPower() {
    return this._currentPeriodEndPredictedPower;
  }

  /**
   * @description Values of counters (including powerlosses) of current period
   */
  get CurrentPeriodCounterValues() {
    return this._currentPeriodCounterValues;
  }

  /**
   * @description Values of 1-min average powers (including powerlosses) of current period
   */
  get CurrentPeriodPowerValues() {
    return this._currentPeriodPowerValues;
  }

  /**
   * @description Predicted values of counters (including powerlosses) of current period
   */
  get CurrentPeriodPredictedCounterValues() {
    return this._currentPeriodPredictedCounterValues;
  }

  /**
   * @description Average active power for previous time period
   */
  get LastPeriodAveragePower() {
    return this._lastPeriodAveragePower;
  }

  /**
   * @description Begining date of current step
   */
  get CurrentStepBeginDate() {
    return this._currentStepBeginDate;
  }

  /**
   * @description Energy value on the begining of current step
   */
  get CurrentStepBeginEnergy() {
    return this._currentStepBeginEnergy;
  }

  /**
   * @description End date of current step
   */
  get CurrentStepEndDate() {
    return this._currentStepEndDate;
  }

  /**
   * @description Average power of last step
   */
  get LastStepAveragePower() {
    return this._lastStepAveragePower;
  }

  /**
   * @description Data of current loadmonitoring time interval
   */
  get CurrentLoadmonitoringData() {
    return this._currentLoadmonitoringData;
  }

  /**
   * @description Warning limit for active power
   */
  get WarningLimitPower() {
    return this._warningLimitPower;
  }

  /**
   * @description Warning limit for active energy - on the end of 15-min period
   */
  get WarningLimitEnergy() {
    return this._warningLimitEnergy;
  }

  /**
   * @description Alert limit for active power
   */
  get AlertLimitPower() {
    return this._alertLimitPower;
  }

  /**
   * @description Alert limit for active energy - on the end of 15-min period
   */
  get AlertLimitEnergy() {
    return this._alertLimitEnergy;
  }

  /**
   * @description Simulated power losses of transformers
   */
  get LossesPower() {
    return this._lossesPower;
  }

  /**
   * @description Energy losses of transfomers per whole 15-min period
   */
  get LossesEnergyPerPeriod() {
    return this._lossesEnergyPerPeriod;
  }

  /**
   * @description Energy losses of transfomers per 1-min step
   */
  get LossesEnergyPerStep() {
    return this._lossesEnergyPerStep;
  }

  // #endregion

  // #region PublicMethods

  /**
   * @description Base class for loadmonitoring mechanism
   * @param {Storage} storage Storage for storing loadmonitoring data
   */
  constructor(storage) {
    this._storage = storage;
    this._initialized = false;
    this._enabled = false;
    this._warning = false;
    this._alert = false;
    this._active = false;
    this._warningLimitPower = 0;
    this._warningLimitEnergy = 0;
    this._alertLimitPower = 0;
    this._alertLimitEnergy = 0;
    this._lossesPower = 0;
    this._lossesEnergyPerPeriod = 0;
    this._lossesEnergyPerStep = 0;
    this.logger = console;
  }

  /**
   * @description Method for starting loadmonitoring
   */
  async start() {
    if (!this.Initialized)
      throw new Error("Loadmonitoring has not been initialized!");

    this._enabled = true;

    await this._save();
  }

  /**
   * @description Method for stopping loadmonitoring
   */
  async stop() {
    if (!this.Initialized)
      throw new Error("Loadmonitoring has not been initialized!");

    this._enabled = false;
    this._active = false;

    await this._save();
  }

  /**
   * @description Method for initializing
   */
  async init() {
    //Throwing if already initialized
    if (this.Initialized)
      throw new Error("Loadmonitoring has already been initialized!");

    let storageContent = await this.Storage.load();

    if (exists(storageContent.alert)) this._alert = storageContent.alert;

    if (exists(storageContent.warning)) this._warning = storageContent.warning;

    if (exists(storageContent.warningLimitPower))
      this._warningLimitPower = storageContent.warningLimitPower;

    if (exists(storageContent.warningLimitEnergy))
      this._warningLimitEnergy = storageContent.warningLimitEnergy;

    if (exists(storageContent.alertLimitPower))
      this._alertLimitPower = storageContent.alertLimitPower;

    if (exists(storageContent.alertLimitEnergy))
      this._alertLimitEnergy = storageContent.alertLimitEnergy;

    if (exists(storageContent.lossesPower))
      this._setPowerLosses(storageContent.lossesPower);

    this._initialized = true;

    //Starting in case of enabled set to true
    if (exists(storageContent.enabled) && storageContent.enabled)
      await this.start();

    await this.vOnInit();
  }

  /**
   * @description Method for checking if load monitoring coounters are valid (Method can be used inside child classes in getLoadmonitoringData)
   */
  checkCountersData(loadmonitoringCounters) {
    try {
      if (!exists(loadmonitoringCounters)) return false;

      //Checking if there at least one value exists
      if (Object.keys(loadmonitoringCounters).length <= 0) return false;

      //Getting all parsed and sorted unix times
      let allUnixTimes = Object.keys(loadmonitoringCounters)
        .map(key => Number(key))
        .sort((a, b) => a - b);

      //Checking if there is more than 15 values in data
      if (allUnixTimes.length > 15) return false;

      //Getting period values of first element
      let periodAndStepDatesOfCurrentPeriod = this._getPeriodAndStepFromDate(
        new Date(allUnixTimes[0])
      );

      //Checking if first key is valid begining of period
      if (
        allUnixTimes[0] !==
        periodAndStepDatesOfCurrentPeriod.periodBeginDate.getTime()
      )
        return false;

      //Checking if every key if it is valid step begin value and if it is associated current period
      for (let i = 1; i < allUnixTimes.length; i++) {
        let unixTime = allUnixTimes[i];
        let periodAndStepDates = this._getPeriodAndStepFromDate(
          new Date(unixTime)
        );
        //Checking if it is valid step begin date
        if (periodAndStepDates.stepBeginDate.getTime() !== unixTime)
          return false;

        //Checking if it is associated with current period
        if (
          periodAndStepDates.periodBeginDate.getTime() !==
          periodAndStepDatesOfCurrentPeriod.periodBeginDate.getTime()
        )
          return false;
      }

      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }

  /**
   * @description Method for refreshing loadmonitoring
   * @param {Date} currentDate Current date
   */
  async refresh(currentDate) {
    //Returning if not enabled or not initialized
    if (!this.Enabled) return;
    if (!this.Initialized) return;
    //Getting step and period ranges
    let stepAndPeriodRange = this._getPeriodAndStepFromDate(currentDate);

    //Getting current loadmonitoring data
    let loadmonitoringData = await this.aGetLoadmonitoringData(
      stepAndPeriodRange.periodBeginDate,
      stepAndPeriodRange.periodEndDate
    );

    //Returning if loadmonitoring data is not valid
    if (!this._checkLoadmonitoringData(loadmonitoringData)) {
      this._active = false;
      return;
    }
    //If loadmonitoring data is valid - set data to active
    this._active = true;

    //Returning if loadmonitoring data date is not valid
    if (!this._checkLoadmonitoringDataDate(currentDate, loadmonitoringData))
      return;

    //Changing period if it should be changed
    if (
      this._shouldChangePeriod(
        currentDate,
        this.CurrentPeriodBeginDate,
        this.CurrentPeriodEndDate
      )
    ) {
      await this._changePeriod(loadmonitoringData);
    }
    //Changing step if it should be changed
    else if (
      this._shouldChangeStep(
        currentDate,
        this.CurrentStepBeginDate,
        this.CurrentStepEndDate
      )
    ) {
      await this._changeStep(loadmonitoringData);
    }

    //Checking limits if something is above or below
    await this._checkLimits();
  }

  // #endregion

  // #region PrivateMethods

  /**
   * @description Method for setting power losses to loadmonitoring
   * @param {number} powerLosses Power losses of the transformer
   */
  _setPowerLosses(powerLosses) {
    this._lossesPower = powerLosses;
    this._lossesEnergyPerPeriod = powerLosses / 4;
    this._lossesEnergyPerStep = powerLosses / 60;
  }

  /**
   * @description Method for saving storage payload to storage
   */
  async _save() {
    try {
      await this.Storage.save(this.StoragePayload);
    } catch (err) {
      this.logger.error(err.message, err);
    }
  }

  /**
   * @description Method for generating period and step begin and end date based on given date
   */
  _getPeriodAndStepFromDate(date) {
    if (!exists(date)) throw new Error("Date does not exist");
    if (!(date instanceof Date))
      throw new Error(`Given object ${date} is not a valid Date`);

    let unixTime = date.getTime();
    let unixPeriodRest = date % (15 * 60 * 1000);
    let unixStepRest = date % (1 * 60 * 1000);

    return {
      periodBeginDate: new Date(unixTime - unixPeriodRest),
      periodEndDate: new Date(unixTime - unixPeriodRest + 15 * 60 * 1000),
      stepBeginDate: new Date(unixTime - unixStepRest),
      stepEndDate: new Date(unixTime - unixStepRest + 1 * 60 * 1000)
    };
  }

  /**
   * @description Method for checking if load monitoring data is valid to start new period
   */
  _checkLoadmonitoringData(loadmonitoringData) {
    try {
      if (!exists(loadmonitoringData)) return false;

      if (!exists(loadmonitoringData.initialCounterValue)) return false;

      if (isNaN(loadmonitoringData.initialCounterValue)) return false;

      if (!exists(loadmonitoringData.counters)) return false;

      //Checking if there at least one value exists
      if (Object.keys(loadmonitoringData.counters).length <= 0) return false;

      //Getting all parsed and sorted unix times
      let allUnixTimes = Object.keys(loadmonitoringData.counters)
        .map(key => Number(key))
        .sort((a, b) => a - b);

      //Checking if there is more than 15 values in data
      if (allUnixTimes.length > 15) return false;

      //Checking if first value has value of 0
      if (loadmonitoringData.counters[allUnixTimes[0]] !== 0) return false;

      //Getting period values of first element
      let periodAndStepDatesOfCurrentPeriod = this._getPeriodAndStepFromDate(
        new Date(allUnixTimes[0])
      );

      //Checking if first key is valid begining of period
      if (
        allUnixTimes[0] !==
        periodAndStepDatesOfCurrentPeriod.periodBeginDate.getTime()
      )
        return false;

      //Checking if every key if it is valid step begin value and if it is associated current period
      for (let i = 1; i < allUnixTimes.length; i++) {
        let unixTime = allUnixTimes[i];
        let periodAndStepDates = this._getPeriodAndStepFromDate(
          new Date(unixTime)
        );
        //Checking if it is valid step begin date
        if (periodAndStepDates.stepBeginDate.getTime() !== unixTime)
          return false;

        //Checking if it is associated with current period
        if (
          periodAndStepDates.periodBeginDate.getTime() !==
          periodAndStepDatesOfCurrentPeriod.periodBeginDate.getTime()
        )
          return false;
      }

      //Checking if all values are given correctly (as Number and ordered ascending)
      for (let i = 1; i < allUnixTimes.length; i++) {
        let unixTime = allUnixTimes[i];
        let previousUnixTime = allUnixTimes[i - 1];
        let value = loadmonitoringData.counters[unixTime];
        let previousValue = loadmonitoringData.counters[previousUnixTime];

        //Checking if value is a number
        if (isNaN(value)) return false;

        //Checking if values are sorted in ascending order
        if (value < previousValue) return false;
      }

      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }

  /**
   * @description Method for checking if load monitoring data date is valid
   */
  _checkLoadmonitoringDataDate(actualDate, loadmonitoringData) {
    try {
      //Checking if there at least one value exists
      if (Object.keys(loadmonitoringData.counters).length <= 0) return false;

      //Getting all parsed and sorted unix times
      let allUnixTimes = Object.keys(loadmonitoringData.counters)
        .map(key => Number(key))
        .sort((a, b) => a - b);

      let periodAndStepDateFromActualDate = this._getPeriodAndStepFromDate(
        actualDate
      );

      let periodAndStepDateFromLoadmonitoringData = this._getPeriodAndStepFromDate(
        new Date(allUnixTimes[0])
      );

      if (
        periodAndStepDateFromActualDate.periodBeginDate.getTime() !==
        periodAndStepDateFromLoadmonitoringData.periodBeginDate.getTime()
      )
        return false;

      if (
        periodAndStepDateFromActualDate.periodEndDate.getTime() !==
        periodAndStepDateFromLoadmonitoringData.periodEndDate.getTime()
      )
        return false;

      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }

  /**
   * @description Method determining wether actual date should change current period or not
   * @param {Date} actualDate
   * @param {Date} periodBeginDate
   * @param {Date} periodEndDate
   */
  _shouldChangePeriod(actualDate, periodBeginDate, periodEndDate) {
    return actualDate < periodBeginDate || actualDate >= periodEndDate;
  }

  /**
   * @description Method determining wether current period can be closed properly
   * @param {Date} actualPeriodEndDate
   * @param {Date} newPeriodBeginDate
   * @param {Date} actualPeriodBeginEnergy
   */
  _canActualPeriodBeClosedProperly(loadmonitoringData) {
    if (!exists(this.CurrentPeriodBeginDate)) return false;
    if (!exists(this.CurrentPeriodBeginEnergy)) return false;
    if (!exists(this.CurrentPeriodEndDate)) return false;
    if (!exists(loadmonitoringData)) return false;
    if (!exists(loadmonitoringData.counters)) return false;
    if (!exists(this.CurrentLoadmonitoringData)) return false;
    if (!exists(this.CurrentLoadmonitoringData.counters)) return false;

    //Checking if there are at least one counter in new loadmonitoringData
    let newUnixTimesLength = Object.keys(loadmonitoringData.counters).length;
    if (newUnixTimesLength <= 0) return false;

    //Checking if there are at least one counter in current loadmonitoringData
    let actualUnixTimesLength = Object.keys(
      this.CurrentLoadmonitoringData.counters
    ).length;
    if (actualUnixTimesLength <= 0) return false;

    //Getting first counter unix time
    let newPeriodBeginDate = Object.keys(loadmonitoringData.counters)
      .map(key => Number(key))
      .sort((a, b) => a - b)[0];

    return this.CurrentPeriodEndDate.getTime() === newPeriodBeginDate;
  }

  /**
   * @description Method determining wether actual date should change current step or not
   * @param {Date} actualDate
   * @param {Date} stepBeginDate
   * @param {Date} stepEndDate
   */
  _shouldChangeStep(actualDate, stepBeginDate, stepEndDate) {
    if (!exists(stepBeginDate) || !exists(stepEndDate)) return false;
    return actualDate < stepBeginDate || actualDate >= stepEndDate;
  }

  /**
   * @description Method for getting last step unixTime and value
   * @param {Object} counters Data of loadmonitoring
   */
  _getLastStepValues(counters) {
    if (!exists(counters)) return {};
    if (Object.keys(counters).length <= 0) return {};

    //Getting all parsed and sorted unix times
    let allUnixTimes = Object.keys(counters)
      .map(key => Number(key))
      .sort((a, b) => a - b);

    let lastUnixTime = allUnixTimes[allUnixTimes.length - 1];
    let lastCounterValue = counters[lastUnixTime];

    return {
      [lastUnixTime]: lastCounterValue
    };
  }

  /**
   * @description Method for generatring all remaining steps (including first one that exists)
   * @param {Date} periodEndDate End date of period
   * @param {Date} lastStepBeginDate Begin date of last step
   */
  _getRemainingStepsUnixTimes(periodEndDate, lastStepBeginDate) {
    let stepsToReturn = [];
    let currentStepUnixTime = lastStepBeginDate.getTime();
    let stepDelta = 1 * 60 * 1000;

    while (currentStepUnixTime <= periodEndDate) {
      stepsToReturn.push(currentStepUnixTime);
      currentStepUnixTime += stepDelta;
    }

    return stepsToReturn;
  }

  /**
   * @description Method for generatring all predicted remaining steps
   */
  _getPredictedRemainingSteps(
    lastStepActivePower,
    actualStepBeginActiveEnergy,
    actualStepBeginDate,
    actualPeriodEndDate
  ) {
    let remainingPredictedSteps = {};

    let allRemainingSteps = this._getRemainingStepsUnixTimes(
      actualPeriodEndDate,
      actualStepBeginDate
    );

    for (let i = 0; i < allRemainingSteps.length; i++) {
      let unixStepTime = allRemainingSteps[i];

      let predictedStepConsumption = i * (lastStepActivePower / 60);

      remainingPredictedSteps[unixStepTime] =
        actualStepBeginActiveEnergy + predictedStepConsumption;
    }

    return remainingPredictedSteps;
  }

  /**
   * @description Method for getting counter values including power losses
   * @param {Object} loadmonitoringData Loadmonitoring data including counter values without losses
   * @param {Number} energyLossesPerStep Value of energy loss per 1-min step
   */
  _getCounterValuesIncludingPowerLosses(
    loadmonitoringData,
    energyLossesPerStep
  ) {
    if (!exists(loadmonitoringData)) return {};
    if (!exists(loadmonitoringData.counters)) return {};

    let allTimes = Object.keys(loadmonitoringData.counters);
    if (allTimes.length <= 0) return {};

    let allUnixTimes = Object.keys(loadmonitoringData.counters)
      .map(key => Number(key))
      .sort((a, b) => a - b);

    let periodBeginUnixTime = allUnixTimes[0];

    let countersToReturn = {};

    for (let i = 0; i < allUnixTimes.length; i++) {
      let actualStepUnixTime = allUnixTimes[i];

      let timeDiffInMinutes =
        (actualStepUnixTime - periodBeginUnixTime) / (60 * 1000);

      countersToReturn[actualStepUnixTime] =
        loadmonitoringData.counters[actualStepUnixTime] +
        timeDiffInMinutes * energyLossesPerStep;
    }

    return countersToReturn;
  }

  /**
   * @description Method for converting values of consumption to average powers per 1min period
   * @param {Number} counterValues values of consumption
   */
  _convertCounterValuesToPowerValues(counterValues) {
    if (!exists(counterValues)) return {};

    let allTimes = Object.keys(counterValues);
    if (allTimes.length <= 0) return {};

    let powerValuesToReturn = {};

    let allCounterUnixTimes = Object.keys(counterValues)
      .map(key => Number(key))
      .sort((a, b) => a - b);

    for (let i = 1; i < allCounterUnixTimes.length; i++) {
      let actualCounterUnixTime = allCounterUnixTimes[i];
      let actualCounterValue = counterValues[actualCounterUnixTime];
      let previousCounterUnixTime = allCounterUnixTimes[i - 1];
      let previousCounterValue = counterValues[previousCounterUnixTime];

      let actualPowerValue =
        (actualCounterValue - previousCounterValue) /
        ((actualCounterUnixTime - previousCounterUnixTime) / (60 * 60 * 1000));

      powerValuesToReturn[actualCounterUnixTime] = actualPowerValue;
    }

    return powerValuesToReturn;
  }

  /**
   * @description Method for closing actual period
   * @param {Object} loadmonitoringData loadmonitoring data
   */
  async _closeActualPeriod(loadmonitoringData) {
    let actualPeriodEndEnergy = loadmonitoringData.initialCounterValue;

    //Setting to 0 all properties
    this._currentPeriodCounterValues = {};
    this._currentPeriodPowerValues = {};
    this._currentPeriodPredictedCounterValues = {};

    //Calculating everage 15 min power from actual period and setting it as predicted power, last period average power
    let average15MinPower =
      (actualPeriodEndEnergy - this.CurrentPeriodBeginEnergy) * 4 +
      this.LossesPower;
    this._lastPeriodAveragePower = average15MinPower;
    this._lastStepAveragePower = average15MinPower;
    this._currentPeriodEndPredictedPower = average15MinPower;

    //Calling  onTransgression in case of a transgression
    if (average15MinPower > this.AlertLimitPower)
      await this.vOnTransgression(
        this.CurrentPeriodBeginDate,
        this.CurrentPeriodEndDate,
        this.AlertLimitPower,
        average15MinPower
      );
  }

  /**
   * @description Method to perform loadmonitoring calculation based on loadmonitoring data
   * @param {Object} loadmonitoringData loadmonitoring data
   */
  _calculateLoadmonitoring(loadmonitoringData) {
    this._currentLoadmonitoringData = loadmonitoringData;

    let lastStepLoadmonitoringData = this._getLastStepValues(
      loadmonitoringData.counters
    );

    //Getting new period begin Date
    let lastStepBeginTime = Number(Object.keys(lastStepLoadmonitoringData)[0]);

    //All ranges can be get on the basis of the latest counter date
    let periodAndStepRange = this._getPeriodAndStepFromDate(
      new Date(lastStepBeginTime)
    );

    //Setting actual Period date and energy
    this._currentPeriodBeginDate = periodAndStepRange.periodBeginDate;
    this._currentPeriodEndDate = periodAndStepRange.periodEndDate;
    this._currentPeriodBeginEnergy = loadmonitoringData.initialCounterValue;

    //Setting actual Step date
    this._currentStepBeginDate = periodAndStepRange.stepBeginDate;
    this._currentStepEndDate = periodAndStepRange.stepEndDate;

    //Setting actual period counter values (including power losses)
    this._currentPeriodCounterValues = this._getCounterValuesIncludingPowerLosses(
      loadmonitoringData,
      this.LossesEnergyPerStep
    );

    //Setting actual step energy data (including power losses)
    this._currentStepBeginEnergy = this.CurrentPeriodCounterValues[
      lastStepBeginTime
    ];

    //Setting actual period power values (including power losses)
    this._currentPeriodPowerValues = this._convertCounterValuesToPowerValues(
      this.CurrentPeriodCounterValues
    );

    //Setting last step average power - depenind of it is a first step or later step
    if (Object.keys(this._currentPeriodPowerValues).length < 1) {
      //First step - setting step average power from previous period
      this._lastStepAveragePower = this.LastPeriodAveragePower;
    } else {
      //Later step - getting propert value of last step power value
      let lastStepPowerData = this._getLastStepValues(
        this.CurrentPeriodPowerValues
      );
      this._lastStepAveragePower = Object.values(lastStepPowerData)[0];
    }

    //Setting predicted counter values
    let predictedCounterValues = this._getPredictedRemainingSteps(
      this.LastStepAveragePower,
      this.CurrentStepBeginEnergy,
      this.CurrentStepBeginDate,
      this.CurrentPeriodEndDate
    );
    this._currentPeriodPredictedCounterValues = predictedCounterValues;

    //Setting current period end predicted energy as a last predicted value
    let lastPredictedEnergy = this._getLastStepValues(
      this.CurrentPeriodPredictedCounterValues
    );

    this._currentPeriodEndPredictedEnergy = Object.values(
      lastPredictedEnergy
    )[0];

    //Setting current period predicted power on the basis of predicted energy
    this._currentPeriodEndPredictedPower =
      this.CurrentPeriodEndPredictedEnergy * 4;
  }

  /**
   * @description Method for opening new period
   * @param {Object} loadmonitoringData loadmonitoring data
   */
  async _openNewPeriod(loadmonitoringData) {
    this._calculateLoadmonitoring(loadmonitoringData);
  }

  /**
   * @description Method for changing actual period
   * @param {Object} loadmonitoringData loadmonitoring data
   */
  async _changePeriod(loadmonitoringData) {
    let oldStepBeginDate = this.CurrentStepBeginDate;
    let oldStepEndDate = this.CurrentStepEndDate;
    let oldPeriodBeginDate = this.CurrentPeriodBeginDate;
    let oldPeriodEndDate = this.CurrentPeriodEndDate;

    let canPeriodBeClosedProperly = this._canActualPeriodBeClosedProperly(
      loadmonitoringData
    );

    if (canPeriodBeClosedProperly) {
      await this._closeActualPeriod(loadmonitoringData);
      await this.vOnValidPeriodClose(
        oldPeriodBeginDate,
        oldPeriodEndDate,
        this.LastPeriodAveragePower
      );
    } else {
      //Step cannot be closed properly - setting all parameters on which depends futher calculations to 0
      this._lastPeriodAveragePower = 0;
    }

    await this._openNewPeriod(loadmonitoringData);

    await this.vOnStepChange(
      oldStepBeginDate,
      oldStepEndDate,
      this.CurrentStepBeginDate,
      this.CurrentStepEndDate
    );

    await this.vOnPeriodChange(
      canPeriodBeClosedProperly,
      oldPeriodBeginDate,
      oldPeriodEndDate,
      this.CurrentPeriodBeginDate,
      this.CurrentPeriodEndDate
    );
  }

  /**
   * @description Method for changing step to new one - recalculating loadmonitoring
   * @param {Object} loadmonitoringData Loadmonitoring data
   */
  async _changeStep(loadmonitoringData) {
    let oldStepBeginDate = this.CurrentStepBeginDate;
    let oldStepEndDate = this.CurrentStepEndDate;

    this._calculateLoadmonitoring(loadmonitoringData);

    await this.vOnStepChange(
      oldStepBeginDate,
      oldStepEndDate,
      this.CurrentStepBeginDate,
      this.CurrentStepEndDate
    );
  }

  async _checkLimits() {
    if (this.Warning) {
      if (this.CurrentPeriodEndPredictedPower <= this.WarningLimitPower) {
        this._warning = false;
        await this.vOnWarningDeactivation(
          this.WarningLimitPower,
          this.CurrentPeriodEndPredictedPower
        );
      }
    } else {
      if (this.CurrentPeriodEndPredictedPower > this.WarningLimitPower) {
        this._warning = true;
        await this.vOnWarningActivation(
          this.WarningLimitPower,
          this.CurrentPeriodEndPredictedPower
        );
      }
    }

    if (this.Alert) {
      if (this.CurrentPeriodEndPredictedPower <= this.AlertLimitPower) {
        this._alert = false;
        await this.vOnAlertDeactivation(
          this.AlertLimitPower,
          this.CurrentPeriodEndPredictedPower
        );
      }
    } else {
      if (this.CurrentPeriodEndPredictedPower > this.AlertLimitPower) {
        this._alert = true;
        await this.vOnAlertActivation(
          this.AlertLimitPower,
          this.CurrentPeriodEndPredictedPower
        );
      }
    }
  }

  // #endregion

  // #region Virtual

  /**
   * @description Method for generating Payload of loadmonitoring
   */
  vGeneratePayload() {
    return {
      enabled: this.Enabled,
      warning: this.Warning,
      alert: this.Alert,
      active: this.Active,
      currentPeriodBeginDate: this.CurrentPeriodBeginDate,
      currentPeriodEndDate: this.CurrentPeriodEndDate,
      currentPeriodBeginEnergy: this.CurrentPeriodBeginEnergy,
      currentPeriodEndPredictedEnergy: this.CurrentPeriodEndPredictedEnergy,
      currentPeriodEndPredictedPower: this.CurrentPeriodEndPredictedPower,
      currentPeriodCounterValues: this.CurrentPeriodCounterValues,
      currentPeriodPowerValues: this.CurrentPeriodPowerValues,
      currentPeriodPredictedCounterValues: this
        .CurrentPeriodPredictedCounterValues,
      lastPeriodAveragePower: this.LastPeriodAveragePower,
      currentStepBeginDate: this.CurrentStepBeginDate,
      currentStepBeginEnergy: this.CurrentStepBeginEnergy,
      currentStepEndDate: this.CurrentStepEndDate,
      lastStepAveragePower: this.LastStepAveragePower,
      currentLoadmonitoringData: this.CurrentLoadmonitoringData,
      warningLimitPower: this.WarningLimitPower,
      warningLimitEnergy: this.WarningLimitEnergy,
      alertLimitPower: this.AlertLimitPower,
      alertLimitEnergy: this.AlertLimitEnergy,
      lossesPower: this.LossesPower,
      lossesEnergyPerPeriod: this.LossesEnergyPerPeriod,
      lossesEnergyPerStep: this.LossesEnergyPerStep
    };
  }

  /**
   * @description Method for generating Payload of storing loadmonitoring
   */
  vGenerateStoragePayload() {
    return {
      enabled: this.Enabled,
      warning: this.Warning,
      alert: this.Alert,
      warningLimitPower: this.WarningLimitPower,
      warningLimitEnergy: this.WarningLimitEnergy,
      alertLimitPower: this.AlertLimitPower,
      alertLimitEnergy: this.AlertLimitEnergy,
      lossesPower: this.LossesPower
    };
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

  // #endregion

  // #region Abstract

  /**
   * @description Method for gathering data of historical energy counter value - with 1 minute intervals!
   * @param {Number} periodBeginDate Unix time of the begining of current
   * @param {Number} periodEndDate Unix time of the ending of current
   */
  async aGetLoadmonitoringData(periodBeginDate, periodEndDate) {
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

    throw new Error("Method has not been implemented!");
  }

  // #endregion
}

module.exports = Loadmonitoring;
