"use strict";
const electron = require("electron");
const api = {
  getProfiles: () => electron.ipcRenderer.invoke("getProfiles"),
  getCliTypes: () => electron.ipcRenderer.invoke("getCliTypes"),
  saveProfile: (profile) => electron.ipcRenderer.invoke("saveProfile", profile),
  deleteProfile: (id) => electron.ipcRenderer.invoke("deleteProfile", id),
  getActiveProfileId: () => electron.ipcRenderer.invoke("getActiveProfileId"),
  setActiveProfileId: (id) => electron.ipcRenderer.invoke("setActiveProfileId", id),
  activateProfile: (profileId) => electron.ipcRenderer.invoke("activateProfile", profileId)
};
electron.contextBridge.exposeInMainWorld("clicraft", api);
