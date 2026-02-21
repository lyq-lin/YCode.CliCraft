"use strict";
const electron = require("electron");
const api = {
  getProfiles: () => electron.ipcRenderer.invoke("getProfiles"),
  getCliTypes: () => electron.ipcRenderer.invoke("getCliTypes"),
  getProviders: (cliTypeId) => electron.ipcRenderer.invoke("getProviders", cliTypeId),
  saveProfile: (profile) => electron.ipcRenderer.invoke("saveProfile", profile),
  deleteProfile: (id) => electron.ipcRenderer.invoke("deleteProfile", id),
  launchProfile: (profileId, scope) => electron.ipcRenderer.invoke("launchProfile", profileId, scope),
  detectCliStatus: () => electron.ipcRenderer.invoke("detectCliStatus")
};
electron.contextBridge.exposeInMainWorld("clicraft", api);
