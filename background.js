const STORAGE_VERSION = 2;

async function initialize(details)
{
   console.log("(init) Initializing...");

   // Preset initialization, if needed
   let storage = await browser.storage.local.get(["presets","version"]);

   if(!Array.isArray(storage.presets))
   {
      console.log("(init) No presets found, initializing...");
      storage.presets = [];
      await browser.storage.local.set({"presets": storage.presets});
   }
   else
   {
      if(storage.version === undefined)
      {
         // Had non-versioned preset storage, so treat it as version 1
         storage.version = 1;
      }
   }

   if(Number.isInteger(storage.version))
   {
      if(storage.version < STORAGE_VERSION)
      {
         // Storage is old, do any necessary upgrades to remain compatible

         if(storage.version == 1)
         {
            console.log("(update) Migrating storage from version 1 to 2...");
            await browser.storage.local.set({"version": 2});
            storage.version = 2;
         }

         // (future storage updates here)
      }
   }
   else
   {
      console.log("(init) No storage version tag found, initializing...");
      await browser.storage.local.set({"version": STORAGE_VERSION});
   }

   console.log("(init) Initialization complete, " + storage.presets.length + " presets found");
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
