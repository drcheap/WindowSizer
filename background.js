"use strict";

const CURRENT_STORAGE_VERSION = 2;

async function initialize(details)
{
   console.log("(init) Initializing...");

   // Preset initialization, if needed
   let storage = await browser.storage.local.get(["version","presets","options","advanced"]);
   if(storage.version === undefined)
   {
      // Had non-versioned preset storage, so treat it as version 1
      storage.version = 1;
   }

   if(Number.isInteger(storage.version))
   {
      if(storage.version < CURRENT_STORAGE_VERSION)
      {
         // Storage is old, do any necessary upgrades to remain compatible

         if(storage.version == 1)
         {
            console.log("(update) Migrating storage from version 1 to 2...");
            storage.version = 2;
         }

         if(storage.version == 2)
         {
            // (future storage updates here)
         }

         await browser.storage.local.set({"version": storage.version});
      }
   }
   else
   {
      console.log("(init) No storage version tag found, initializing...");
      await browser.storage.local.set({"version": CURRENT_STORAGE_VERSION});
   }

   if(!Array.isArray(storage.presets))
   {
      console.log("(init) No presets found, initializing...");
      storage.presets = [];
      await browser.storage.local.set({"presets": storage.presets});
   }

   if(storage.options === undefined)
   {
      console.log("(init) No options found, initializing...");
      storage.options = {};
      await browser.storage.local.set({"options": storage.options});
   }

   if(storage.advanced === undefined)
   {
      console.log("(init) No advanced settings found, initializing...");
      storage.advanced = {};
      await browser.storage.local.set({"advanced": storage.advanced});
   }

   console.log("(init) Initialization complete...");
   console.log("(init)    Storage version: " + storage.version);
   console.log("(init)    Preset count: " + storage.presets.length);
   console.log("(init)    Option count: " + Object.keys(storage.options).length);
   console.log("(init)    Advanced count: " + Object.keys(storage.advanced).length);
}

async function handleCommand(command)
{
   console.log("(background) handling command: " + command);

   if(command.startsWith(PREFIX_PRESET))
   {
      let presetNum = parseInt(command.substring(PREFIX_PRESET.length));
      let storage = await browser.storage.local.get("presets");
      let presets = storage.presets;
      if(presetNum <= presets.length)
      {
         let presetId = presets[presetNum - 1].id;
         applyPreset(presetId);
      }
   }
}

browser.runtime.onInstalled.addListener(initialize);
browser.commands.onCommand.addListener(handleCommand);
