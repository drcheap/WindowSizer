"use strict";

const CURRENT_STORAGE_VERSION = 2;

const MSGTYPE_APPLY_PRESET = "applyPreset";
const MSGTYPE_GET_SHORTCUT = "getShortcutKey";

const PREFIX_PRESET = "preset-";
const PREFIX_EDIT = "edit-";
const PREFIX_UPDATE = "update-";
const PREFIX_RESTORE = "restore-";
const PREFIX_REMOVE = "remove-";
const PREFIX_SAVE = "save-";
const PREFIX_CANCEL = "cancel-";
const PREFIX_DOWN = "down-"
const PREFIX_UP = "up-"

const DEFAULT_POPUP = "toolbar_menu.html";

async function applyQuickResizeSetting()
{
   const storage = await browser.storage.local.get(["options","presets"]);
   const options = storage.options;
   const presets = storage.presets;

   let newTitle = null;  // Says to use default from manifest
   let newPopup = "";    // Says to not have one
   if(options.useQuickResizeMode && presets.length > 0)
   {
      newTitle = await browser.browserAction.getTitle({}) + " - Quick Resize mode active, click to apply preset";
   }
   else
   {
      newPopup = DEFAULT_POPUP;
   }

   browser.browserAction.setTitle({ title: newTitle });
   browser.browserAction.setPopup({ popup: newPopup });
}

async function applyPreset(presetId)
{
   console.debug("Applying preset: " + presetId);

   const storage = await browser.storage.local.get("presets");
   const presets = storage.presets;
   for(let i = 0;i < presets.length;i++)
   {
      if(presets[i].id == presetId)
      {
         await resizeWindow(presets[i].width,presets[i].height);
         break;
      }
   }
}

async function resizeWindow(newWidth, newHeight)
{
   console.debug("Resizing to: " + newWidth + "x" + newHeight);

   const updateInfo = {
      "width": parseInt(newWidth),
      "height": parseInt(newHeight)
   };

   const currentWindow = await browser.windows.getCurrent();
   await browser.windows.update(currentWindow.id, updateInfo);
}

async function getShortcutKey(commandName)
{
   console.debug("Retrieving shortcut for " + commandName);

   let shortcutKey = "(none)";

   const commands = await browser.commands.getAll();
   for(let command of commands)
   {
      if(command.name == commandName)
      {
         shortcutKey = command.shortcut;
         break;
      }
   }

   return shortcutKey;
}
