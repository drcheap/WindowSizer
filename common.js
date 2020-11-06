const PREFIX_PRESET = "preset-"; // Must match the one in options.js

async function applyPreset(presetId)
{
   console.log("(common) applying preset: " + presetId);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
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
   console.log("(common) resizing to: " + newWidth + "x" + newHeight);

   let updateInfo = {
      "width": parseInt(newWidth),
      "height": parseInt(newHeight)
   };

   let currentWindow = await browser.windows.getCurrent();
   browser.windows.update(currentWindow.id, updateInfo);
}

async function getShortcutKey(commandName)
{
   console.log("(common) retrieving shortcut for " + commandName);

   let shortcutKey = "(none)";

   let commands = await browser.commands.getAll();
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
