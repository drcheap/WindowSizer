async function initialize(details)
{
   console.debug("Initializing...");

   // Preset initialization, if needed
   const storage = await browser.storage.local.get(["version","presets","options","advanced"]);
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
            console.warn("Migrating storage from version 1 to 2...");
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
      console.info("No storage version tag found, initializing...");
      await browser.storage.local.set({"version": CURRENT_STORAGE_VERSION});
   }

   if(!Array.isArray(storage.presets))
   {
      console.info("No presets found, initializing...");
      storage.presets = [];
      await browser.storage.local.set({"presets": storage.presets});
   }

   if(storage.options === undefined)
   {
      console.info("No options found, initializing...");
      storage.options = {};
      await browser.storage.local.set({"options": storage.options});
   }

   if(storage.advanced === undefined)
   {
      console.info("No advanced settings found, initializing...");
      storage.advanced = {};
      await browser.storage.local.set({"advanced": storage.advanced});
   }

   applyQuickResizeSetting();

   console.debug("Initialization complete...");
   console.debug("   Storage version: " + storage.version);
   console.debug("   Preset count: " + storage.presets.length);
   console.debug("   Option count: " + Object.keys(storage.options).length);
   console.debug("   Advanced count: " + Object.keys(storage.advanced).length);
}

// Hotkey handler
async function handleCommand(command)
{
   console.debug("handling command: " + command);

   if(command.startsWith(PREFIX_PRESET))
   {
      const presetNum = parseInt(command.substring(PREFIX_PRESET.length));
      const storage = await browser.storage.local.get("presets");
      const presets = storage.presets;
      if(presetNum <= presets.length)
      {
         const presetId = presets[presetNum - 1].id;
         applyPreset(presetId);
      }
   }
}

async function toolbarClickHandler()
{
   console.debug("Toolbar clicked");

   const storage = await browser.storage.local.get(["presets","options"]);
   const presets = storage.presets;
   const options = storage.options;

   useQuickResizeMode = options.useQuickResizeMode !== undefined && options.useQuickResizeMode;
   if(useQuickResizeMode && presets.length > 0)
   {
      applyPreset(presets[0].id);
   }
   else
   {
      browser.browserAction.openPopup();
   }
}

browser.runtime.onInstalled.addListener(initialize);
browser.commands.onCommand.addListener(handleCommand);
browser.browserAction.onClicked.addListener(toolbarClickHandler);

const manifest = browser.runtime.getManifest();
console.info(manifest.name + " version " + manifest.version + " by " + manifest.author);
