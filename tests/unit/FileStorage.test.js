const path = require("path");
const {
  clearDirectoryAsync,
  readFileAsync,
  checkIfDirectoryExistsAsync,
  createDirAsync,
  removeDirectoryAsync,
  writeFileAsync
} = require("../../utilities/utilities");

const FileStorage = require("../../classes/Storage/FileStorage");

let fileStorageFileName = "testFileStorage";
let fileStorageDirName = "__testDir/TestDirStorage";

let fileStoragePathName = path.resolve(
  path.join(fileStorageDirName, fileStorageFileName)
);

describe("FileStorage", () => {
  beforeEach(async () => {
    //Creating clear directory if not exists
    let dirExists = await checkIfDirectoryExistsAsync(fileStorageDirName);
    if (dirExists) await clearDirectoryAsync(fileStorageDirName);
    else createDirAsync(fileStorageDirName);
  });

  afterEach(async () => {
    //Deleting directory if exists
    let dirExists = await checkIfDirectoryExistsAsync(fileStorageDirName);
    if (dirExists) await removeDirectoryAsync(fileStorageDirName);
  });

  describe("constructor", () => {
    let exec = () => {
      return new FileStorage();
    };

    it("should create new FileStorage object", () => {
      let result = exec();
      expect(result).toBeDefined();
    });

    it("should set Initialized to false", () => {
      let result = exec();
      expect(result.Initialized).toEqual(false);
    });
  });

  describe("init", () => {
    let fileStorage;
    let initPayload;

    beforeEach(() => {
      initPayload = {
        filePath: fileStoragePathName
      };
    });

    let exec = () => {
      fileStorage = new FileStorage(fileStoragePathName);
      return fileStorage.init(initPayload);
    };

    it("should set Initialized to true", async () => {
      await exec();
      expect(fileStorage.Initialized).toEqual(true);
    });

    it("should set FilePath property", async () => {
      await exec();
      expect(fileStorage.FilePath).toEqual(initPayload.filePath);
    });

    it("should throw if initpayload is null", async () => {
      initPayload = null;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();
    });

    it("should throw if initpayload is undefined", async () => {
      initPayload = undefined;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();
    });

    it("should throw if initpayload is an empty", async () => {
      initPayload = {};

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      //Initialized should not be set to true
      expect(fileStorage.Initialized).toEqual(false);
    });

    it("should throw if initpayload has filePath as an empty string", async () => {
      initPayload = {
        filePath: ""
      };

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      //Initialized should not be set to true
      expect(fileStorage.Initialized).toEqual(false);
    });

    it("should throw if initpayload has filePath is not a valid string", async () => {
      initPayload = {
        filePath: 1234
      };

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      //Initialized should not be set to true
      expect(fileStorage.Initialized).toEqual(false);
    });

    it("should not re set filePath if storage is already intialized", async () => {
      await exec();

      await fileStorage.init({
        filePath: "secondPath"
      });

      expect(fileStorage.FilePath).toEqual(initPayload.filePath);
    });
  });

  describe("load", () => {
    let createFile;
    let initStorage;
    let fileContent;
    let fileStorage;
    let initPayload;

    beforeEach(() => {
      initStorage = true;

      initPayload = {
        filePath: fileStoragePathName
      };

      createFile = true;

      fileContent = {
        property1: "property1Value",
        property2: "property2Value",
        property3: "property3Value"
      };
    });

    let exec = async () => {
      if (createFile)
        await writeFileAsync(fileStoragePathName, JSON.stringify(fileContent));

      fileStorage = new FileStorage(fileStoragePathName);

      if (initStorage) await fileStorage.init(initPayload);

      return fileStorage.load();
    };

    it("should return content of file", async () => {
      let result = await exec();
      expect(result).toEqual(fileContent);
    });

    it("should return empty object if fileContent is empty", async () => {
      fileContent = {};
      let result = await exec();
      expect(result).toEqual({});
    });

    it("should return empty object if there is no file for given path", async () => {
      createFile = false;

      let result = await exec();
      expect(result).toEqual({});
    });

    it("should throw if storage has not been initialized", async () => {
      initStorage = false;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();
    });
  });

  describe("save", () => {
    let createInitialFile;
    let initStorage;
    let fileContent;
    let initialFileContent;
    let fileStorage;
    let initPayload;

    beforeEach(() => {
      initStorage = true;

      initPayload = {
        filePath: fileStoragePathName
      };

      createInitialFile = true;

      initialFileContent = {
        property3: "property3Value",
        property4: "property4Value",
        property5: "property5Value"
      };

      fileContent = {
        property1: "property1Value",
        property2: "property2Value",
        property3: "property3Value"
      };
    });

    let exec = async () => {
      if (createInitialFile)
        await writeFileAsync(
          fileStoragePathName,
          JSON.stringify(initialFileContent)
        );

      fileStorage = new FileStorage(fileStoragePathName);

      if (initStorage) await fileStorage.init(initPayload);

      return fileStorage.save(fileContent);
    };

    it("should create file and save content to it - if file does not exist", async () => {
      createInitialFile = false;

      await exec();

      let content = JSON.parse(await readFileAsync(fileStoragePathName));

      expect(content).toEqual(fileContent);
    });
  });
});
