const path = require("path");
const {
  clearDirectoryAsync,
  checkIfDirectoryExistsAsync,
  checkIfFileExistsAsync,
  createDirAsync,
  removeDirectoryAsync,
  removeFileOrDirectoryAsync,
  writeFileAsync,
  promisifyFunc,
  exists
} = require("../../utilities/utilities");
const FileStorage = require("../../classes/Storage/FileStorage");

const Loadmonitoring = require("../../classes/Loadmonitoring/Loadmonitoring");

let loadmonitoringFileName = "testLoadMonitoring";
let loadmonitoringDirName = "__testDir/Loadmonitoring";

let loadmonitoringPathName = path.resolve(
  path.join(loadmonitoringDirName, loadmonitoringFileName)
);

describe("Loadmonitoring", () => {
  beforeEach(async () => {
    //Creating clear directory if not exists
    let dirExists = await checkIfDirectoryExistsAsync(loadmonitoringDirName);
    if (dirExists) await clearDirectoryAsync(loadmonitoringDirName);
    else createDirAsync(loadmonitoringDirName);
  });

  afterEach(async () => {
    //Deleting directory if exists
    let dirExists = await checkIfDirectoryExistsAsync(loadmonitoringDirName);
    if (dirExists) await removeDirectoryAsync(loadmonitoringDirName);
  });

  describe("constructor", () => {
    let fileStorage;
    let fileStorageInitPayload;

    beforeEach(() => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);
      return new Loadmonitoring(fileStorage);
    };

    it("should create new Loadmonitoring object", async () => {
      let result = await exec();
      expect(result).toBeDefined();
    });

    it("should set Storage to given storage", async () => {
      let result = await exec();
      expect(result.Storage).toEqual(fileStorage);
    });

    it("should set initialized to false", async () => {
      let result = await exec();
      expect(result.Initialized).toEqual(false);
    });

    it("should set enabled to false", async () => {
      let result = await exec();
      expect(result.Enabled).toEqual(false);
    });

    it("should set active to false", async () => {
      let result = await exec();
      expect(result.Active).toEqual(false);
    });

    it("should set warning and alert to false", async () => {
      let result = await exec();
      expect(result.Warning).toEqual(false);
      expect(result.Alert).toEqual(false);
    });

    it("should set limits to 0", async () => {
      let result = await exec();

      expect(result.WarningLimitEnergy).toEqual(0);
      expect(result.WarningLimitPower).toEqual(0);
      expect(result.AlertLimitEnergy).toEqual(0);
      expect(result.AlertLimitPower).toEqual(0);
    });

    it("should set power losses to 0", async () => {
      let result = await exec();

      expect(result.LossesPower).toEqual(0);
      expect(result.LossesEnergyPerPeriod).toEqual(0);
      expect(result.LossesEnergyPerStep).toEqual(0);
    });

    it("should set logger to console", async () => {
      let result = await exec();
      expect(result.logger).toEqual(console);
    });
  });

  describe("init", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;
    let onInitMockFunc;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      loadmonitoringFileContent = {
        enabled: true,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 200
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      onInitMockFunc = jest.fn();
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);
      loadmonitoring.vOnInit = onInitMockFunc;
      return loadmonitoring.init();
    };

    it("should set initialized to true", async () => {
      await exec();
      expect(loadmonitoring.Initialized).toEqual(true);
    });

    it("should call onInit function", async () => {
      await exec();
      expect(onInitMockFunc).toHaveBeenCalledTimes(1);
    });

    it("should initialize loadmonitoring based on given payload", async () => {
      await exec();
      expect(loadmonitoring.Enabled).toEqual(loadmonitoringFileContent.enabled);
      expect(loadmonitoring.Warning).toEqual(loadmonitoringFileContent.warning);
      expect(loadmonitoring.Alert).toEqual(loadmonitoringFileContent.alert);
      expect(loadmonitoring.WarningLimitPower).toEqual(
        loadmonitoringFileContent.warningLimitPower
      );
      expect(loadmonitoring.WarningLimitEnergy).toEqual(
        loadmonitoringFileContent.warningLimitEnergy
      );
      expect(loadmonitoring.AlertLimitPower).toEqual(
        loadmonitoringFileContent.alertLimitPower
      );
      expect(loadmonitoring.AlertLimitEnergy).toEqual(
        loadmonitoringFileContent.alertLimitEnergy
      );
    });

    it("should set power losses based on given value", async () => {
      await exec();
      expect(loadmonitoring.LossesPower).toEqual(
        loadmonitoringFileContent.lossesPower
      );
      expect(loadmonitoring.LossesEnergyPerPeriod).toEqual(
        loadmonitoringFileContent.lossesPower / 4
      );
      expect(loadmonitoring.LossesEnergyPerStep).toEqual(
        loadmonitoringFileContent.lossesPower / 60
      );
    });

    it("should set power losses to 0 if it is given inside payload", async () => {
      delete loadmonitoringFileContent.lossesPower;
      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await exec();
      expect(loadmonitoring.LossesPower).toEqual(0);
      expect(loadmonitoring.LossesEnergyPerPeriod).toEqual(0);
      expect(loadmonitoring.LossesEnergyPerStep).toEqual(0);
    });

    it("should throw if loadmonitoring has already been initialized", async () => {
      await exec();

      await expect(
        promisifyFunc(async () => await loadmonitoring.init())
      ).rejects.toBeDefined();
    });

    it("should not throw but initialize loadmonitoring with values = 0 if there is no file", async () => {
      await removeFileOrDirectoryAsync(loadmonitoringPathName);

      await exec();

      let expectedPayload = {
        enabled: false,
        warning: false,
        alert: false,
        active: false,
        warningLimitPower: 0,
        warningLimitEnergy: 0,
        alertLimitPower: 0,
        alertLimitEnergy: 0,
        lossesPower: 0,
        lossesEnergyPerPeriod: 0,
        lossesEnergyPerStep: 0,
        currentPeriodPowerValues: undefined,
        currentPeriodBeginDate: undefined,
        currentPeriodEndDate: undefined,
        currentPeriodBeginEnergy: undefined,
        currentPeriodEndPredictedEnergy: undefined,
        currentPeriodEndPredictedPower: undefined,
        currentPeriodCounterValues: undefined,
        currentPeriodPredictedCounterValues: undefined,
        lastPeriodAveragePower: undefined,
        CurrentStepBeginDate: undefined,
        CurrentStepBeginEnergy: undefined,
        CurrentStepEndDate: undefined,
        LastStepAveragePower: undefined,
        CurrentLoadmonitoringData: undefined
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);

      expect(loadmonitoring.Initialized).toEqual(true);
    });

    it("should set enabled to true if enabled is set to true in file payload", async () => {
      loadmonitoringFileContent.enabled = true;
      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );
      await exec();
      expect(loadmonitoring.Enabled).toEqual(true);
    });

    it("should set enabled to false if enabled is set to false in file payload", async () => {
      loadmonitoringFileContent.enabled = false;
      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );
      await exec();
      expect(loadmonitoring.Enabled).toEqual(false);
    });
  });

  describe("start", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;
    let initLoadmonitoring;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      loadmonitoringFileContent = {
        enabled: false,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 200
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      initLoadmonitoring = true;
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);
      if (initLoadmonitoring) await loadmonitoring.init();

      return loadmonitoring.start();
    };

    it("should set enabled to true if it was set to false", async () => {
      await exec();
      expect(loadmonitoring.Enabled).toEqual(true);
    });

    it("should leave enabled set to true if it was set to true", async () => {
      loadmonitoringFileContent = {
        enabled: true,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 200
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await exec();
      expect(loadmonitoring.Enabled).toEqual(true);
    });

    it("should throw and not change enabled property if loadmonitoring has not been initialized", async () => {
      initLoadmonitoring = false;

      await expect(promisifyFunc(exec)).rejects.toBeDefined();

      expect(loadmonitoring.Enabled).toEqual(false);
    });

    it("it should save enabled = true in storage", async () => {
      await exec();

      let storageContent = await fileStorage.load();
      let expectedStorageContent = {
        ...loadmonitoringFileContent,
        enabled: true
      };

      expect(storageContent).toEqual(expectedStorageContent);
    });
  });

  describe("stop", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;
    let initLoadmonitoring;
    let setActiveToTrue;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };
      setActiveToTrue = false;
      loadmonitoringFileContent = {
        enabled: true,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 200
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      initLoadmonitoring = true;
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);
      if (initLoadmonitoring) await loadmonitoring.init();

      if (setActiveToTrue) loadmonitoring._active = true;

      return loadmonitoring.stop();
    };

    it("should set enabled to false if it was set to true", async () => {
      await exec();
      expect(loadmonitoring.Enabled).toEqual(false);
    });

    it("should leave enabled set to false if it was set to false", async () => {
      loadmonitoringFileContent = {
        enabled: false,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 200
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await exec();
      expect(loadmonitoring.Enabled).toEqual(false);
    });

    it("should set active to false", async () => {
      setActiveToTrue = true;

      await exec();
      expect(loadmonitoring.Active).toEqual(false);
    });

    it("it should save enabled = false in storage", async () => {
      await exec();

      let storageContent = await fileStorage.load();
      let expectedStorageContent = {
        ...loadmonitoringFileContent,
        enabled: false
      };

      expect(storageContent).toEqual(expectedStorageContent);
    });
  });

  describe("_save", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;

    let editPayload;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };
      setActiveToTrue = false;
      loadmonitoringFileContent = {
        enabled: false,
        warning: false,
        alert: false,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 200
      };
      editPayload = {
        enabled: true,
        warning: true,
        alert: true,
        warningLimitPower: 1000,
        warningLimitEnergy: 500,
        alertLimitPower: 2000,
        alertLimitEnergy: 350,
        lossesPower: 300
      };
      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);
      await loadmonitoring.init();
    });

    let exec = async () => {
      if (exists(editPayload.enabled))
        loadmonitoring._enabled = editPayload.enabled;
      if (exists(editPayload.warning))
        loadmonitoring._warning = editPayload.warning;
      if (exists(editPayload.alert)) loadmonitoring._alert = editPayload.alert;
      if (exists(editPayload.warningLimitPower))
        loadmonitoring._warningLimitPower = editPayload.warningLimitPower;
      if (exists(editPayload.warningLimitEnergy))
        loadmonitoring._warningLimitEnergy = editPayload.warningLimitEnergy;
      if (exists(editPayload.alertLimitPower))
        loadmonitoring._alertLimitPower = editPayload.alertLimitPower;
      if (exists(editPayload.alertLimitEnergy))
        loadmonitoring._alertLimitEnergy = editPayload.alertLimitEnergy;
      if (exists(editPayload.lossesPower))
        loadmonitoring._lossesPower = editPayload.lossesPower;

      return loadmonitoring._save();
    };

    it("should save new storagePayload into storage", async () => {
      await exec();

      let storageContent = await fileStorage.load();

      expect(storageContent).toEqual(editPayload);
    });

    it("should not throw if save method of storage throws", async () => {
      let saveMockFunc = jest.fn(async () => {
        throw new Error("Test error");
      });
      fileStorage.save = saveMockFunc;

      await expect(
        promisifyFunc(async () => {
          await exec();
          return true;
        })
      ).resolves.toBeDefined();
    });
  });

  describe("_getPeriodAndStepFromDate", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let date;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      date = new Date("2019-10-12T09:21:40.646Z");
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._getPeriodAndStepFromDate(date);
    };

    it("should return valid begining and end of 15min period and 1min step", async () => {
      let result = await exec();
      let expectedResult = {
        periodBeginDate: new Date("2019-10-12T09:15:00.000Z"),
        periodEndDate: new Date("2019-10-12T09:30:00.000Z"),
        stepBeginDate: new Date("2019-10-12T09:21:00.000Z"),
        stepEndDate: new Date("2019-10-12T09:22:00.000Z")
      };
      expect(result).toEqual(expectedResult);
    });

    it("should return valid begining and end of 15min if date is valid begining of period", async () => {
      date = new Date("2019-10-12T09:15:00.000Z");

      let result = await exec();
      let expectedResult = {
        periodBeginDate: new Date("2019-10-12T09:15:00.000Z"),
        periodEndDate: new Date("2019-10-12T09:30:00.000Z"),
        stepBeginDate: new Date("2019-10-12T09:15:00.000Z"),
        stepEndDate: new Date("2019-10-12T09:16:00.000Z")
      };
      expect(result).toEqual(expectedResult);
    });

    it("should return valid begining and end of 15min if date is valid begining of step", async () => {
      date = new Date("2019-10-12T09:17:00.000Z");

      let result = await exec();
      let expectedResult = {
        periodBeginDate: new Date("2019-10-12T09:15:00.000Z"),
        periodEndDate: new Date("2019-10-12T09:30:00.000Z"),
        stepBeginDate: new Date("2019-10-12T09:17:00.000Z"),
        stepEndDate: new Date("2019-10-12T09:18:00.000Z")
      };
      expect(result).toEqual(expectedResult);
    });

    it("should throw if date is null", async () => {
      date = null;

      await expect(promisifyFunc(exec)).rejects.toBeDefined();
    });

    it("should throw if date is undefined", async () => {
      date = null;

      await expect(promisifyFunc(exec)).rejects.toBeDefined();
    });

    it("should throw if date is not a valid date", async () => {
      date = "1234";

      await expect(promisifyFunc(exec)).rejects.toBeDefined();
    });
  });

  //SHOULD BE MOVED TO INHERITED CLASS!
  describe("checkCountersData", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let loadmonitoringData;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570871700000 - 2019-10-12T09:15:00.000Z
      //1570872600000 - 2019-10-12T09:30:00.000Z
      loadmonitoringData = {
        1570871700000: 1000,
        1570871760000: 1001,
        1570871820000: 1002,
        1570871880000: 1003,
        1570871940000: 1004,
        1570872000000: 1005,
        1570872060000: 1006,
        1570872120000: 1007,
        1570872180000: 1008,
        1570872240000: 1009,
        1570872300000: 1010,
        1570872360000: 1011,
        1570872420000: 1012,
        1570872480000: 1013,
        1570872540000: 1014
      };
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring.checkCountersData(loadmonitoringData);
    };

    it("should return true if data is valid", async () => {
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if data contains also a sample from next period", async () => {
      loadmonitoringData = {
        ...loadmonitoringData,
        1570872600000: 1015
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if data contains more than 15 samples", async () => {
      loadmonitoringData = {
        1570871700000: 1000,
        1570871760000: 1001,
        1570871820000: 1002,
        1570871880000: 1003,
        1570871940000: 1004,
        1570872000000: 1005,
        1570872060000: 1006,
        1570872120000: 1007,
        1570872180000: 1008,
        1570872240000: 1009,
        1570872300000: 1010,
        1570872360000: 1011,
        1570872420000: 1012,
        1570872480000: 1013,
        1570872540000: 1014,
        1570872560000: 1015
      };

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if data is undefined", async () => {
      loadmonitoringData = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if data is empty", async () => {
      loadmonitoringData = {};

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if data doesn't start from begnining of the period", async () => {
      loadmonitoringData = {
        1570871700001: 1000,
        1570871760000: 1001,
        1570871820000: 1002,
        1570871880000: 1003,
        1570871940000: 1004,
        1570872000000: 1005,
        1570872060000: 1006,
        1570872120000: 1007,
        1570872180000: 1008,
        1570872240000: 1009,
        1570872300000: 1010,
        1570872360000: 1011,
        1570872420000: 1012,
        1570872480000: 1013,
        1570872540000: 1014
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if one of samples inside is from different time range", async () => {
      loadmonitoringData = {
        1570871700000: 1000,
        1570871760000: 1001,
        1570871820000: 1002,
        1570871880000: 1003,
        1570871940000: 1004,
        1570872000000: 1005,
        1570872060000: 1006,
        1570872120000: 1007,
        1570882180000: 1008,
        1570872240000: 1009,
        1570872300000: 1010,
        1570872360000: 1011,
        1570872420000: 1012,
        1570872480000: 1013,
        1570872540000: 1014
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return true if there is smaller number of samples than for full period", async () => {
      loadmonitoringData = {
        1570871700000: 1000,
        1570871760000: 1001,
        1570871820000: 1002,
        1570871880000: 1003,
        1570871940000: 1004,
        1570872000000: 1005,
        1570872060000: 1006
      };
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if there is a gap between samples", async () => {
      loadmonitoringData = {
        1570871700000: 1000,
        1570871760000: 1001,
        1570871940000: 1004,
        1570872000000: 1005,
        1570872060000: 1006
      };
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if one of sample has time, that is not a begnining or ending of step", async () => {
      loadmonitoringData = {
        1570871700000: 1000,
        1570871760000: 1001,
        1570871820000: 1002,
        1570871880000: 1003,
        1570871940000: 1004,
        1570872000000: 1005,
        1570872060000: 1006,
        1570872120000: 1007,
        1570872180000: 1008,
        1570872240001: 1009,
        1570872300000: 1010,
        1570872360000: 1011,
        1570872420000: 1012,
        1570872480000: 1013,
        1570872540000: 1014
      };
      let result = await exec();

      expect(result).toEqual(false);
    });
  });

  describe("_checkLoadmonitoringData", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let loadmonitoringData;
    let initialCounterValueData;
    let countersData;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      initialCounterValueData = 123456;

      //1570871700000 - 2019-10-12T09:15:00.000Z
      //1570872600000 - 2019-10-12T09:30:00.000Z
      countersData = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6,
        1570872120000: 7,
        1570872180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };

      loadmonitoringData = {
        initialCounterValue: initialCounterValueData,
        counters: countersData
      };
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._checkLoadmonitoringData(loadmonitoringData);
    };

    it("should return true if data is valid", async () => {
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if initial counter value is undefined", async () => {
      loadmonitoringData.initialCounterValue = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if initial counter value is not a number", async () => {
      loadmonitoringData.initialCounterValue = "abcd";

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if one of counters data is not a valid number", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: "abcd",
        1570872060000: 6,
        1570872120000: 7,
        1570872180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if counters data are not ordered asceding", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 6,
        1570872060000: 5,
        1570872120000: 7,
        1570872180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return true if counters data id ordered asceding and there are two samples with the same value", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 5,
        1570872120000: 7,
        1570872180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if first counter value is not 0", async () => {
      loadmonitoringData.counters = {
        1570871700000: 1,
        1570871760000: 2,
        1570871820000: 3,
        1570871880000: 4,
        1570871940000: 5,
        1570872000000: 6,
        1570872060000: 7,
        1570872120000: 8,
        1570872180000: 9,
        1570872240000: 10,
        1570872300000: 11,
        1570872360000: 12,
        1570872420000: 13,
        1570872480000: 14,
        1570872540000: 15
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if first counter value is not a valid number", async () => {
      loadmonitoringData.counters = {
        1570871700000: "abcd",
        1570871760000: 2,
        1570871820000: 3,
        1570871880000: 4,
        1570871940000: 5,
        1570872000000: 6,
        1570872060000: 7,
        1570872120000: 8,
        1570872180000: 9,
        1570872240000: 10,
        1570872300000: 11,
        1570872360000: 12,
        1570872420000: 13,
        1570872480000: 14,
        1570872540000: 15
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if counters data contains also a sample from next period", async () => {
      loadmonitoringData.counters = {
        ...loadmonitoringData.counters,
        1570872600000: 1015
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if counters data contains more than 15 samples", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6,
        1570872120000: 7,
        1570872180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14,
        1570872560000: 15
      };

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if counters data is undefined", async () => {
      loadmonitoringData.counters = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if counters data is empty", async () => {
      loadmonitoringData.counters = {};

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if counters data doesn't start from begnining of the period", async () => {
      loadmonitoringData.counters = {
        1570871700001: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6,
        1570872120000: 7,
        1570872180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if one of samples inside is from different time range", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6,
        1570872120000: 7,
        1570882180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };
      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return true if there is smaller number of samples than for full period", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6
      };
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if there is a gap between samples", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6
      };
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if one of sample has time, that is not a begnining or ending of step", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6,
        1570872120000: 7,
        1570872180000: 8,
        1570872240001: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };
      let result = await exec();

      expect(result).toEqual(false);
    });
  });

  describe("_shouldChangePeriod", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let actualDate;
    let periodBeginDate;
    let periodEndDate;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570882200000 - 2019-10-12T12:10:00.000Z
      actualDate = new Date(1570882200000);

      //1570871700000 - 2019-10-12T09:15:00.000Z
      periodBeginDate = new Date(1570871700000);

      //1570872600000 - 2019-10-12T09:30:00.000Z
      periodEndDate = new Date(1570872600000);
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._shouldChangePeriod(
        actualDate,
        periodBeginDate,
        periodEndDate
      );
    };

    it("should return true if actual date is ahead from actual period", async () => {
      //1570882200000 - 2019-10-12T12:10:00.000Z
      actualDate = new Date(1570882200000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if actual date is before actual period", async () => {
      //1570882200000 - 2019-10-12T06:02:00.000Z
      actualDate = new Date(1570860120000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if actual date is an end of current period", async () => {
      //1570872600000 - 2019-10-12T09:30:00.000Z
      actualDate = new Date(1570872600000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if actual date is a begining of current period", async () => {
      //1570871700000 - 2019-10-12T09:15:00.000Z
      actualDate = new Date(1570871700000);

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if actual date is inside actual period", async () => {
      //1570871700000 - 2019-10-12T09:25:00.000Z
      actualDate = new Date(1570872300000);

      let result = await exec();

      expect(result).toEqual(false);
    });
  });

  describe("_canActualPeriodBeClosedProperly", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let currentPeriodBeginEnergy;
    let currentPeriodBeginDate;
    let currentPeriodEndDate;
    let currentLoadmonitoringData;
    let newLoadmonitoringData;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570871700000 - 2019-10-12T09:15:00.000Z
      currentPeriodBeginDate = new Date(1570871700000);
      currentPeriodBeginEnergy = 123456000;
      //1570872600000 - 2019-10-12T09:30:00.000Z
      currentPeriodEndDate = new Date(1570872600000);

      currentLoadmonitoringData = {
        initialCounterValue: 123456000,
        counters: {
          1570871700000: 123456000,
          1570871760000: 123456100,
          1570871820000: 123456200,
          1570871880000: 123456300,
          1570871940000: 123456400,
          1570872060000: 123456500,
          1570872120000: 123456600,
          1570872180000: 123456700,
          1570872240000: 123456800,
          1570872300000: 123456900,
          1570872360000: 123457000,
          1570872420000: 123457100,
          1570872480000: 123457200,
          1570872540000: 123457300
        }
      };

      //1570872600000 - 2019-10-12T09:30:00.000Z
      newLoadmonitoringData = {
        initialCounterValue: 123457400,
        counters: {
          1570872600000: 123457400
        }
      };
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      loadmonitoring._currentPeriodBeginDate = currentPeriodBeginDate;
      loadmonitoring._currentPeriodBeginEnergy = currentPeriodBeginEnergy;
      loadmonitoring._currentPeriodEndDate = currentPeriodEndDate;
      loadmonitoring._currentLoadmonitoringData = currentLoadmonitoringData;

      return loadmonitoring._canActualPeriodBeClosedProperly(
        newLoadmonitoringData
      );
    };

    it("should return true if current period begin date and energy exist and current period end date exists, currentLoadmonitoring and new loadmonitoring data are valid and current period end date is the same as new period begin date", async () => {
      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if actual period end date is not exactly the same as new period begin date", async () => {
      //1570878000000 - 2019-10-12T11:00:00.000Z
      newLoadmonitoringData.counters = { 1570878000000: 123457400 };

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if current period begin date is undefined", async () => {
      currentPeriodBeginDate = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if current period begin energy is undefined", async () => {
      currentPeriodBeginEnergy = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if current period end date is undefined", async () => {
      currentPeriodEndDate = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if new loadmonitoring data is undefined", async () => {
      newLoadmonitoringData = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if new loadmonitoring data counters is undefined", async () => {
      newLoadmonitoringData.counters = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if new loadmonitoring counters data is empty", async () => {
      newLoadmonitoringData.counters = {};

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if current loadmonitoring data is undefined", async () => {
      currentLoadmonitoringData = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if current loadmonitoring data counters is undefined", async () => {
      currentLoadmonitoringData.counters = undefined;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if current loadmonitoring counters data is empty", async () => {
      currentLoadmonitoringData.counters = {};

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return true if there are more than one counter values in new loadmonitoring counter data", async () => {
      //1570872600000 - 2019-10-12T09:30:00.000Z
      newLoadmonitoringData.counters = {
        1570872600000: 123457400,
        1570872660000: 123457500
      };

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if there are more than one counter values in new loadmonitoring counter data but there is not value for period begining", async () => {
      //1570872600000 - 2019-10-12T09:30:00.000Z
      newLoadmonitoringData.counters = {
        1570872660000: 123457400,
        1570872720000: 123457500,
        1570873780000: 123457600
      };

      let result = await exec();

      expect(result).toEqual(false);
    });
  });

  describe("_shouldChangePeriod", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let actualDate;
    let periodBeginDate;
    let periodEndDate;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570882200000 - 2019-10-12T12:10:00.000Z
      actualDate = new Date(1570882200000);

      //1570871700000 - 2019-10-12T09:15:00.000Z
      periodBeginDate = new Date(1570871700000);

      //1570872600000 - 2019-10-12T09:30:00.000Z
      periodEndDate = new Date(1570872600000);
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._shouldChangePeriod(
        actualDate,
        periodBeginDate,
        periodEndDate
      );
    };

    it("should return true if actual date is ahead from actual period", async () => {
      //1570882200000 - 2019-10-12T12:10:00.000Z
      actualDate = new Date(1570882200000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if actual date is before actual period", async () => {
      //1570882200000 - 2019-10-12T06:02:00.000Z
      actualDate = new Date(1570860120000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if actual date is an end of current period", async () => {
      //1570872600000 - 2019-10-12T09:30:00.000Z
      actualDate = new Date(1570872600000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if actual date is a begining of current period", async () => {
      //1570871700000 - 2019-10-12T09:15:00.000Z
      actualDate = new Date(1570871700000);

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if actual date is inside actual period", async () => {
      //1570871700000 - 2019-10-12T09:25:00.000Z
      actualDate = new Date(1570872300000);

      let result = await exec();

      expect(result).toEqual(false);
    });
  });

  describe("_shouldChangeStep", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let actualDate;
    let stepBeginDate;
    let stepEndDate;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570882230000 - 2019-10-12T12:10:30.000Z
      actualDate = new Date(1570882230000);

      //1570882200000 - 2019-10-12T12:10:00.000Z
      stepBeginDate = new Date(1570882200000);

      //1570882260000 - 2019-10-12T12:11:00.000Z
      stepEndDate = new Date(1570882260000);
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._shouldChangeStep(
        actualDate,
        stepBeginDate,
        stepEndDate
      );
    };

    it("should return true if actual date is ahead from actual step", async () => {
      //1570882200000 - 2019-10-12T12:11:30.000Z
      actualDate = new Date(1570882290000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if actual date is before actual step", async () => {
      //1570882200000 - 2019-10-12T06:02:00.000Z
      actualDate = new Date(1570860120000);

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return true if actual date is an end of current step", async () => {
      //1570882260000 - 2019-10-12T12:11:00.000Z
      actualDate = stepEndDate;

      let result = await exec();

      expect(result).toEqual(true);
    });

    it("should return false if actual date is a begining of current step", async () => {
      //1570871700000 - 2019-10-12T09:15:00.000Z
      actualDate = stepBeginDate;

      let result = await exec();

      expect(result).toEqual(false);
    });

    it("should return false if actual date is inside actual step", async () => {
      //1570882230000 - 2019-10-12T12:10:30.000Z
      actualDate = new Date(1570882230000);

      let result = await exec();

      expect(result).toEqual(false);
    });
  });

  describe("_getLastStepValues", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let countersData;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570871700000 - 2019-10-12T09:15:00.000Z
      //1570872600000 - 2019-10-12T09:30:00.000Z
      countersData = {
        1570871700000: 0,
        1570871760000: 1,
        1570871820000: 2,
        1570871880000: 3,
        1570871940000: 4,
        1570872000000: 5,
        1570872060000: 6,
        1570872120000: 7,
        1570872180000: 8,
        1570872240000: 9,
        1570872300000: 10,
        1570872360000: 11,
        1570872420000: 12,
        1570872480000: 13,
        1570872540000: 14
      };
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._getLastStepValues(countersData);
    };

    it("should return values of the last step", async () => {
      let result = await exec();

      let expectedResult = {
        1570872540000: 14
      };

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if counters data is empty", async () => {
      countersData = {};

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if loadmonitoring counters data is undefined", async () => {
      countersData = undefined;

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });

    it("should return values of the last step - if there is only one step", async () => {
      countersData = {
        1570871700000: 0
      };

      let result = await exec();

      let expectedResult = {
        1570871700000: 0
      };

      expect(result).toEqual(expectedResult);
    });
  });

  describe("_closeActualPeriod", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;

    let currentPeriodBeginEnergy;
    let currentPeriodBeginDate;
    let currentPeriodEndDate;
    let currentLoadmonitoringData;
    let newLoadmonitoringData;
    let onTransgressionMockFunc;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570871700000 - 2019-10-12T09:15:00.000Z
      currentPeriodBeginDate = new Date(1570871700000);
      currentPeriodBeginEnergy = 123456000;
      //1570872600000 - 2019-10-12T09:30:00.000Z
      currentPeriodEndDate = new Date(1570872600000);

      currentLoadmonitoringData = {
        initialCounterValue: 123456000,
        counters: {
          1570871700000: 123456000,
          1570871760000: 123456100,
          1570871820000: 123456200,
          1570871880000: 123456300,
          1570871940000: 123456400,
          1570872060000: 123456500,
          1570872120000: 123456600,
          1570872180000: 123456700,
          1570872240000: 123456800,
          1570872300000: 123456900,
          1570872360000: 123457000,
          1570872420000: 123457100,
          1570872480000: 123457200,
          1570872540000: 123457300
        }
      };

      //1570872600000 - 2019-10-12T09:30:00.000Z
      newLoadmonitoringData = {
        initialCounterValue: 123457400,
        counters: {
          1570872600000: 123457400
        }
      };

      loadmonitoringFileContent = {
        enabled: true,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 20
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      onTransgressionMockFunc = jest.fn();
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);
      loadmonitoring.vOnTransgression = onTransgressionMockFunc;

      await loadmonitoring.init();

      loadmonitoring._currentPeriodBeginDate = currentPeriodBeginDate;
      loadmonitoring._currentPeriodBeginEnergy = currentPeriodBeginEnergy;
      loadmonitoring._currentPeriodEndDate = currentPeriodEndDate;
      loadmonitoring._currentLoadmonitoringData = currentLoadmonitoringData;

      return loadmonitoring._closeActualPeriod(newLoadmonitoringData);
    };

    it("should set current Period power and counter real and predicited values to empty objects", async () => {
      await exec();

      expect(loadmonitoring.CurrentPeriodCounterValues).toEqual({});
      expect(loadmonitoring.CurrentPeriodPowerValues).toEqual({});
      expect(loadmonitoring.CurrentPeriodPredictedCounterValues).toEqual({});
    });

    it("should calculate average active power and set it as LastPeriodAveragePower and LastStepAveragePower and currentPeriodEndPredictedPower", async () => {
      await exec();

      let expectedPower =
        (newLoadmonitoringData.initialCounterValue - currentPeriodBeginEnergy) *
          4 +
        loadmonitoringFileContent.lossesPower;

      expect(loadmonitoring.LastStepAveragePower).toEqual(expectedPower);
      expect(loadmonitoring.LastPeriodAveragePower).toEqual(expectedPower);
      expect(loadmonitoring.CurrentPeriodEndPredictedPower).toEqual(
        expectedPower
      );
    });

    it("should call onTransgression if value is above alert limit", async () => {
      loadmonitoringFileContent = {
        enabled: true,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 500,
        alertLimitEnergy: 250,
        lossesPower: 20
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await exec();

      let expectedPower =
        (newLoadmonitoringData.initialCounterValue - currentPeriodBeginEnergy) *
          4 +
        loadmonitoringFileContent.lossesPower;

      expect(onTransgressionMockFunc).toHaveBeenCalledTimes(1);
      expect(onTransgressionMockFunc.mock.calls[0][0]).toEqual(
        currentPeriodBeginDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][1]).toEqual(
        currentPeriodEndDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoringFileContent.alertLimitPower
      );
      expect(onTransgressionMockFunc.mock.calls[0][3]).toEqual(expectedPower);
    });

    it("should not call onTransgression if value is equal to alert limit", async () => {
      loadmonitoringFileContent = {
        enabled: true,
        warning: true,
        alert: true,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 5620,
        alertLimitEnergy: 5620 / 4,
        lossesPower: 20
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await exec();

      expect(onTransgressionMockFunc).not.toHaveBeenCalled();
    });
  });

  describe("_getRemainingStepsUnixTimes", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let periodEndDate;
    let lastStepBeginDate;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570872600000 - 2019-10-12T09:30:00.000Z
      periodEndDate = new Date(1570872600000);

      //1570871700000 - 2019-10-12T09:15:00.000Z
      lastStepBeginDate = new Date(1570871700000);
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._getRemainingStepsUnixTimes(
        periodEndDate,
        lastStepBeginDate
      );
    };

    it("should return all remaining steps unix times - including first one", async () => {
      let result = await exec();

      let expectedResult = [
        1570871700000,
        1570871760000,
        1570871820000,
        1570871880000,
        1570871940000,
        1570872000000,
        1570872060000,
        1570872120000,
        1570872180000,
        1570872240000,
        1570872300000,
        1570872360000,
        1570872420000,
        1570872480000,
        1570872540000,
        1570872600000
      ];

      expect(result).toEqual(expectedResult);
    });

    it("should return all remaining steps unix times - if last step date is inside period - including first one", async () => {
      lastStepBeginDate = new Date(1570872000000);

      let result = await exec();

      let expectedResult = [
        1570872000000,
        1570872060000,
        1570872120000,
        1570872180000,
        1570872240000,
        1570872300000,
        1570872360000,
        1570872420000,
        1570872480000,
        1570872540000,
        1570872600000
      ];

      expect(result).toEqual(expectedResult);
    });

    it("should return all remaining steps unix times - if last step date is the end of period", async () => {
      lastStepBeginDate = new Date(1570872600000);

      let result = await exec();

      let expectedResult = [1570872600000];

      expect(result).toEqual(expectedResult);
    });
  });

  describe("_getCounterValuesIncludingPowerLosses", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let loadmonitoringData;
    let initialCounterValueData;
    let countersData;
    let energyLossesPerStep;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      initialCounterValueData = 100000;
      energyLossesPerStep = 5;

      //1570871700000 - 2019-10-12T09:15:00.000Z
      //1570872600000 - 2019-10-12T09:30:00.000Z
      countersData = {
        1570871700000: 0,
        1570871760000: 10,
        1570871820000: 20,
        1570871880000: 30,
        1570871940000: 40,
        1570872000000: 50,
        1570872060000: 60,
        1570872120000: 70,
        1570872180000: 80,
        1570872240000: 90,
        1570872300000: 100,
        1570872360000: 110,
        1570872420000: 120,
        1570872480000: 130,
        1570872540000: 140
      };

      loadmonitoringData = {
        initialCounterValue: initialCounterValueData,
        counters: countersData
      };
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._getCounterValuesIncludingPowerLosses(
        loadmonitoringData,
        energyLossesPerStep
      );
    };

    it("should return values of counters including energy losses", async () => {
      let result = await exec();

      let expectedResult = {
        1570871700000: 0 + 0 * 5,
        1570871760000: 10 + 1 * 5,
        1570871820000: 20 + 2 * 5,
        1570871880000: 30 + 3 * 5,
        1570871940000: 40 + 4 * 5,
        1570872000000: 50 + 5 * 5,
        1570872060000: 60 + 6 * 5,
        1570872120000: 70 + 7 * 5,
        1570872180000: 80 + 8 * 5,
        1570872240000: 90 + 9 * 5,
        1570872300000: 100 + 10 * 5,
        1570872360000: 110 + 11 * 5,
        1570872420000: 120 + 12 * 5,
        1570872480000: 130 + 13 * 5,
        1570872540000: 140 + 14 * 5
      };

      expect(result).toEqual(expectedResult);
    });

    it("should return values of counters including energy losses if there is a gap between samples", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0,
        1570871760000: 10,
        1570871820000: 20,
        1570871880000: 30,
        1570871940000: 40,
        1570872000000: 50,
        1570872300000: 100,
        1570872360000: 110,
        1570872420000: 120,
        1570872480000: 130,
        1570872540000: 140
      };

      let result = await exec();

      let expectedResult = {
        1570871700000: 0 + 0 * 5,
        1570871760000: 10 + 1 * 5,
        1570871820000: 20 + 2 * 5,
        1570871880000: 30 + 3 * 5,
        1570871940000: 40 + 4 * 5,
        1570872000000: 50 + 5 * 5,
        1570872300000: 100 + 10 * 5,
        1570872360000: 110 + 11 * 5,
        1570872420000: 120 + 12 * 5,
        1570872480000: 130 + 13 * 5,
        1570872540000: 140 + 14 * 5
      };

      expect(result).toEqual(expectedResult);
    });

    it("should return only value from first counter if there is only one counter", async () => {
      loadmonitoringData.counters = {
        1570871700000: 0
      };

      let result = await exec();

      let expectedResult = {
        1570871700000: 0
      };

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if loadmonitoring data is undefined", async () => {
      loadmonitoringData = undefined;

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if loadmonitoring counters data is undefined", async () => {
      loadmonitoringData.counters = undefined;

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if loadmonitoring counters data is empty", async () => {
      loadmonitoringData.counters = {};

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });
  });

  describe("_getPredictedRemainingSteps", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let lastStepActivePower;
    let actualStepBeginActiveEnergy;
    let actualStepBeginDate;
    let actualPeriodEndDate;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      //1570872600000 - 2019-10-12T09:30:00.000Z
      actualPeriodEndDate = new Date(1570872600000);
      //1570872000000 - 2019-10-12T09:20:00.000Z
      actualStepBeginDate = new Date(1570872000000);

      actualStepBeginActiveEnergy = 100;
      lastStepActivePower = 10;
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._getPredictedRemainingSteps(
        lastStepActivePower,
        actualStepBeginActiveEnergy,
        actualStepBeginDate,
        actualPeriodEndDate
      );
    };

    it("should return all remaining steps unix times with predicted energy values - including first one", async () => {
      let result = await exec();

      let expectedResult = {
        1570872000000: 100 + (0 * 10) / 60,
        1570872060000: 100 + (1 * 10) / 60,
        1570872120000: 100 + (2 * 10) / 60,
        1570872180000: 100 + (3 * 10) / 60,
        1570872240000: 100 + (4 * 10) / 60,
        1570872300000: 100 + (5 * 10) / 60,
        1570872360000: 100 + (6 * 10) / 60,
        1570872420000: 100 + (7 * 10) / 60,
        1570872480000: 100 + (8 * 10) / 60,
        1570872540000: 100 + (9 * 10) / 60,
        1570872600000: 100 + (10 * 10) / 60
      };

      expect(result).toEqual(expectedResult);
    });

    it("should return all remaining steps unix times with predicted energy values - including first one - if step is begining of the period", async () => {
      //1570872600000 - 2019-10-12T09:30:00.000Z
      actualPeriodEndDate = new Date(1570872600000);
      //1570871700000 - 2019-10-12T09:15:00.000Z
      actualStepBeginDate = new Date(1570871700000);

      actualStepBeginActiveEnergy = 0;

      let result = await exec();

      let expectedResult = {
        1570871700000: 0.0 + (0 * 10) / 60,
        1570871760000: 0.0 + (1 * 10) / 60,
        1570871820000: 0.0 + (2 * 10) / 60,
        1570871880000: 0.0 + (3 * 10) / 60,
        1570871940000: 0.0 + (4 * 10) / 60,
        1570872000000: 0.0 + (5 * 10) / 60,
        1570872060000: 0.0 + (6 * 10) / 60,
        1570872120000: 0.0 + (7 * 10) / 60,
        1570872180000: 0.0 + (8 * 10) / 60,
        1570872240000: 0.0 + (9 * 10) / 60,
        1570872300000: 0.0 + (10 * 10) / 60,
        1570872360000: 0.0 + (11 * 10) / 60,
        1570872420000: 0.0 + (12 * 10) / 60,
        1570872480000: 0.0 + (13 * 10) / 60,
        1570872540000: 0.0 + (14 * 10) / 60,
        1570872600000: 0.0 + (15 * 10) / 60
      };

      expect(Object.keys(result).length).toEqual(
        Object.keys(expectedResult).length
      );

      for (let unitTime of Object.keys(expectedResult)) {
        expect(result[unitTime]).toBeDefined();
        expect(result[unitTime]).toBeCloseTo(expectedResult[unitTime]);
      }
    });

    it("should return all remaining steps unix times with predicted energy values - including first one - if step is an ending of the period", async () => {
      //1570872600000 - 2019-10-12T09:30:00.000Z
      actualPeriodEndDate = new Date(1570872600000);
      //1570871700000 - 2019-10-12T09:15:00.000Z
      actualStepBeginDate = new Date(1570872600000);

      actualStepBeginActiveEnergy = 100;

      let result = await exec();

      let expectedResult = { 1570872600000: 100 };

      expect(result).toEqual(expectedResult);
    });
  });

  describe("_convertCounterValuesToPowerValues", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;

    let counterValues;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      counterValues = {
        1570872000000: 0,
        1570872060000: 100,
        1570872120000: 200,
        1570872180000: 300,
        1570872240000: 400,
        1570872300000: 500,
        1570872360000: 600,
        1570872420000: 700,
        1570872480000: 800,
        1570872540000: 900,
        1570872600000: 1000
      };
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      return loadmonitoring._convertCounterValuesToPowerValues(counterValues);
    };

    it("should return all steps with active power - without first one", async () => {
      let result = await exec();

      let expectedResult = {
        1570872060000: 100 * 60,
        1570872120000: 100 * 60,
        1570872180000: 100 * 60,
        1570872240000: 100 * 60,
        1570872300000: 100 * 60,
        1570872360000: 100 * 60,
        1570872420000: 100 * 60,
        1570872480000: 100 * 60,
        1570872540000: 100 * 60,
        1570872600000: 100 * 60
      };

      expect(result).toEqual(expectedResult);
    });

    it("should return all steps with active power - without first one - if there is a gap between", async () => {
      counterValues = {
        1570872000000: 0,
        1570872060000: 100,
        1570872120000: 200,
        1570872180000: 300,
        1570872360000: 400,
        1570872420000: 500,
        1570872480000: 600,
        1570872540000: 700,
        1570872600000: 800
      };

      let result = await exec();

      let expectedResult = {
        1570872060000: 100 * 60,
        1570872120000: 100 * 60,
        1570872180000: 100 * 60,
        1570872360000: (100 * 60) / 3,
        1570872420000: 100 * 60,
        1570872480000: 100 * 60,
        1570872540000: 100 * 60,
        1570872600000: 100 * 60
      };

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if counter values are empty object", async () => {
      counterValues = {};

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if counter values has only first element", async () => {
      counterValues = { 1570872000000: 0 };

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });

    it("should return empty object if counter values are undefined", async () => {
      counterValues = {};

      let result = await exec();

      let expectedResult = {};

      expect(result).toEqual(expectedResult);
    });
  });

  describe("_calculateLoadmonitoring", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;

    let lastPeriodAveragePower;

    let newLoadmonitoringData;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0
        }
      };

      lastPeriodAveragePower = 2460;

      loadmonitoringFileContent = {
        enabled: true,
        warning: false,
        alert: false,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      loadmonitoring._lastPeriodAveragePower = lastPeriodAveragePower;

      await loadmonitoring.init();

      await loadmonitoring._calculateLoadmonitoring(newLoadmonitoringData);
    };

    it("should calculate new loadmonitoring data based on last period average power - if it is start of a period", async () => {
      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 615,
        currentPeriodEndPredictedPower: 2460,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 41,
          1570872720000: 82,
          1570872780000: 123,
          1570872840000: 164,
          1570872900000: 205,
          1570872960000: 246,
          1570873020000: 287,
          1570873080000: 328,
          1570873140000: 369,
          1570873200000: 410,
          1570873260000: 451,
          1570873320000: 492,
          1570873380000: 533,
          1570873440000: 574,
          1570873500000: 615
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 2460,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should calculate new loadmonitoring data based on last step counter difference - if it is second step of actual period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1515,
        currentPeriodEndPredictedPower: 6060,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101
        },
        currentPeriodPowerValues: {
          1570872660000: 6060
        },
        currentPeriodPredictedCounterValues: {
          1570872660000: 101,
          1570872720000: 202,
          1570872780000: 303,
          1570872840000: 404,
          1570872900000: 505,
          1570872960000: 606,
          1570873020000: 707,
          1570873080000: 808,
          1570873140000: 909,
          1570873200000: 1010,
          1570873260000: 1111,
          1570873320000: 1212,
          1570873380000: 1313,
          1570873440000: 1414,
          1570873500000: 1515
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:31:00.000Z"),
        currentStepBeginEnergy: 101,
        currentStepEndDate: new Date("2019-10-12T09:32:00.000Z"),
        lastStepAveragePower: 6060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should calculate new loadmonitoring data based on last step counter difference - if it is inside of actual period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 300,
          1570872780000: 500,
          1570872840000: 600,
          1570872900000: 650
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1165,
        currentPeriodEndPredictedPower: 4660,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101,
          1570872720000: 302,
          1570872780000: 503,
          1570872840000: 604,
          1570872900000: 655
        },
        currentPeriodPowerValues: {
          1570872660000: 6060,
          1570872720000: 12060,
          1570872780000: 12060,
          1570872840000: 6060,
          1570872900000: 3060
        },
        currentPeriodPredictedCounterValues: {
          1570872900000: 655,
          1570872960000: 706,
          1570873020000: 757,
          1570873080000: 808,
          1570873140000: 859,
          1570873200000: 910,
          1570873260000: 961,
          1570873320000: 1012,
          1570873380000: 1063,
          1570873440000: 1114,
          1570873500000: 1165
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:35:00.000Z"),
        currentStepBeginEnergy: 655,
        currentStepEndDate: new Date("2019-10-12T09:36:00.000Z"),
        lastStepAveragePower: 3060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100,
            1570872720000: 300,
            1570872780000: 500,
            1570872840000: 600,
            1570872900000: 650
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should calculate new loadmonitoring data based on last step counter difference - if it is last step", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 300,
          1570872780000: 500,
          1570872840000: 600,
          1570872900000: 650,
          1570872960000: 700,
          1570873020000: 800,
          1570873080000: 900,
          1570873140000: 1000,
          1570873200000: 1250,
          1570873260000: 1300,
          1570873320000: 1400,
          1570873380000: 1500,
          1570873440000: 1650
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1815,
        currentPeriodEndPredictedPower: 7260,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101,
          1570872720000: 302,
          1570872780000: 503,
          1570872840000: 604,
          1570872900000: 655,
          1570872960000: 706,
          1570873020000: 807,
          1570873080000: 908,
          1570873140000: 1009,
          1570873200000: 1260,
          1570873260000: 1311,
          1570873320000: 1412,
          1570873380000: 1513,
          1570873440000: 1664
        },
        currentPeriodPowerValues: {
          1570872660000: 6060,
          1570872720000: 12060,
          1570872780000: 12060,
          1570872840000: 6060,
          1570872900000: 3060,
          1570872960000: 3060,
          1570873020000: 6060,
          1570873080000: 6060,
          1570873140000: 6060,
          1570873200000: 15060,
          1570873260000: 3060,
          1570873320000: 6060,
          1570873380000: 6060,
          1570873440000: 9060
        },
        currentPeriodPredictedCounterValues: {
          1570873440000: 1664,
          1570873500000: 1815
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:44:00.000Z"),
        currentStepBeginEnergy: 1664,
        currentStepEndDate: new Date("2019-10-12T09:45:00.000Z"),
        lastStepAveragePower: 9060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100,
            1570872720000: 300,
            1570872780000: 500,
            1570872840000: 600,
            1570872900000: 650,
            1570872960000: 700,
            1570873020000: 800,
            1570873080000: 900,
            1570873140000: 1000,
            1570873200000: 1250,
            1570873260000: 1300,
            1570873320000: 1400,
            1570873380000: 1500,
            1570873440000: 1650
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should calculate new loadmonitoring data based on last period average power - if it is start of a period and lastPeriodAveragePower is 0", async () => {
      lastPeriodAveragePower = 0;

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 0,
        currentPeriodEndPredictedPower: 0,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 0,
          1570872720000: 0,
          1570872780000: 0,
          1570872840000: 0,
          1570872900000: 0,
          1570872960000: 0,
          1570873020000: 0,
          1570873080000: 0,
          1570873140000: 0,
          1570873200000: 0,
          1570873260000: 0,
          1570873320000: 0,
          1570873380000: 0,
          1570873440000: 0,
          1570873500000: 0
        },
        lastPeriodAveragePower: 0,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 0,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });
  });

  describe("_openNewPeriod", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;

    let lastPeriodAveragePower;

    let newLoadmonitoringData;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0
        }
      };

      lastPeriodAveragePower = 2460;

      loadmonitoringFileContent = {
        enabled: true,
        warning: false,
        alert: false,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      loadmonitoring._lastPeriodAveragePower = lastPeriodAveragePower;

      await loadmonitoring.init();

      await loadmonitoring._openNewPeriod(newLoadmonitoringData);
    };

    it("should open new period with proper loadmonitoring data - if period starts with only first value", async () => {
      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 615,
        currentPeriodEndPredictedPower: 2460,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 41,
          1570872720000: 82,
          1570872780000: 123,
          1570872840000: 164,
          1570872900000: 205,
          1570872960000: 246,
          1570873020000: 287,
          1570873080000: 328,
          1570873140000: 369,
          1570873200000: 410,
          1570873260000: 451,
          1570873320000: 492,
          1570873380000: 533,
          1570873440000: 574,
          1570873500000: 615
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 2460,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should open new period with proper loadmonitoring data - if period starts with second step", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1515,
        currentPeriodEndPredictedPower: 6060,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101
        },
        currentPeriodPowerValues: {
          1570872660000: 6060
        },
        currentPeriodPredictedCounterValues: {
          1570872660000: 101,
          1570872720000: 202,
          1570872780000: 303,
          1570872840000: 404,
          1570872900000: 505,
          1570872960000: 606,
          1570873020000: 707,
          1570873080000: 808,
          1570873140000: 909,
          1570873200000: 1010,
          1570873260000: 1111,
          1570873320000: 1212,
          1570873380000: 1313,
          1570873440000: 1414,
          1570873500000: 1515
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:31:00.000Z"),
        currentStepBeginEnergy: 101,
        currentStepEndDate: new Date("2019-10-12T09:32:00.000Z"),
        lastStepAveragePower: 6060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should open new period with proper loadmonitoring data - if period starts inside current period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 300,
          1570872780000: 500,
          1570872840000: 600,
          1570872900000: 650
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1165,
        currentPeriodEndPredictedPower: 4660,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101,
          1570872720000: 302,
          1570872780000: 503,
          1570872840000: 604,
          1570872900000: 655
        },
        currentPeriodPowerValues: {
          1570872660000: 6060,
          1570872720000: 12060,
          1570872780000: 12060,
          1570872840000: 6060,
          1570872900000: 3060
        },
        currentPeriodPredictedCounterValues: {
          1570872900000: 655,
          1570872960000: 706,
          1570873020000: 757,
          1570873080000: 808,
          1570873140000: 859,
          1570873200000: 910,
          1570873260000: 961,
          1570873320000: 1012,
          1570873380000: 1063,
          1570873440000: 1114,
          1570873500000: 1165
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:35:00.000Z"),
        currentStepBeginEnergy: 655,
        currentStepEndDate: new Date("2019-10-12T09:36:00.000Z"),
        lastStepAveragePower: 3060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100,
            1570872720000: 300,
            1570872780000: 500,
            1570872840000: 600,
            1570872900000: 650
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should open new period with proper loadmonitoring data - if period starts with last step", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 300,
          1570872780000: 500,
          1570872840000: 600,
          1570872900000: 650,
          1570872960000: 700,
          1570873020000: 800,
          1570873080000: 900,
          1570873140000: 1000,
          1570873200000: 1250,
          1570873260000: 1300,
          1570873320000: 1400,
          1570873380000: 1500,
          1570873440000: 1650
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1815,
        currentPeriodEndPredictedPower: 7260,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101,
          1570872720000: 302,
          1570872780000: 503,
          1570872840000: 604,
          1570872900000: 655,
          1570872960000: 706,
          1570873020000: 807,
          1570873080000: 908,
          1570873140000: 1009,
          1570873200000: 1260,
          1570873260000: 1311,
          1570873320000: 1412,
          1570873380000: 1513,
          1570873440000: 1664
        },
        currentPeriodPowerValues: {
          1570872660000: 6060,
          1570872720000: 12060,
          1570872780000: 12060,
          1570872840000: 6060,
          1570872900000: 3060,
          1570872960000: 3060,
          1570873020000: 6060,
          1570873080000: 6060,
          1570873140000: 6060,
          1570873200000: 15060,
          1570873260000: 3060,
          1570873320000: 6060,
          1570873380000: 6060,
          1570873440000: 9060
        },
        currentPeriodPredictedCounterValues: {
          1570873440000: 1664,
          1570873500000: 1815
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:44:00.000Z"),
        currentStepBeginEnergy: 1664,
        currentStepEndDate: new Date("2019-10-12T09:45:00.000Z"),
        lastStepAveragePower: 9060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100,
            1570872720000: 300,
            1570872780000: 500,
            1570872840000: 600,
            1570872900000: 650,
            1570872960000: 700,
            1570873020000: 800,
            1570873080000: 900,
            1570873140000: 1000,
            1570873200000: 1250,
            1570873260000: 1300,
            1570873320000: 1400,
            1570873380000: 1500,
            1570873440000: 1650
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should open new period with proper loadmonitoring data - if period starts with only first value but it was not closed properly (lastStepAveragePower = 0)", async () => {
      lastPeriodAveragePower = 0;

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 0,
        currentPeriodEndPredictedPower: 0,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 0,
          1570872720000: 0,
          1570872780000: 0,
          1570872840000: 0,
          1570872900000: 0,
          1570872960000: 0,
          1570873020000: 0,
          1570873080000: 0,
          1570873140000: 0,
          1570873200000: 0,
          1570873260000: 0,
          1570873320000: 0,
          1570873380000: 0,
          1570873440000: 0,
          1570873500000: 0
        },
        lastPeriodAveragePower: 0,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 0,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });
  });

  describe("_checkLimits", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;

    let currentPeriodPredictedPower;

    let initialWarning;
    let initialAlert;

    let warningLimitPower;
    let warningLimitEnergy;
    let alertLimitPower;
    let alertLimitEnergy;

    let onWarningDeactivationMockFunc;
    let onAlertDeactivationMockFunc;
    let onWarningActivationMockFunc;
    let onAlertActivationMockFunc;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      currentPeriodPredictedPower = 100;

      warningLimitPower = 800;
      warningLimitEnergy = 200;
      alertLimitPower = 1000;
      alertLimitEnergy = 250;

      onWarningDeactivationMockFunc = jest.fn();
      onAlertDeactivationMockFunc = jest.fn();
      onWarningActivationMockFunc = jest.fn();
      onAlertActivationMockFunc = jest.fn();

      initialWarning = false;
      initialAlert = false;
    });

    let exec = async () => {
      loadmonitoringFileContent = {
        enabled: true,
        warning: initialWarning,
        alert: initialAlert,
        warningLimitPower: warningLimitPower,
        warningLimitEnergy: warningLimitEnergy,
        alertLimitPower: alertLimitPower,
        alertLimitEnergy: alertLimitEnergy,
        lossesPower: 60
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      loadmonitoring.vOnWarningDeactivation = onWarningDeactivationMockFunc;
      loadmonitoring.vOnAlertDeactivation = onAlertDeactivationMockFunc;
      loadmonitoring.vOnWarningActivation = onWarningActivationMockFunc;
      loadmonitoring.vOnAlertActivation = onAlertActivationMockFunc;

      await loadmonitoring.init();

      loadmonitoring._currentPeriodEndPredictedPower = currentPeriodPredictedPower;

      await loadmonitoring._checkLimits();
    };

    it("should activate warning if predicted active power is above warning limit", async () => {
      warningLimitPower = 1000;
      alertLimitPower = 1500;
      currentPeriodPredictedPower = 1100;

      await exec();

      expect(loadmonitoring.Warning).toEqual(true);
      expect(loadmonitoring.Alert).toEqual(false);
    });

    it("should deactivate warning if predicted active power is below warning limit", async () => {
      initialWarning = true;

      warningLimitPower = 1000;
      alertLimitPower = 1500;
      currentPeriodPredictedPower = 900;

      await exec();

      expect(loadmonitoring.Warning).toEqual(false);
      expect(loadmonitoring.Alert).toEqual(false);
    });

    it("should activate onWarningActivation if predicted active power is above warning limit - if warning was not active prevously", async () => {
      initialWarning = false;

      warningLimitPower = 1000;
      alertLimitPower = 1500;
      currentPeriodPredictedPower = 1100;

      await exec();

      expect(loadmonitoring.vOnWarningActivation).toHaveBeenCalledTimes(1);
      expect(loadmonitoring.vOnWarningActivation.mock.calls[0][0]).toEqual(
        warningLimitPower
      );
      expect(loadmonitoring.vOnWarningActivation.mock.calls[0][1]).toEqual(
        currentPeriodPredictedPower
      );

      expect(loadmonitoring.vOnWarningDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertActivation).not.toHaveBeenCalled();
    });

    it("should not activate onWarningActivation if predicted active power is above warning limit - if warning was active prevously", async () => {
      initialWarning = true;

      warningLimitPower = 1000;
      alertLimitPower = 1500;
      currentPeriodPredictedPower = 1100;

      await exec();

      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();

      expect(loadmonitoring.vOnWarningDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertActivation).not.toHaveBeenCalled();
    });

    it("should activate onWarningDeactivation if predicted active power is below warning limit - if warning was active prevously", async () => {
      initialWarning = true;

      warningLimitPower = 1000;
      alertLimitPower = 1500;
      currentPeriodPredictedPower = 900;

      await exec();

      expect(loadmonitoring.vOnWarningDeactivation).toHaveBeenCalledTimes(1);
      expect(loadmonitoring.vOnWarningDeactivation.mock.calls[0][0]).toEqual(
        warningLimitPower
      );
      expect(loadmonitoring.vOnWarningDeactivation.mock.calls[0][1]).toEqual(
        currentPeriodPredictedPower
      );

      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertActivation).not.toHaveBeenCalled();
    });

    it("should not activate onWarningDeactivation if predicted active power is below warning limit - if warning was not active prevously", async () => {
      initialWarning = false;

      warningLimitPower = 1000;
      alertLimitPower = 1500;
      currentPeriodPredictedPower = 900;

      await exec();

      expect(loadmonitoring.vOnWarningDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertActivation).not.toHaveBeenCalled();
    });

    it("should activate alert if predicted active power is above alert limit", async () => {
      warningLimitPower = 1500;
      alertLimitPower = 1000;
      currentPeriodPredictedPower = 1100;

      await exec();

      expect(loadmonitoring.Warning).toEqual(false);
      expect(loadmonitoring.Alert).toEqual(true);
    });

    it("should deactivate alert if predicted active power is below alert limit", async () => {
      initialAlert = true;

      warningLimitPower = 1500;
      alertLimitPower = 1000;
      currentPeriodPredictedPower = 900;

      await exec();

      expect(loadmonitoring.Warning).toEqual(false);
      expect(loadmonitoring.Alert).toEqual(false);
    });

    it("should activate onAlertActivation if predicted active power is above alert limit - if alert was not active prevously", async () => {
      initialAlert = false;

      warningLimitPower = 1500;
      alertLimitPower = 1000;
      currentPeriodPredictedPower = 1100;

      await exec();

      expect(loadmonitoring.vOnAlertActivation).toHaveBeenCalledTimes(1);
      expect(loadmonitoring.vOnAlertActivation.mock.calls[0][0]).toEqual(
        alertLimitPower
      );
      expect(loadmonitoring.vOnAlertActivation.mock.calls[0][1]).toEqual(
        currentPeriodPredictedPower
      );

      expect(loadmonitoring.vOnWarningDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();
    });

    it("should not activate onAlertActivation if predicted active power is above alert limit - if alert was active prevously", async () => {
      initialAlert = true;

      warningLimitPower = 1500;
      alertLimitPower = 1000;
      currentPeriodPredictedPower = 1100;

      await exec();

      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();

      expect(loadmonitoring.vOnWarningDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertActivation).not.toHaveBeenCalled();
    });

    it("should activate onAlertDeactivation if predicted active power is below alert limit - if alert was active prevously", async () => {
      initialAlert = true;

      warningLimitPower = 1500;
      alertLimitPower = 1000;
      currentPeriodPredictedPower = 900;

      await exec();

      expect(loadmonitoring.vOnAlertDeactivation).toHaveBeenCalledTimes(1);
      expect(loadmonitoring.vOnAlertDeactivation.mock.calls[0][0]).toEqual(
        alertLimitPower
      );
      expect(loadmonitoring.vOnAlertDeactivation.mock.calls[0][1]).toEqual(
        currentPeriodPredictedPower
      );

      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnWarningDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();
    });

    it("should not activate onAlertDeactivation if predicted active power is below alert limit - if alert was not active prevously", async () => {
      initialWarning = false;

      warningLimitPower = 1500;
      alertLimitPower = 1000;
      currentPeriodPredictedPower = 900;

      await exec();

      expect(loadmonitoring.vOnWarningDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnWarningActivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertDeactivation).not.toHaveBeenCalled();
      expect(loadmonitoring.vOnAlertActivation).not.toHaveBeenCalled();
    });
  });

  describe("_changeStep", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;

    let lastPeriodAveragePower;

    let newLoadmonitoringData;
    let currentStepBeginDate;
    let currentStepEndDate;
    let onStepChangedMockFunc;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };
      currentStepBeginDate = new Date(1570872000000);
      currentStepEndDate = new Date(1570872600000);
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0
        }
      };

      lastPeriodAveragePower = 2460;

      loadmonitoringFileContent = {
        enabled: true,
        warning: false,
        alert: false,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60
      };

      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      onStepChangedMockFunc = jest.fn();
    });

    let exec = async () => {
      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      loadmonitoring._lastPeriodAveragePower = lastPeriodAveragePower;

      await loadmonitoring.init();

      loadmonitoring._currentStepBeginDate = currentStepBeginDate;
      loadmonitoring._currentStepEndDate = currentStepEndDate;

      loadmonitoring.vOnStepChange = onStepChangedMockFunc;

      await loadmonitoring._changeStep(newLoadmonitoringData);
    };

    it("should calculate new loadmonitoring data based on last period average power and call onStepChange  - if it is start of a period", async () => {
      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 615,
        currentPeriodEndPredictedPower: 2460,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 41,
          1570872720000: 82,
          1570872780000: 123,
          1570872840000: 164,
          1570872900000: 205,
          1570872960000: 246,
          1570873020000: 287,
          1570873080000: 328,
          1570873140000: 369,
          1570873200000: 410,
          1570873260000: 451,
          1570873320000: 492,
          1570873380000: 533,
          1570873440000: 574,
          1570873500000: 615
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 2460,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);

      expect(onStepChangedMockFunc).toHaveBeenCalledTimes(1);
      expect(onStepChangedMockFunc.mock.calls[0][0]).toEqual(
        currentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][1]).toEqual(
        currentStepEndDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoring.CurrentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][3]).toEqual(
        loadmonitoring.CurrentStepEndDate
      );
    });

    it("should calculate new loadmonitoring data based on last step counter difference and call onStepChange  - if it is second step of actual period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1515,
        currentPeriodEndPredictedPower: 6060,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101
        },
        currentPeriodPowerValues: {
          1570872660000: 6060
        },
        currentPeriodPredictedCounterValues: {
          1570872660000: 101,
          1570872720000: 202,
          1570872780000: 303,
          1570872840000: 404,
          1570872900000: 505,
          1570872960000: 606,
          1570873020000: 707,
          1570873080000: 808,
          1570873140000: 909,
          1570873200000: 1010,
          1570873260000: 1111,
          1570873320000: 1212,
          1570873380000: 1313,
          1570873440000: 1414,
          1570873500000: 1515
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:31:00.000Z"),
        currentStepBeginEnergy: 101,
        currentStepEndDate: new Date("2019-10-12T09:32:00.000Z"),
        lastStepAveragePower: 6060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);

      expect(onStepChangedMockFunc).toHaveBeenCalledTimes(1);
      expect(onStepChangedMockFunc.mock.calls[0][0]).toEqual(
        currentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][1]).toEqual(
        currentStepEndDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoring.CurrentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][3]).toEqual(
        loadmonitoring.CurrentStepEndDate
      );
    });

    it("should calculate new loadmonitoring data based on last step counter difference and call onStepChange  - if it is inside of actual period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 300,
          1570872780000: 500,
          1570872840000: 600,
          1570872900000: 650
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1165,
        currentPeriodEndPredictedPower: 4660,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101,
          1570872720000: 302,
          1570872780000: 503,
          1570872840000: 604,
          1570872900000: 655
        },
        currentPeriodPowerValues: {
          1570872660000: 6060,
          1570872720000: 12060,
          1570872780000: 12060,
          1570872840000: 6060,
          1570872900000: 3060
        },
        currentPeriodPredictedCounterValues: {
          1570872900000: 655,
          1570872960000: 706,
          1570873020000: 757,
          1570873080000: 808,
          1570873140000: 859,
          1570873200000: 910,
          1570873260000: 961,
          1570873320000: 1012,
          1570873380000: 1063,
          1570873440000: 1114,
          1570873500000: 1165
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:35:00.000Z"),
        currentStepBeginEnergy: 655,
        currentStepEndDate: new Date("2019-10-12T09:36:00.000Z"),
        lastStepAveragePower: 3060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100,
            1570872720000: 300,
            1570872780000: 500,
            1570872840000: 600,
            1570872900000: 650
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);

      expect(onStepChangedMockFunc).toHaveBeenCalledTimes(1);
      expect(onStepChangedMockFunc.mock.calls[0][0]).toEqual(
        currentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][1]).toEqual(
        currentStepEndDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoring.CurrentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][3]).toEqual(
        loadmonitoring.CurrentStepEndDate
      );
    });

    it("should calculate new loadmonitoring data based on last step counter difference and call onStepChange   - if it is last step", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 260,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 300,
          1570872780000: 500,
          1570872840000: 600,
          1570872900000: 650,
          1570872960000: 700,
          1570873020000: 800,
          1570873080000: 900,
          1570873140000: 1000,
          1570873200000: 1250,
          1570873260000: 1300,
          1570873320000: 1400,
          1570873380000: 1500,
          1570873440000: 1650
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 1815,
        currentPeriodEndPredictedPower: 7260,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101,
          1570872720000: 302,
          1570872780000: 503,
          1570872840000: 604,
          1570872900000: 655,
          1570872960000: 706,
          1570873020000: 807,
          1570873080000: 908,
          1570873140000: 1009,
          1570873200000: 1260,
          1570873260000: 1311,
          1570873320000: 1412,
          1570873380000: 1513,
          1570873440000: 1664
        },
        currentPeriodPowerValues: {
          1570872660000: 6060,
          1570872720000: 12060,
          1570872780000: 12060,
          1570872840000: 6060,
          1570872900000: 3060,
          1570872960000: 3060,
          1570873020000: 6060,
          1570873080000: 6060,
          1570873140000: 6060,
          1570873200000: 15060,
          1570873260000: 3060,
          1570873320000: 6060,
          1570873380000: 6060,
          1570873440000: 9060
        },
        currentPeriodPredictedCounterValues: {
          1570873440000: 1664,
          1570873500000: 1815
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:44:00.000Z"),
        currentStepBeginEnergy: 1664,
        currentStepEndDate: new Date("2019-10-12T09:45:00.000Z"),
        lastStepAveragePower: 9060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0,
            1570872660000: 100,
            1570872720000: 300,
            1570872780000: 500,
            1570872840000: 600,
            1570872900000: 650,
            1570872960000: 700,
            1570873020000: 800,
            1570873080000: 900,
            1570873140000: 1000,
            1570873200000: 1250,
            1570873260000: 1300,
            1570873320000: 1400,
            1570873380000: 1500,
            1570873440000: 1650
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);

      expect(onStepChangedMockFunc).toHaveBeenCalledTimes(1);
      expect(onStepChangedMockFunc.mock.calls[0][0]).toEqual(
        currentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][1]).toEqual(
        currentStepEndDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoring.CurrentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][3]).toEqual(
        loadmonitoring.CurrentStepEndDate
      );
    });

    it("should calculate new loadmonitoring data based on last period average power and call onStepChange - if it is start of a period and lastPeriodAveragePower is 0", async () => {
      lastPeriodAveragePower = 0;

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 0,
        currentPeriodEndPredictedPower: 0,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 0,
          1570872720000: 0,
          1570872780000: 0,
          1570872840000: 0,
          1570872900000: 0,
          1570872960000: 0,
          1570873020000: 0,
          1570873080000: 0,
          1570873140000: 0,
          1570873200000: 0,
          1570873260000: 0,
          1570873320000: 0,
          1570873380000: 0,
          1570873440000: 0,
          1570873500000: 0
        },
        lastPeriodAveragePower: 0,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 0,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);

      expect(onStepChangedMockFunc).toHaveBeenCalledTimes(1);
      expect(onStepChangedMockFunc.mock.calls[0][0]).toEqual(
        currentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][1]).toEqual(
        currentStepEndDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoring.CurrentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][3]).toEqual(
        loadmonitoring.CurrentStepEndDate
      );
    });

    it("should call onStepChange even if currentStepBeginDate and currentStepEndDate are not defined", async () => {
      currentStepEndDate = undefined;
      currentStepBeginDate = undefined;

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 260,
        currentPeriodEndPredictedEnergy: 615,
        currentPeriodEndPredictedPower: 2460,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 41,
          1570872720000: 82,
          1570872780000: 123,
          1570872840000: 164,
          1570872900000: 205,
          1570872960000: 246,
          1570873020000: 287,
          1570873080000: 328,
          1570873140000: 369,
          1570873200000: 410,
          1570873260000: 451,
          1570873320000: 492,
          1570873380000: 533,
          1570873440000: 574,
          1570873500000: 615
        },
        lastPeriodAveragePower: 2460,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 2460,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 260,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);

      expect(onStepChangedMockFunc).toHaveBeenCalledTimes(1);
      expect(onStepChangedMockFunc.mock.calls[0][0]).toEqual(
        currentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][1]).toEqual(
        currentStepEndDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoring.CurrentStepBeginDate
      );
      expect(onStepChangedMockFunc.mock.calls[0][3]).toEqual(
        loadmonitoring.CurrentStepEndDate
      );
    });
  });

  describe("_changePeriod", () => {
    let fileStorage;
    let fileStorageInitPayload;

    let loadmonitoring;
    let loadmonitoringFileContent;

    let lastPeriodAveragePower;

    let newLoadmonitoringData;
    let currentStepBeginDate;
    let currentStepEndDate;

    let onValidPeriodCloseMockFunc;
    let onPeriodStepChangeMockFunc;
    let onPeriodChangeMockFunc;
    let onTransgressionMockFunc;

    let initialPeriodBeginDate;
    let initialPeriodEndDate;
    let initialPeriodBeginEnergy;
    let initialPeriodEndPredictedEnergy;
    let initialPeriodEndPredictedPower;
    let initialPeriodCounterValues;
    let initialPeriodPowerValues;
    let initialPeriodPredictedCounterValues;
    let initialLastPeriodAveragePower;
    let initialStepBeginDate;
    let initialStepBeginEnergy;
    let initialStepEndDate;
    let initialLastStepAveragePower;
    let initialLoadmonitoringData;

    beforeEach(async () => {
      fileStorage = new FileStorage();
      fileStorageInitPayload = {
        filePath: loadmonitoringPathName
      };

      initialPeriodBeginDate = new Date("2019-10-12T09:15:00.000Z");
      initialPeriodEndDate = new Date("2019-10-12T09:30:00.000Z");
      initialPeriodBeginEnergy = 123000;
      initialPeriodEndPredictedEnergy = 965;
      initialPeriodEndPredictedPower = 3860;
      initialPeriodCounterValues = {
        1570871700000: 0,
        1570871760000: 101,
        1570871820000: 152,
        1570871880000: 203,
        1570871940000: 304,
        1570872000000: 355,
        1570872060000: 406,
        1570872120000: 457,
        1570872180000: 608,
        1570872240000: 659,
        1570872300000: 710,
        1570872360000: 761,
        1570872420000: 762,
        1570872480000: 863,
        1570872540000: 914
      };
      initialPeriodPowerValues = {
        1570871760000: 101,
        1570871820000: 51,
        1570871880000: 51,
        1570871940000: 101,
        1570872000000: 51,
        1570872060000: 51,
        1570872120000: 51,
        1570872180000: 151,
        1570872240000: 51,
        1570872300000: 51,
        1570872360000: 51,
        1570872420000: 1,
        1570872480000: 101,
        1570872540000: 51
      };
      initialPeriodPredictedCounterValues = {
        1570872540000: 914,
        1570872600000: 965
      };
      initialLastPeriodAveragePower = 0;
      initialStepBeginDate = new Date("2019-10-12T09:29:00.000Z");
      initialStepBeginEnergy = 914;
      initialStepEndDate = new Date("2019-10-12T09:30:00.000Z");
      initialLastStepAveragePower = 3060;
      initialLoadmonitoringData = {
        initialCounterValue: 123000,
        counters: {
          1570871700000: 0,
          1570871760000: 100,
          1570871820000: 150,
          1570871880000: 200,
          1570871940000: 300,
          1570872000000: 350,
          1570872060000: 400,
          1570872120000: 450,
          1570872180000: 600,
          1570872240000: 650,
          1570872300000: 700,
          1570872360000: 750,
          1570872420000: 750,
          1570872480000: 850,
          1570872540000: 900
        }
      };

      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0
        }
      };

      loadmonitoringFileContent = {
        enabled: true,
        warning: false,
        alert: false,
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60
      };

      onValidPeriodCloseMockFunc = jest.fn();
      onPeriodStepChangeMockFunc = jest.fn();
      onPeriodChangeMockFunc = jest.fn();
      onTransgressionMockFunc = jest.fn();
    });

    let exec = async () => {
      await writeFileAsync(
        loadmonitoringPathName,
        JSON.stringify(loadmonitoringFileContent)
      );

      await fileStorage.init(fileStorageInitPayload);

      loadmonitoring = new Loadmonitoring(fileStorage);

      loadmonitoring._lastPeriodAveragePower = lastPeriodAveragePower;

      await loadmonitoring.init();

      loadmonitoring.vOnStepChange = onPeriodStepChangeMockFunc;
      loadmonitoring.vOnValidPeriodClose = onValidPeriodCloseMockFunc;
      loadmonitoring.vOnPeriodChange = onPeriodChangeMockFunc;
      loadmonitoring.vOnTransgression = onTransgressionMockFunc;

      loadmonitoring._currentPeriodBeginDate = initialPeriodBeginDate;
      loadmonitoring._currentPeriodEndDate = initialPeriodEndDate;
      loadmonitoring._currentPeriodBeginEnergy = initialPeriodBeginEnergy;
      loadmonitoring._currentPeriodEndPredictedEnergy = initialPeriodEndPredictedEnergy;
      loadmonitoring._currentPeriodEndPredictedPower = initialPeriodEndPredictedPower;
      loadmonitoring._currentPeriodCounterValues = initialPeriodCounterValues;
      loadmonitoring._currentPeriodPowerValues = initialPeriodPowerValues;
      loadmonitoring._currentPeriodPredictedCounterValues = initialPeriodPredictedCounterValues;
      loadmonitoring._lastPeriodAveragePower = initialLastPeriodAveragePower;
      loadmonitoring._currentStepBeginDate = initialStepBeginDate;
      loadmonitoring._currentStepBeginEnergy = initialStepBeginEnergy;
      loadmonitoring._currentStepEndDate = initialStepEndDate;
      loadmonitoring._lastStepAveragePower = initialLastStepAveragePower;
      loadmonitoring._currentLoadmonitoringData = initialLoadmonitoringData;

      await loadmonitoring._changePeriod(newLoadmonitoringData);
    };

    it("should calculate new loadmonitoring data based on last period average power - if period can be closed properly and new loadmonitoring data starts from first step", async () => {
      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 1020,
        currentPeriodEndPredictedEnergy: 1035,
        currentPeriodEndPredictedPower: 4140,
        currentPeriodCounterValues: {
          1570872600000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570872600000: 0,
          1570872660000: 69,
          1570872720000: 138,
          1570872780000: 207,
          1570872840000: 276,
          1570872900000: 345,
          1570872960000: 414,
          1570873020000: 483,
          1570873080000: 552,
          1570873140000: 621,
          1570873200000: 690,
          1570873260000: 759,
          1570873320000: 828,
          1570873380000: 897,
          1570873440000: 966,
          1570873500000: 1035
        },
        lastPeriodAveragePower: 4140,
        currentStepBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:31:00.000Z"),
        lastStepAveragePower: 4140,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 1020,
          counters: {
            1570872600000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should call onValidPeriodClose if period was closed properly and new loadmonitoring data starts from first step", async () => {
      await exec();

      expect(onValidPeriodCloseMockFunc).toHaveBeenCalledTimes(1);
      expect(onValidPeriodCloseMockFunc.mock.calls[0][0]).toEqual(
        initialPeriodBeginDate
      );
      expect(onValidPeriodCloseMockFunc.mock.calls[0][1]).toEqual(
        initialPeriodEndDate
      );
      expect(onValidPeriodCloseMockFunc.mock.calls[0][2]).toEqual(4140);
    });

    it("should call onTransgression if period was closed properly and new loadmonitoring data starts from first step and last period average active power is above given alert limit", async () => {
      await exec();

      expect(onTransgressionMockFunc).toHaveBeenCalledTimes(1);
      expect(onTransgressionMockFunc.mock.calls[0][0]).toEqual(
        initialPeriodBeginDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][1]).toEqual(
        initialPeriodEndDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoringFileContent.alertLimitPower
      );
      expect(onTransgressionMockFunc.mock.calls[0][3]).toEqual(4140);
    });

    it("should not call onTransgression if period was closed properly and new loadmonitoring data starts from first step but last period average active power is below given alert limit", async () => {
      loadmonitoringFileContent.alertLimitPower = 5000;

      await exec();

      expect(onTransgressionMockFunc).not.toHaveBeenCalled();
    });

    it("should calculate new loadmonitoring data based on last period average power - if period can be closed properly and new loadmonitoring data starts from step inside period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 500
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 1020,
        currentPeriodEndPredictedEnergy: 2515,
        currentPeriodEndPredictedPower: 10060,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 101,
          1570872720000: 152,
          1570872780000: 253,
          1570872840000: 304,
          1570872900000: 505
        },
        currentPeriodPowerValues: {
          1570872660000: 6060,
          1570872720000: 3060,
          1570872780000: 6060,
          1570872840000: 3060,
          1570872900000: 12060
        },
        currentPeriodPredictedCounterValues: {
          1570872900000: 505,
          1570872960000: 706,
          1570873020000: 907,
          1570873080000: 1108,
          1570873140000: 1309,
          1570873200000: 1510,
          1570873260000: 1711,
          1570873320000: 1912,
          1570873380000: 2113,
          1570873440000: 2314,
          1570873500000: 2515
        },
        lastPeriodAveragePower: 4140,
        currentStepBeginDate: new Date("2019-10-12T09:35:00.000Z"),
        currentStepBeginEnergy: 505,
        currentStepEndDate: new Date("2019-10-12T09:36:00.000Z"),
        lastStepAveragePower: 12060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 1020,
          counters: {
            1570872600000: 0,
            1570872660000: 100,
            1570872720000: 150,
            1570872780000: 250,
            1570872840000: 300,
            1570872900000: 500
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should call onValidPeriodClose if period was closed properly and new loadmonitoring data starts from step inside period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 500
        }
      };

      await exec();

      expect(onValidPeriodCloseMockFunc).toHaveBeenCalledTimes(1);
      expect(onValidPeriodCloseMockFunc.mock.calls[0][0]).toEqual(
        initialPeriodBeginDate
      );
      expect(onValidPeriodCloseMockFunc.mock.calls[0][1]).toEqual(
        initialPeriodEndDate
      );
      expect(onValidPeriodCloseMockFunc.mock.calls[0][2]).toEqual(4140);
    });

    it("should call onTransgression if period was closed properly and new loadmonitoring data starts from step inside period and last period average active power is above given alert limit", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 500
        }
      };
      await exec();

      expect(onTransgressionMockFunc).toHaveBeenCalledTimes(1);
      expect(onTransgressionMockFunc.mock.calls[0][0]).toEqual(
        initialPeriodBeginDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][1]).toEqual(
        initialPeriodEndDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoringFileContent.alertLimitPower
      );
      expect(onTransgressionMockFunc.mock.calls[0][3]).toEqual(4140);
    });

    it("should not call onTransgression if period was closed properly and new loadmonitoring data starts from step inside period but last period average active power is below given alert limit", async () => {
      loadmonitoringFileContent.alertLimitPower = 5000;
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 100,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 500
        }
      };
      await exec();

      expect(onTransgressionMockFunc).not.toHaveBeenCalled();
    });

    it("should calculate new loadmonitoring data based on last period average power - if period can be closed properly and new loadmonitoring data starts from last step", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 50,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 400,
          1570872960000: 500,
          1570873020000: 600,
          1570873080000: 650,
          1570873140000: 750,
          1570873200000: 750,
          1570873260000: 850,
          1570873320000: 900,
          1570873380000: 900,
          1570873440000: 1000
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:30:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 1020,
        currentPeriodEndPredictedEnergy: 1115,
        currentPeriodEndPredictedPower: 4460,
        currentPeriodCounterValues: {
          1570872600000: 0,
          1570872660000: 51,
          1570872720000: 152,
          1570872780000: 253,
          1570872840000: 304,
          1570872900000: 405,
          1570872960000: 506,
          1570873020000: 607,
          1570873080000: 658,
          1570873140000: 759,
          1570873200000: 760,
          1570873260000: 861,
          1570873320000: 912,
          1570873380000: 913,
          1570873440000: 1014
        },
        currentPeriodPowerValues: {
          1570872660000: 60 * 51,
          1570872720000: 60 * 101,
          1570872780000: 60 * 101,
          1570872840000: 60 * 51,
          1570872900000: 60 * 101,
          1570872960000: 60 * 101,
          1570873020000: 60 * 101,
          1570873080000: 60 * 51,
          1570873140000: 60 * 101,
          1570873200000: 60 * 1,
          1570873260000: 60 * 101,
          1570873320000: 60 * 51,
          1570873380000: 60 * 1,
          1570873440000: 60 * 101
        },
        currentPeriodPredictedCounterValues: {
          1570873440000: 1014,
          1570873500000: 1115
        },
        lastPeriodAveragePower: 4140,
        currentStepBeginDate: new Date("2019-10-12T09:44:00.000Z"),
        currentStepBeginEnergy: 1014,
        currentStepEndDate: new Date("2019-10-12T09:45:00.000Z"),
        lastStepAveragePower: 6060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 1020,
          counters: {
            1570872600000: 0,
            1570872660000: 50,
            1570872720000: 150,
            1570872780000: 250,
            1570872840000: 300,
            1570872900000: 400,
            1570872960000: 500,
            1570873020000: 600,
            1570873080000: 650,
            1570873140000: 750,
            1570873200000: 750,
            1570873260000: 850,
            1570873320000: 900,
            1570873380000: 900,
            1570873440000: 1000
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should call onValidPeriodClose if period was closed properly and new loadmonitoring data starts from last step", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 50,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 400,
          1570872960000: 500,
          1570873020000: 600,
          1570873080000: 650,
          1570873140000: 750,
          1570873200000: 750,
          1570873260000: 850,
          1570873320000: 900,
          1570873380000: 900,
          1570873440000: 1000
        }
      };

      await exec();

      expect(onValidPeriodCloseMockFunc).toHaveBeenCalledTimes(1);
      expect(onValidPeriodCloseMockFunc.mock.calls[0][0]).toEqual(
        initialPeriodBeginDate
      );
      expect(onValidPeriodCloseMockFunc.mock.calls[0][1]).toEqual(
        initialPeriodEndDate
      );
      expect(onValidPeriodCloseMockFunc.mock.calls[0][2]).toEqual(4140);
    });

    it("should call onTransgression if period was closed properly and new loadmonitoring data starts from last step and last period average active power is above given alert limit", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 50,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 400,
          1570872960000: 500,
          1570873020000: 600,
          1570873080000: 650,
          1570873140000: 750,
          1570873200000: 750,
          1570873260000: 850,
          1570873320000: 900,
          1570873380000: 900,
          1570873440000: 1000
        }
      };
      await exec();

      expect(onTransgressionMockFunc).toHaveBeenCalledTimes(1);
      expect(onTransgressionMockFunc.mock.calls[0][0]).toEqual(
        initialPeriodBeginDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][1]).toEqual(
        initialPeriodEndDate
      );
      expect(onTransgressionMockFunc.mock.calls[0][2]).toEqual(
        loadmonitoringFileContent.alertLimitPower
      );
      expect(onTransgressionMockFunc.mock.calls[0][3]).toEqual(4140);
    });

    it("should not call onTransgression if period was closed properly and new loadmonitoring data starts from last step but last period average active power is below given alert limit", async () => {
      loadmonitoringFileContent.alertLimitPower = 5000;
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570872600000: 0,
          1570872660000: 50,
          1570872720000: 150,
          1570872780000: 250,
          1570872840000: 300,
          1570872900000: 400,
          1570872960000: 500,
          1570873020000: 600,
          1570873080000: 650,
          1570873140000: 750,
          1570873200000: 750,
          1570873260000: 850,
          1570873320000: 900,
          1570873380000: 900,
          1570873440000: 1000
        }
      };
      await exec();

      expect(onTransgressionMockFunc).not.toHaveBeenCalled();
    });

    it("should not close current period properly, but perform calculation using average power as 0 - if period cannot be closed correctly due to invalid new period date and it is first step of period", async () => {
      //one step ahead
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570873500000: 0
        }
      };

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T10:00:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 1020,
        currentPeriodEndPredictedEnergy: 0,
        currentPeriodEndPredictedPower: 0,
        currentPeriodCounterValues: {
          1570873500000: 0
        },
        currentPeriodPowerValues: {},
        currentPeriodPredictedCounterValues: {
          1570873500000: 0,
          1570873560000: 0,
          1570873620000: 0,
          1570873680000: 0,
          1570873740000: 0,
          1570873800000: 0,
          1570873860000: 0,
          1570873920000: 0,
          1570873980000: 0,
          1570874040000: 0,
          1570874100000: 0,
          1570874160000: 0,
          1570874220000: 0,
          1570874280000: 0,
          1570874340000: 0,
          1570874400000: 0
        },
        lastPeriodAveragePower: 0,
        currentStepBeginDate: new Date("2019-10-12T09:45:00.000Z"),
        currentStepBeginEnergy: 0,
        currentStepEndDate: new Date("2019-10-12T09:46:00.000Z"),
        lastStepAveragePower: 0,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 1020,
          counters: {
            1570873500000: 0
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      await exec();

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should not call onValidPeriodClose - if period cannot be closed correctly due to invalid new period date and it is first step of period", async () => {
      //one step ahead
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570873500000: 0
        }
      };

      await exec();

      expect(onValidPeriodCloseMockFunc).not.toHaveBeenCalled();
    });

    it("should calculate new loadmonitoring data based on last period average power - if period can not be closed properly and new loadmonitoring data starts from step inside period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570873500000: 0,
          1570873560000: 100,
          1570873620000: 150,
          1570873680000: 250,
          1570873740000: 300,
          1570873800000: 500
        }
      };

      await exec();

      let expectedPayload = {
        enabled: true,
        warning: false,
        alert: false,
        active: false,
        currentPeriodBeginDate: new Date("2019-10-12T09:45:00.000Z"),
        currentPeriodEndDate: new Date("2019-10-12T10:00:00.000Z"),
        currentPeriodBeginEnergy: 123000 + 1020,
        currentPeriodEndPredictedEnergy: 2515,
        currentPeriodEndPredictedPower: 10060,
        currentPeriodCounterValues: {
          1570873500000: 0,
          1570873560000: 101,
          1570873620000: 152,
          1570873680000: 253,
          1570873740000: 304,
          1570873800000: 505
        },
        currentPeriodPowerValues: {
          1570873560000: 6060,
          1570873620000: 3060,
          1570873680000: 6060,
          1570873740000: 3060,
          1570873800000: 12060
        },
        currentPeriodPredictedCounterValues: {
          1570873800000: 505,
          1570873860000: 706,
          1570873920000: 907,
          1570873980000: 1108,
          1570874040000: 1309,
          1570874100000: 1510,
          1570874160000: 1711,
          1570874220000: 1912,
          1570874280000: 2113,
          1570874340000: 2314,
          1570874400000: 2515
        },
        lastPeriodAveragePower: 0,
        currentStepBeginDate: new Date("2019-10-12T09:50:00.000Z"),
        currentStepBeginEnergy: 505,
        currentStepEndDate: new Date("2019-10-12T09:51:00.000Z"),
        lastStepAveragePower: 12060,
        currentLoadmonitoringData: {
          initialCounterValue: 123000 + 1020,
          counters: {
            1570873500000: 0,
            1570873560000: 100,
            1570873620000: 150,
            1570873680000: 250,
            1570873740000: 300,
            1570873800000: 500
          }
        },
        warningLimitPower: 800,
        warningLimitEnergy: 200,
        alertLimitPower: 1000,
        alertLimitEnergy: 250,
        lossesPower: 60,
        lossesEnergyPerPeriod: 15,
        lossesEnergyPerStep: 1
      };

      expect(loadmonitoring.Payload).toEqual(expectedPayload);
    });

    it("should not call onValidPeriodClose if period was not closed properly and new loadmonitoring data starts from step inside period", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570873500000: 0,
          1570873560000: 100,
          1570873620000: 150,
          1570873680000: 250,
          1570873740000: 300,
          1570873800000: 500
        }
      };

      await exec();

      expect(onValidPeriodCloseMockFunc).not.toHaveBeenCalled();
    });

    it("should not call onTransgression if period was not closed properly", async () => {
      newLoadmonitoringData = {
        initialCounterValue: 123000 + 1020,
        counters: {
          1570873500000: 0,
          1570873560000: 100,
          1570873620000: 150,
          1570873680000: 250,
          1570873740000: 300,
          1570873800000: 500
        }
      };

      await exec();

      expect(onTransgressionMockFunc).not.toHaveBeenCalled();
    });
  });

  //TO DO!!!!
  //CHECK _refresh !!
});
