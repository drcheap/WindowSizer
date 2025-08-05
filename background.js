/**
 * We need to cache this setting in global state, because looking up the user's preference from storage is async.
 * Making the async call in the browserAction click handler can lose "transient activation" state and results in "user gesture" errors.
 * This needs to be updated any time the Quick Resize option is changed OR the number of presets changes to/from 0.
 */
var _quickResizePresetID = null;
async function updateCachedQuickResize()
{
   const storage = await browser.storage.local.get(["options","presets"]);
   _quickResizePresetID = storage.options.useQuickResizeMode && storage.presets.length > 0 ? storage.presets[0].id : null;
   console.debug("Updated _quickResizePresetID to " + _quickResizePresetID);
}

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
   updateCachedQuickResize();

   console.debug("Initialization complete...");
   console.debug("   Storage version: " + storage.version);
   console.debug("   Preset count: " + storage.presets.length);
   console.debug("   Option count: " + Object.keys(storage.options).length);
   console.debug("   Advanced count: " + Object.keys(storage.advanced).length);
}

function storageChangeHandler(changes, areaName)
{
   console.debug("Storage change for " + areaName, changes);

   if(areaName === "local" && (changes.options || changes.presets))
   {
      updateCachedQuickResize();
   }
}

// Hotkey handler
async function handleCommand(command)
{
   console.debug("Handling command: " + command);

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

function toolbarClickHandler()
{
   console.debug("Toolbar clicked");

   if(_quickResizePresetID)
   {
      applyPreset(_quickResizePresetID);
   }
   else
   {
      browser.browserAction.openPopup();
   }
}

browser.runtime.onInstalled.addListener(initialize);
browser.storage.onChanged.addListener(storageChangeHandler);
browser.commands.onCommand.addListener(handleCommand);
browser.browserAction.onClicked.addListener(toolbarClickHandler);

const manifest = browser.runtime.getManifest();
console.info(manifest.name + " version " + manifest.version + " by " + manifest.author);
